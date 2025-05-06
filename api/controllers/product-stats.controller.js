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
import { buildProductFilters, handleRedisLikeStatus } from '../helpers/buildProductFilter.js';
import Category from '../models/category.schema.js'


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
    const validatedData = matchedData(req)
    const page = parseInt(validatedData.page || '1');
    const limit = parseInt(validatedData.limit || '10');
    const userId = req.user ? req.user._id : null;
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    // Start with base pipeline to get popular products
    const pipeline = [
      { $sort: { popularityScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      // Lookup product details
      {
        $lookup: {
          from: 'Product',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      
      // Lookup seller details
      {
        $lookup: {
          from: 'Sellers',
          localField: 'product.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      // Lookup category details
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
    
    // Apply filters using our utility
    const filterStages = buildProductFilters(validatedData, true, userId);
    pipeline.push(...filterStages);
    
    // Project fields for the response
    const projectStage = {
      $project: {
        _id: '$product._id',
        name: '$product.name',
        slug: '$product.slug',
        images: '$product.images',
        avgRating: '$product.avgRating',
        ratingsCount: '$product.ratingsCount',
        isCustomizable: '$product.isCustomizable',
        isVerified: '$product.isVerified',
        minPrice: '$calculatedMinPrice',
        maxPrice: '$calculatedMaxPrice',
        moq: 1,
        hasUnlimitedTier: 1,
        tiersCount: 1,
        deliveryInfo: 1,
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
    };
    pipeline.push(projectStage);
    
    // Create a separate pipeline for counting with filters applied
    const countPipeline = [...pipeline.filter(stage => !stage.$skip && !stage.$limit && !stage.$project)];
    countPipeline.push({ $count: 'totalCount' });
    
    // Execute both pipelines
    const [products, countResult] = await Promise.all([
      ProductStats.aggregate(pipeline),
      ProductStats.aggregate(countPipeline)
    ]);
    
    // Process likes from Redis
    let processedProducts = await handleRedisLikeStatus(products, userId, redisClient, REDIS_KEYS);
    
    // Check if we need to add additional random products
    // Only do this if the only query parameters are page and limit
    const hasOnlyPaginationParams = 
      Object.keys(validatedData).filter(key => 
        key !== 'page' && 
        key !== 'limit' && 
        validatedData[key] !== undefined
      ).length === 0;
    
    if (page === 1 && processedProducts.length < 15 && hasOnlyPaginationParams) {
      // Get product IDs to exclude
      const productIds = processedProducts.map(p => p._id);
      
      // Build pipeline for random products excluding already fetched ones
      const randomPipeline = [
        {
          $match: {
            _id: { $nin: productIds }
          }
        },
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
        { $sample: { size: 15 - processedProducts.length } }, // Get random products to fill
        projectStage // Use same projection
      ];
      
      const randomProducts = await ProductStats.aggregate(randomPipeline);
      const processedRandomProducts = await handleRedisLikeStatus(randomProducts, userId, redisClient, REDIS_KEYS);
      
      processedProducts = [...processedProducts, ...processedRandomProducts];
    }
    
    // Calculate pagination info
    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    const response = {
      docs: processedProducts,
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
    const validatedData = matchedData(req)
    console.log(validatedData)
    const page = parseInt(validatedData.page || '1');
    const limit = parseInt(validatedData.limit || '10');
    const userId = req.user ? req.user._id : null;
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    // Start with base pipeline for bestseller products
    const pipeline = [
      { $match: { acceptedQuotationCount: { $gte: 0 } } },
      { $sort: { bestsellerScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      // Lookup product details
      {
        $lookup: {
          from: 'Product',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      
      // Lookup seller details
      {
        $lookup: {
          from: 'Sellers',
          localField: 'product.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      // Lookup category details
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
    
    // Apply filters using our utility
    const filterStages = buildProductFilters(validatedData, true, userId);
    pipeline.push(...filterStages);
    
    // Project fields for the response
    const projectStage = {
      $project: {
        _id: '$product._id',
        name: '$product.name',
        slug: '$product.slug',
        images: '$product.images',
        avgRating: '$product.avgRating',
        ratingsCount: '$product.ratingsCount',
        isCustomizable: '$product.isCustomizable',
        isVerified: '$product.isVerified',
        minPrice: '$calculatedMinPrice',
        maxPrice: '$calculatedMaxPrice',
        moq: 1,
        hasUnlimitedTier: 1,
        tiersCount: 1,
        deliveryInfo: 1,
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
    };
    pipeline.push(projectStage);
    
    // Create a separate pipeline for counting with filters applied
    const countPipeline = [
      { $match: { acceptedQuotationCount: { $gte: 0 } } }
    ];
    
    // Add filter stages to count pipeline (excluding pagination and projection)
    countPipeline.push(...filterStages.filter(stage => !stage.$skip && !stage.$limit && !stage.$project));
    countPipeline.push({ $count: 'totalCount' });
    
    // Execute both pipelines
    const [products, countResult] = await Promise.all([
      ProductStats.aggregate(pipeline),
      ProductStats.aggregate(countPipeline)
    ]);
    
    // Process likes from Redis
    let processedProducts = await handleRedisLikeStatus(products, userId, redisClient, REDIS_KEYS);
    
    // Check if we need to add additional random products
    // Only do this if the only query parameters are page and limit
    const hasOnlyPaginationParams = 
      Object.keys(validatedData).filter(key => 
        key !== 'page' && 
        key !== 'limit' && 
        validatedData[key] !== undefined
      ).length === 0;
    
    if (page === 1 && processedProducts.length < 15 && hasOnlyPaginationParams) {
      // Get product IDs to exclude
      const productIds = processedProducts.map(p => p._id);
      
      // Build pipeline for random products excluding already fetched ones
      const randomPipeline = [
        {
          $match: {
            _id: { $nin: productIds }
          }
        },
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
        { $sample: { size: 15 - processedProducts.length } }, // Get random products to fill
        projectStage // Use same projection
      ];
      
      const randomProducts = await ProductStats.aggregate(randomPipeline);
      const processedRandomProducts = await handleRedisLikeStatus(randomProducts, userId, redisClient, REDIS_KEYS);
      
      processedProducts = [...processedProducts, ...processedRandomProducts];
    }
    
    // Calculate pagination info
    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    const response = {
      docs: processedProducts,
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
    const page = parseInt(validatedData.page || '1');
    const limit = parseInt(validatedData.limit || '10');
    
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


export const getSuggestedProducts = async(req, res) => {
  try {
    const validatedData = matchedData(req);
    const categoryId = validatedData.categoryId;
    const userId = req.user ? req.user._id : null;
    
    let page = validatedData?.page ? parseInt(validatedData.page) : 1;
    let limit = validatedData?.limit ? Math.min(parseInt(validatedData.limit), 50) : 10;
    const skip = (page - 1) * limit;
    
    // Get the category and its ancestors
    const category = await Category.findById(categoryId).select('ancestors');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Initialize subcategory array if it exists in the request, otherwise create a new one
    let subcategoryIds = validatedData.subcategory || [];
    
    // If subcategoryIds isn't an array, convert it to an array
    if (!Array.isArray(subcategoryIds)) {
      subcategoryIds = [subcategoryIds];
    }
    
    // Get ancestors of the selected category
    const ancestorIds = category.ancestors || [];
    
    // Add the current category ID
    ancestorIds.push(categoryId);
    
    // Combine the subcategory IDs from the frontend with the ancestor IDs
    // Use Set to ensure uniqueness
    const allCategoryIds = [...new Set([...subcategoryIds, ...ancestorIds])];
    
    // Update the validatedData with the combined subcategory IDs
    validatedData.subcategory = allCategoryIds;
    
    const filterParams = {
      ...validatedData,
    };
    
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
    
    console.log(filterParams);
    const filterStages = buildProductFilters(filterParams, false, userId);
    pipeline.push(...filterStages);
    
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    const projectStage = {
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
          state: '$sellerData.state'
        }
      }
    };
    pipeline.push(projectStage);
    
    const countPipeline = [...pipeline.filter(stage => !stage.$skip && !stage.$limit && !stage.$project)];
    countPipeline.push({ $count: 'totalProducts' });
    
    const [countResult, products] = await Promise.all([
      Product.aggregate(countPipeline),
      Product.aggregate(pipeline)
    ]);
    
    let processedProducts = await handleRedisLikeStatus(products, userId, redisClient, REDIS_KEYS);
    
    // Check if only category-related filters (categoryId and subcategory) and no other filters are present
    const hasOnlyCategoryFilter = 
      Object.keys(validatedData).filter(key => 
        key !== 'categoryId' && 
        key !== 'subcategory' &&
        key !== 'page' && 
        key !== 'limit' && 
        validatedData[key] !== undefined
      ).length === 0;
    
    if (page === 1 && processedProducts.length < 15 && hasOnlyCategoryFilter) {
      // Get product IDs to exclude
      const productIds = processedProducts.map(p => p._id);
      
      // Build pipeline for random products excluding already fetched ones
      const randomPipeline = [
        {
          $match: {
            _id: { $nin: productIds }
          }
        },
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
        { $unwind: '$sellerData' },
        { $sample: { size: 15 - processedProducts.length } }, // Get random products to fill
        projectStage // Use same projection
      ];
      
      const randomProducts = await Product.aggregate(randomPipeline);
      const processedRandomProducts = await handleRedisLikeStatus(randomProducts, userId, redisClient, REDIS_KEYS);
      
      processedProducts = [...processedProducts, ...processedRandomProducts];
    }
    
    const totalProducts = countResult.length > 0 ? countResult[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit);
    
    const response = {
      docs: processedProducts,
      totalProducts,
      totalPages,
      hasNext: totalPages > page,
      hasPrev: page > 1,
      currentPage: page
    };
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    
  } catch(err) {
    handleError(res, err);
  }
};



export default {
  trackProductView,
  trackQuotationStatus,
  getPopularProducts,
  getBestsellerProducts,
  getProductsByCategoryWithAnalytics
};