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




export const getProductsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const userId = req.user ? req.user._id : null;
    
    let page = validatedData?.page ? parseInt(validatedData.page) : 1;
    let limit = validatedData?.limit ? Math.min(parseInt(validatedData.limit), 50) : 10;
    const skip = (page - 1) * limit;
    
    const pipeline = [];
    
    pipeline.push({
      $lookup: {
        from: 'ProductPricing',
        localField: '_id',
        foreignField: 'productId',
        as: 'pricingData'
      }
    });
    
    pipeline.push({
      $unwind: {
        path: '$pricingData',
        preserveNullAndEmptyArrays: true
      }
    });
    
    const initialMatch = {};
    
    if (validatedData?.search) {
      const searchRegex = new RegExp(validatedData.search, 'i');
      initialMatch.$or = [
        { name: searchRegex },
        { about: { $elemMatch: { $regex: searchRegex } } }
      ];
    }
    
    if (validatedData?.isVerified !== undefined) {
      initialMatch.isVerified = validatedData.isVerified === 'true';
    }
    
    if (validatedData?.minQuantity) {
      const requestedQuantity = parseInt(validatedData.minQuantity);
      initialMatch['pricingData.quantityPriceTiers.0.min'] = { $lte: requestedQuantity };
    }
    
    if (validatedData?.deliveryDays) {
      const maxDeliveryDays = parseInt(validatedData.deliveryDays);
      initialMatch.deliveryDays = { $lte: maxDeliveryDays };
    }
    
    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }
    
    pipeline.push({
      $lookup: {
        from: 'Sellers',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerData'
      }
    });
    
    pipeline.push({ $unwind: '$sellerData' });
    
    const sellerMatch = {};
    
    sellerMatch['sellerData.approvalStatus'] = 'approved';
    
    if (validatedData?.businessType) {
      sellerMatch['sellerData.businessType'] = new mongoose.Types.ObjectId(validatedData.businessType);
    }
    
    if (validatedData?.location) {
      sellerMatch['sellerData.state'] = validatedData.location;
    }
    
    if (Object.keys(sellerMatch).length > 0) {
      pipeline.push({ $match: sellerMatch });
    }

    console.log(validatedData?.subcategories, 'Subcategories');
    
    if (validatedData?.subcategories && Array.isArray(validatedData.subcategories) && validatedData.subcategories.length > 0) {
      const subcategoryIds = validatedData.subcategories.map(id => new mongoose.Types.ObjectId(id));

      console.log(subcategoryIds, 'Subcategory IDs');
      pipeline.push({ 
$match: { categoryId: { $in: subcategoryIds } }
      });
    }

    console.log(pipeline)
    
    pipeline.push({
      $addFields: {
        firstTier: { $arrayElemAt: ['$pricingData.quantityPriceTiers', 0] },
        lastTier: { 
          $arrayElemAt: [
            '$pricingData.quantityPriceTiers', 
            { $subtract: [{ $size: '$pricingData.quantityPriceTiers' }, 1] }
          ] 
        },
        tiersCount: { $size: '$pricingData.quantityPriceTiers' },
        moq: { 
          $ifNull: [
            { $arrayElemAt: ['$pricingData.quantityPriceTiers.min', 0] },
            1
          ] 
        },
        deliveryInfo: {
          days: '$deliveryDays',
          min: '$pricingData.leadTime.min',
          max: '$pricingData.leadTime.max',
          unit: '$pricingData.leadTime.unit'
        }
      }
    });
    
    pipeline.push({
      $addFields: {
        calculatedMinPrice: '$lastTier.price',
        calculatedMaxPrice: '$firstTier.price',
        hasUnlimitedTier: { $eq: ['$lastTier.max', null] }
      }
    });
    
    if (validatedData?.minPrice) {
      const minPriceValue = parseFloat(validatedData.minPrice);
      pipeline.push({
        $match: {
          'lastTier.price': { $gte: minPriceValue }
        }
      });
    }
    
    if (validatedData?.maxPrice) {
      const maxPriceValue = parseFloat(validatedData.maxPrice);
      pipeline.push({
        $match: {
          'firstTier.price': { $lte: maxPriceValue }
        }
      });
    }
    
    if (userId) {
      pipeline.push({
        $lookup: {
          from: 'Liked',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$buyerId', new mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            }
          ],
          as: 'likedData'
        }
      });
      
      pipeline.push({
        $addFields: {
          isLiked: { $cond: [{ $gt: [{ $size: '$likedData' }, 0] }, true, false] }
        }
      });
    } else {
      pipeline.push({
        $addFields: {
          isLiked: false
        }
      });
    }
    
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'totalProducts' });
    
    let sortStage = {};
    
    
    if (validatedData?.ratings) {
      const ratingsOrder = validatedData.ratings === 'asc' ? 1 : -1;
      sortStage = { $sort: { avgRating: ratingsOrder } };
    } else {
     
      sortStage = { $sort: { avgRating: -1, ratingsCount: -1 } };
    }
    
    pipeline.push(sortStage);
    
   
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
   
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
        hasUnlimitedTier: 1,
        tiersCount: 1,
        deliveryInfo: 1,
        isCustomizable:1 ,
        seller: {
          _id: '$sellerData._id',
          companyName: '$sellerData.companyName',
          location: '$sellerData.state'
        }
      }
    });
    
    
    const [countResult, products] = await Promise.all([
      Product.aggregate(countPipeline),
      Product.aggregate(pipeline)
    ]);
    
    
    const totalProducts = countResult.length > 0 ? countResult[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit);
    
    
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , {
      products,
      totalProducts,
      totalPages,
      currentPage: page

    }
    ));
    
  } catch (err) {
    handleError(res, err);
  }
};

export const getProductInfoController = async(req, res) => {
  try {
    const validatedData = matchedData(req);
    const { slug } = validatedData;
    const userId = req.user ? req.user._id : null;
    
    const pipeline = [      {
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
                  location: '$sellerData.state'
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
    
    // Check if product exists
    if (!productInfo || productInfo.length === 0) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Product');
    }
    
    // Increment the view count in a separate operation (doesn't block the response)
    // if (productInfo[0].statsCheck && productInfo[0].statsCheck.length > 0) {
    //   // Update existing stats
    //   ProductStats.updateOne(
    //     { productId: productInfo[0]._id },
    //     { 
    //       $inc: { viewCount: 1 },
    //       $set: { lastUpdated: new Date() }
    //     }
    //   ).exec();
    // } else {
    //   new ProductStats({
    //     productId: productInfo[0]._id,
    //     viewCount: 1
    //   }).save();
    // }
    
    // Remove the statsCheck field before sending the response

    delete productInfo[0].statsCheck;

    
    res.status(httpStatus.ACCEPTED).json(buildResponse(httpStatus.ACCEPTED, productInfo[0]));
    
  } catch (err) {
    handleError(res, err);
  }
};;



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