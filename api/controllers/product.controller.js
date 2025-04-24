import Product from '../models/products.schema.js'
import ProductVariation from '../models/product-variation.schema.js'
import ProductDescription from '../models/product-description.schema.js'
import ProductPricing from '../models/product-pricing.schema.js'
import handleError from './../utils/handleError.js';
import  {matchedData}  from 'express-validator';
import mongoose from 'mongoose'
import  httpStatus  from 'http-status';
import buildResponse from '../utils/buildResponse.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import path from 'path';
import { REDIS_KEYS, redisClient } from '../redis/redis.config.js';
import { buildProductFilters, handleRedisLikeStatus } from '../helpers/buildProductFilter.js';





export const getProductsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const userId = req.user ? req.user._id : null;
    
    let page = validatedData?.page ? parseInt(validatedData.page) : 1;
    let limit = validatedData?.limit ? Math.min(parseInt(validatedData.limit), 50) : 10;
    const skip = (page - 1) * limit;
    
    // Start with base pipeline for products
    const pipeline = [
      {
        $lookup: {
          from: 'ProductPricing',
          localField: '_id',
          foreignField: 'productId',
          as: 'pricingData'
        }
      },
      {
        $unwind: {
          path: '$pricingData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'Sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerData'
        }
      },
      { $unwind: '$sellerData' }
    ];
    
    // Apply filters using our utility
    const filterStages = buildProductFilters(validatedData, false, userId);
    pipeline.push(...filterStages);
    
    // Apply pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Project fields for the response
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        avgRating: 1,
        ratingsCount: 1,
        isVerified: 1,
        images: 1,
        minPrice: '$calculatedMinPrice',
        maxPrice: '$calculatedMaxPrice',
        moq: 1,
        isLiked: 1,
        productIdString: 1,
        hasUnlimitedTier: 1,
        tiersCount: 1,
        deliveryInfo: 1,
        isCustomizable: 1,
        seller: {
          _id: '$sellerData._id',
          companyName: '$sellerData.companyName',
          location: '$sellerData.state'
        }
      }
    });
    
    // Create a separate pipeline for counting with filters applied
    const countPipeline = [...pipeline.filter(stage => !stage.$skip && !stage.$limit && !stage.$project)];
    countPipeline.push({ $count: 'totalProducts' });
    
    // Execute both pipelines
    const [countResult, products] = await Promise.all([
      Product.aggregate(countPipeline),
      Product.aggregate(pipeline)
    ]);
    
    // Process likes from Redis
    const processedProducts = await handleRedisLikeStatus(products, userId, redisClient, REDIS_KEYS);
    
    // Calculate pagination info
    const totalProducts = countResult.length > 0 ? countResult[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit);
    
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
      products: processedProducts,
      totalProducts,
      totalPages,
      currentPage: page
    }));
    
  } catch (err) {
    handleError(res, err);
  }
};
export const getProductInfoController = async(req, res) => {
  try {
    const validatedData = matchedData(req);
    const { slug } = validatedData;
    const userId = req.user ? req.user._id : null;
    
    // Exit early if no product slug is provided
    if (!slug) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Product slug is required');
    }
    
    const pipeline = [
      {
        $match: {
          slug: slug,
          isActive: true
        }
      },
      
      {
        $facet: {
          productData: [
            {
              $lookup: {
                from: 'Sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'sellerData'
              }
            },
            { $unwind: { path: '$sellerData', preserveNullAndEmptyArrays: true } },
            
            {
              $project: {
                _id: 1,
                name: 1,
                isCustomizable: 1,
                slug: 1,
                avgRating: 1,
                ratingsCount: 1,
                isVerified: 1,
                images: 1,
                about: 1,
                services: 1,
                deliveryDays: 1,
                seller: {
                  _id: '$sellerData._id',
                  companyName: '$sellerData.companyName',
                  profileImage: '$sellerData.profileImage',
                  state: '$sellerData.state'
                }
              }
            }
          ],
          
          pricingData: [
            {
              $lookup: {
                from: 'ProductPricing',
                localField: '_id',
                foreignField: 'productId',
                as: 'pricing'
              }
            },
            { $unwind: { path: '$pricing', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                quantityPriceTiers: '$pricing.quantityPriceTiers',
                leadTime: '$pricing.leadTime'
              }
            }
          ],
          
          variationsData: [
            {
              $lookup: {
                from: 'ProductVariation',
                localField: '_id',
                foreignField: 'productId',
                as: 'variations'
              }
            },
            { $unwind: { path: '$variations', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                variations: '$variations.variations'
              }
            }
          ],
          
          statsData: [
            {
              $lookup: {
                from: 'ProductStats',
                localField: '_id',
                foreignField: 'productId',
                as: 'stats'
              }
            },
            { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                viewCount: '$stats.viewCount',
                quotationCount: '$stats.quotationCount',
                acceptedQuotationCount: '$stats.acceptedQuotationCount',
                rejectedQuotationCount: '$stats.rejectedQuotationCount',
                inProgressQuotationCount: '$stats.inProgressQuotationCount',
                popularityScore: '$stats.popularityScore',
                bestsellerScore: '$stats.bestsellerScore'
              }
            }
          ],
          
          attributesData: [
            {
              $lookup: {
                from: 'ProductAttributes',
                localField: '_id',
                foreignField: 'productId',
                as: 'attributes'
              }
            },
            { $unwind: { path: '$attributes', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: '$attributes.name',
                attributes: '$attributes.attributes'
              }
            }
          ],
          
          likedData: [
            {
              $lookup: {
                from: 'Liked',
                let: { productId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$productId', '$$productId'] },
                          userId ? { $eq: ['$buyerId', new mongoose.Types.ObjectId(userId)] } : { $literal: true }
                        ]
                      }
                    }
                  }
                ],
                as: 'liked'
              }
            },
            {
              $project: {
                isLiked: { $cond: [{ $gt: [{ $size: '$liked' }, 0] }, true, false] }
              }
            }
          ]
        }
      },
      
      {
        $project: {
          _id: { $arrayElemAt: ['$productData._id', 0] },
          name: { $arrayElemAt: ['$productData.name', 0] },
          isCustomizable: { $arrayElemAt: ['$productData.isCustomizable', 0] },
          slug: { $arrayElemAt: ['$productData.slug', 0] },
          avgRating: { $arrayElemAt: ['$productData.avgRating', 0] },
          ratingsCount: { $arrayElemAt: ['$productData.ratingsCount', 0] },
          isVerified: { $arrayElemAt: ['$productData.isVerified', 0] },
          images: { $arrayElemAt: ['$productData.images', 0] },
          about: { $arrayElemAt: ['$productData.about', 0] },
          services: { $arrayElemAt: ['$productData.services', 0] },
          deliveryDays: { $arrayElemAt: ['$productData.deliveryDays', 0] },
          seller: { $arrayElemAt: ['$productData.seller', 0] },
          
          pricing: {
            quantityPriceTiers: { $arrayElemAt: ['$pricingData.quantityPriceTiers', 0] },
            leadTime: { $arrayElemAt: ['$pricingData.leadTime', 0] }
          },
          
          moq: { 
            $ifNull: [
              { 
                $arrayElemAt: [
                  { 
                    $arrayElemAt: [
                      '$pricingData.quantityPriceTiers', 
                      0
                    ] 
                  }, 
                  0
                ]
              }.min, 
              1
            ] 
          },
          
          variations: { $arrayElemAt: ['$variationsData.variations', 0] },
          
          stats: {
            viewCount: { $arrayElemAt: ['$statsData.viewCount', 0] },
            quotationCount: { $arrayElemAt: ['$statsData.quotationCount', 0] },
            acceptedQuotationCount: { $arrayElemAt: ['$statsData.acceptedQuotationCount', 0] },
            rejectedQuotationCount: { $arrayElemAt: ['$statsData.rejectedQuotationCount', 0] },
            inProgressQuotationCount: { $arrayElemAt: ['$statsData.inProgressQuotationCount', 0] },
            popularityScore: { $arrayElemAt: ['$statsData.popularityScore', 0] },
            bestsellerScore: { $arrayElemAt: ['$statsData.bestsellerScore', 0] }
          },
          
          productAttributes: {
            name: { $arrayElemAt: ['$attributesData.name', 0] },
            attributes: { $arrayElemAt: ['$attributesData.attributes', 0] }
          },
          
          isLiked: { $ifNull: [{ $arrayElemAt: ['$likedData.isLiked', 0] }, false] }
        }
      },
      
      {
        $lookup: {
          from: 'ProductStats',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$productId', '$$productId'] }
              }
            },
            {
              $project: {
                _id: 1
              }
            }
          ],
          as: 'statsCheck'
        }
      }
    ];
    
    const productInfo = await Product.aggregate(pipeline);
    
    if (!productInfo || productInfo.length === 0) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Product');
    }

    if (userId) {
      const productId = productInfo[0]._id.toString();
      const likeKey = REDIS_KEYS.LIKE_BATCH + productId + ':' + userId.toString();
      
      try {
        const likeData = await redisClient.hgetall(likeKey);
        
        if (likeData && likeData.type) {
          if (likeData.type === 'like') {
            productInfo[0].isLiked = true;
          } 
          else if (likeData.type === 'dislike') {
            productInfo[0].isLiked = false;
          }
        }
      } catch (redisErr) {
        console.error('Error checking Redis for like status', { 
          productId, 
          userId, 
          error: redisErr.message 
        });
        // Continue with the database result if Redis fails
      }
    }
    
    delete productInfo[0].statsCheck;
    
    res.status(httpStatus.ACCEPTED).json(buildResponse(httpStatus.ACCEPTED, productInfo[0]));
    
  } catch (err) {
    handleError(res, err);
  }
};



export const getProductDescriptionController = async (req, res) => {
  try{
    const validatedData = matchedData(req) ;
    const {productId} = validatedData ;

    const productDescription = await ProductDescription.findOne({productId}) ;
    if(!productDescription){
      throw buildErrorObject(httpStatus.BAD_REQUEST , "Product Description not found") ;
    }
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , productDescription)) ; 
  }catch(err){
    handleError(res, err);
  }

}