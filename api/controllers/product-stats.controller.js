import ProductStats from '../models/products-stats.schema.js';
import productActivityService from '../redis/product-activity.redis.js';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { matchedData } from 'express-validator';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import  handleError  from '../utils/handleError.js';
import Product from '../models/products.schema.js';
import { REDIS_KEYS, redisClient } from '../redis/redis.config.js';

/**
 * Track product view
 */
export const trackProductView = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { productId } = validatedData;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Product ID');
    }

    await productActivityService.trackProductActivity(productId, userId, 'view');

    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Track quotation status change
 */
export const trackQuotationStatus = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { quotationId, productId, status } = validatedData;

    if (!mongoose.Types.ObjectId.isValid(quotationId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid ID');
    }

    await productActivityService.trackQuotationStatus(productId, quotationId, status);

    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Get popular products with pagination
 */
export const getPopularProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const userId = req.user ? req.user._id : null;
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    const pipeline = [
      { $sort: { popularityScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      {
        $lookup: {
          from: 'Product',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      
      {
        $lookup: {
          from: 'Sellers',
          localField: 'product.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      {
        $lookup: {
          from: 'Category',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ];
    
    if (userId) {
      pipeline.push({
        $lookup: {
          from: 'Liked',
          let: { productId: '$product._id' },
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
          as: 'liked'
        }
      });
    }
    
    pipeline.push({
      $addFields: {
        productIdString: { $toString: '$product._id' },
        isLiked: userId ? { $cond: [{ $gt: [{ $size: '$liked' }, 0] }, true, false] } : false
      }
    });
    
    pipeline.push({
      $project: {
        _id: '$product._id',
        name: '$product.name',
        slug: '$product.slug',
        images: '$product.images',
        avgRating: '$product.avgRating',
        ratingsCount: '$product.ratingsCount',
        isCustomizable: '$product.isCustomizable',
        isVerified: '$product.isVerified',
        seller: {
          _id: '$seller._id',
          companyName: '$seller.companyName',
          city: '$seller.city',
          state: '$seller.state'
        },
        category: {
          _id: '$category._id',
          name: '$category.name',
          description: '$category.description'
        },
        isLiked: 1,
        productIdString: 1
      }
    });
    
    const totalCount = await ProductStats.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    
    let products = await ProductStats.aggregate(pipeline);
    
    if (userId && products.length > 0) {
      try {
        const redisKeys = products.map(product => 
          REDIS_KEYS.LIKE_BATCH + product.productIdString + ':' + userId.toString()
        );
        
        const pipeline = redisClient.pipeline();
        redisKeys.forEach(key => {
          pipeline.hgetall(key);
        });
        
        const redisResults = await pipeline.exec();
        
        for (let i = 0; i < products.length; i++) {
          const likeData = redisResults[i][1];
          
          if (likeData && likeData.type) {
            products[i].isLiked = likeData.type === 'like';
          }
          
          delete products[i].productIdString;
        }
      } catch (redisErr) {
        console.error('Error checking Redis for like statuses', { 
          userId, 
          error: redisErr.message 
        });
        
        products.forEach(product => {
          delete product.productIdString;
        });
      }
    } else {
      products.forEach(product => {
        delete product.productIdString;
      });
    }
    
    const response = {
      docs: products,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

export const getBestsellerProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const userId = req.user ? req.user._id : null;
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    const pipeline = [
      { $match: { acceptedQuotationCount: { $gte: 0 } } },
      { $sort: { bestsellerScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      {
        $lookup: {
          from: 'Product',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      
      {
        $lookup: {
          from: 'Sellers',
          localField: 'product.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      {
        $lookup: {
          from: 'Category',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ];
    
    if (userId) {
      pipeline.push({
        $lookup: {
          from: 'Liked',
          let: { productId: '$product._id' },
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
          as: 'liked'
        }
      });
    }
    
    pipeline.push({
      $addFields: {
        productIdString: { $toString: '$product._id' },
        isLiked: userId ? { $cond: [{ $gt: [{ $size: '$liked' }, 0] }, true, false] } : false
      }
    });
    
    pipeline.push({
      $project: {
        _id: '$product._id',
        name: '$product.name',
        slug: '$product.slug',
        images: '$product.images',
        avgRating: '$product.avgRating',
        ratingsCount: '$product.ratingsCount',
        isCustomizable: '$product.isCustomizable',
        isVerified: '$product.isVerified',
        seller: {
          _id: '$seller._id',
          companyName: '$seller.companyName',
          city: '$seller.city',
          state: '$seller.state'
        },
        category: {
          _id: '$category._id',
          name: '$category.name',
          description: '$category.description'
        },
        isLiked: 1,
        productIdString: 1
      }
    });
    
    const totalCount = await ProductStats.countDocuments({ 
      acceptedQuotationCount: { $gte: 0 } 
    });
    const totalPages = Math.ceil(totalCount / limit);
    
    let products = await ProductStats.aggregate(pipeline);
    
    if (userId && products.length > 0) {
      try {
        const redisKeys = products.map(product => 
          REDIS_KEYS.LIKE_BATCH + product.productIdString + ':' + userId.toString()
        );
        
        const pipeline = redisClient.pipeline();
        redisKeys.forEach(key => {
          pipeline.hgetall(key);
        });
        
        const redisResults = await pipeline.exec();
        
        for (let i = 0; i < products.length; i++) {
          const likeData = redisResults[i][1];
          
          if (likeData && likeData.type) {
            products[i].isLiked = likeData.type === 'like';
          }
          
          delete products[i].productIdString;
        }
      } catch (redisErr) {
        console.error('Error checking Redis for like statuses', { 
          userId, 
          error: redisErr.message 
        });
        
        products.forEach(product => {
          delete product.productIdString;
        });
      }
    } else {
      products.forEach(product => {
        delete product.productIdString;
      });
    }
    
    const response = {
      docs: products,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Get products by category with analytics and pagination
 */
export const getProductsByCategoryWithAnalytics = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { categoryId } = validatedData;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Category ID');
    }
    
    // First, get product IDs that match the category
    const matchingProductIds = await mongoose.model('Product')
      .find({ categoryId })
      .select('_id')
      .lean()
      .then(products => products.map(p => p._id));
    
    // Get total count
    const totalCount = await ProductStats.countDocuments({
      productId: { $in: matchingProductIds }
    });
    const totalPages = Math.ceil(totalCount / limit);
    
    const skip = (page - 1) * limit;
    
    // Get stats for these products
    const products = await ProductStats.find({
      productId: { $in: matchingProductIds }
    })
      .sort({ popularityScore: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name description images seller priceRange')
      .lean();
    
    const docs = products.map(stats => ({
      product: stats.productId,
      viewCount: stats.viewCount,
      quotationCount: stats.quotationCount,
      acceptedQuotationCount: stats.acceptedQuotationCount,
      popularityScore: stats.popularityScore
    }));
    
    const response = {
      docs,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};



export const getNewArrivalProducts = async (req, res) => {
  try {

    const validatedData = matchedData(req);
    const page = parseInt(validatedData.page || '1');
    const limit = parseInt(validatedData.limit || '10');

    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }

    const skip = (page - 1) * limit;

    const totalCount = await Product.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const newArrivalProducts = await Product.find()
      .select('moq name description images categoryId seller minPrice maxPrice slug')
      .populate(
       { path: 'seller' , select:"companyName city state" }
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();


    const response = {
      docs:newArrivalProducts,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
}



export default {
  trackProductView,
  trackQuotationStatus,
  getPopularProducts,
  getBestsellerProducts,
  getProductsByCategoryWithAnalytics
};