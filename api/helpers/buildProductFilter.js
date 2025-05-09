// utils/product-filters.js
import mongoose from 'mongoose';

/**
 * Creates filter stages for product aggregation pipelines
 * @param {Object} filterParams - Filter parameters from request
 * @param {boolean} isProductStatsQuery - Whether this is for ProductStats (popular/bestseller) or direct Product query
 * @param {string} userId - Optional user ID for liked products
 * @param {boolean} checkQuotationStatus - Whether to check for existing quotations
 * @returns {Object} - Filter stages and match conditions
 */
export const buildProductFilters = (filterParams, isProductStatsQuery = false, userId = null, checkQuotationStatus = true) => {
  const stages = [];
  
  // Determine field prefixes based on query type
  const prefix = isProductStatsQuery ? 'product.' : '';
  const pricingPrefix = isProductStatsQuery ? '' : 'pricingData.';
  
  // Initial match conditions
  const initialMatch = {};
  
  // Text search filter
  if (filterParams?.search) {
    const searchRegex = new RegExp(filterParams.search, 'i');
    initialMatch.$or = [
      { [`${prefix}name`]: searchRegex },
      { [`${prefix}about`]: { $elemMatch: { $regex: searchRegex } } }
    ];
  }
  
  // Verification status filter
  if (filterParams?.isVerified !== undefined) {
    initialMatch[`${prefix}isVerified`] = filterParams.isVerified === 'true';
  }
  
  // Minimum quantity filter
  if (filterParams?.minQuantity) {
    const requestedQuantity = parseInt(filterParams.minQuantity);
    
    if (isProductStatsQuery) {
      // For ProductStats, we need to lookup pricing data first
      stages.push({
        $lookup: {
          from: 'ProductPricing',
          localField: 'product._id',
          foreignField: 'productId',
          as: 'pricingData'
        }
      });
      
      stages.push({
        $match: {
          'pricingData.quantityPriceTiers.0.min': { $lte: requestedQuantity }
        }
      });
    } else {
      // For direct Product queries
      initialMatch[`${pricingPrefix}quantityPriceTiers.0.min`] = { $lte: requestedQuantity };
    }
  }
  
  // Delivery days filter
  if (filterParams?.deliveryDays) {
    const maxDeliveryDays = parseInt(filterParams.deliveryDays);
    initialMatch[`${prefix}deliveryDays`] = { $lte: maxDeliveryDays };
  }
  
  // Apply initial match if there are conditions
  if (Object.keys(initialMatch).length > 0) {
    stages.push({ $match: initialMatch });
  }
  
  // Seller related filters
  const sellerMatch = {};
  
  // Enforce approved sellers only
  sellerMatch[isProductStatsQuery ? 'seller.approvalStatus' : 'sellerData.approvalStatus'] = 'approved';
  
  // Add specific seller filter (by ID)
  if (filterParams?.seller) {
    try {
      const sellerId = new mongoose.Types.ObjectId(filterParams.seller);
      const sellerIdField = isProductStatsQuery ? 'seller._id' : 'sellerData._id';
      sellerMatch[sellerIdField] = sellerId;
    } catch (error) {
      console.warn('Invalid seller ID provided in filter:', filterParams.seller);
    }
  }
  
  // Business type filter
  if (filterParams?.businessType) {
    const field = isProductStatsQuery ? 'seller.businessType' : 'sellerData.businessType';
    sellerMatch[field] = new mongoose.Types.ObjectId(filterParams.businessType);
  }
  
  // State filter
  if (filterParams?.state) {
    const field = isProductStatsQuery ? 'seller.state' : 'sellerData.state';
    sellerMatch[field] = filterParams.state;
  }
  
  // City filter
  if (filterParams?.city) {
    const field = isProductStatsQuery ? 'seller.city' : 'sellerData.city';
    sellerMatch[field] = filterParams.city;
  }
  
  if (Object.keys(sellerMatch).length > 0) {
    stages.push({ $match: sellerMatch });
  }
  
  // Rest of the function remains the same...
  if (filterParams?.subcategories && Array.isArray(filterParams.subcategories) && filterParams.subcategories.length > 0) {
    const subcategoryIds = filterParams.subcategories.map(id => new mongoose.Types.ObjectId(id));
    stages.push({ 
      $match: { [`${prefix}categoryId`]: { $in: subcategoryIds } }
    });
  }
  
  if (isProductStatsQuery) {
    stages.push({
      $lookup: {
        from: 'ProductPricing', 
        localField: 'product._id',
        foreignField: 'productId',
        as: 'pricing'
      }
    });
    
    stages.push({ $unwind: { path: '$pricing', preserveNullAndEmptyArrays: true } });
    
    stages.push({
      $addFields: {
        firstTier: { $arrayElemAt: ['$pricing.quantityPriceTiers', 0] },
        lastTier: { 
          $arrayElemAt: [
            '$pricing.quantityPriceTiers', 
            { $subtract: [{ $size: '$pricing.quantityPriceTiers' }, 1] }
          ] 
        },
        // tiersCount: { $size: '$pricing.quantityPriceTiers' },
      }
    });
    
    stages.push({
      $addFields: {
        calculatedMinPrice: '$lastTier.price',
        calculatedMaxPrice: '$firstTier.price',
        hasUnlimitedTier: { $eq: ['$lastTier.max', null] },
        moq: { 
          $ifNull: [
            { $arrayElemAt: ['$pricing.quantityPriceTiers.min', 0] },
            1
          ] 
        },
        deliveryInfo: {
          days: '$product.deliveryDays',
          min: '$pricing.leadTime.min',
          max: '$pricing.leadTime.max',
          unit: '$pricing.leadTime.unit'
        }
      }
    });
  } else {
    // For direct Product queries, use the fields already available
    stages.push({
      $addFields: {
        firstTier: { $arrayElemAt: ['$pricingData.quantityPriceTiers', 0] },
        lastTier: { 
          $arrayElemAt: [
            '$pricingData.quantityPriceTiers', 
            { $subtract: [{ $size: '$pricingData.quantityPriceTiers' }, 1] }
          ] 
        },
        // tiersCount: { $size: '$pricingData.quantityPriceTiers' },
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
    
    stages.push({
      $addFields: {
        calculatedMinPrice: '$lastTier.price',
        calculatedMaxPrice: '$firstTier.price',
        hasUnlimitedTier: { $eq: ['$lastTier.max', null] }
      }
    });
  }
  
  // Apply price filters
  if (filterParams?.minPrice) {
    const minPriceValue = parseFloat(filterParams.minPrice);
    stages.push({
      $match: {
        'lastTier.price': { $gte: minPriceValue }
      }
    });
  }
  
  if (filterParams?.maxPrice) {
    const maxPriceValue = parseFloat(filterParams.maxPrice);
    stages.push({
      $match: {
        'firstTier.price': { $lte: maxPriceValue }
      }
    });
  }
  
  // Add liked products lookup if userId is provided
  if (userId) {
    stages.push({
      $lookup: {
        from: 'Liked',
        let: { productId: isProductStatsQuery ? '$product._id' : '$_id' },
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
    
    stages.push({
      $addFields: {
        isLiked: { $cond: [{ $gt: [{ $size: '$likedData' }, 0] }, true, false] },
        productIdString: { $toString: isProductStatsQuery ? '$product._id' : '$_id' }
      }
    });
  } else {
    stages.push({
      $addFields: {
        isLiked: false
      }
    });
  }
  
  // Add sorting stages
  let sortStage = {};
  
  if (filterParams?.ratings) {
    const ratingsOrder = filterParams.ratings === 'asc' ? 1 : -1;
    sortStage = { $sort: { 
      [`${prefix}avgRating`]: ratingsOrder 
    }};
  } else if (!isProductStatsQuery) {
    // Default sorting for Product queries
    sortStage = { $sort: { 
      [`${prefix}avgRating`]: -1, 
      [`${prefix}ratingsCount`]: -1 
    }};
  }
  
  if (Object.keys(sortStage).length > 0) {
    stages.push(sortStage);
  }
  
  // Check for existing quotations if needed and userId is available
  if (checkQuotationStatus && userId) {
    stages.push({
      $lookup: {
        from: 'Quotation',
        let: { 
          productId: isProductStatsQuery ? '$product._id' : '$_id',
          buyerId: new mongoose.Types.ObjectId(userId)
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$buyer', '$$buyerId'] },
                  { $in: ['$status', ['sent', 'in-progess']] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'quotationStatus'
      }
    });
    
    // Add quotation status field
    stages.push({
      $addFields: {
        quotationStatus: {
          $cond: [
            { $gt: [{ $size: '$quotationStatus' }, 0] },
            { $arrayElemAt: ['$quotationStatus.status', 0] },
            null
          ]
        }
      }
    });
  }
  
  return stages;
};

/**
 * Handles Redis-based like status checks for products
 * @param {Array} products - Product list with productIdString fields
 * @param {string} userId - User ID
 * @param {Object} redisClient - Redis client instance
 * @param {Object} REDIS_KEYS - Redis key constants
 * @returns {Promise<Array>} - Updated products with correct like status
 */
export const handleRedisLikeStatus = async (products, userId, redisClient, REDIS_KEYS) => {
  if (!userId || products.length === 0) {
    products.forEach(product => {
      if (product.productIdString) delete product.productIdString;
    });
    return products;
  }
  
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
        if (likeData.type === 'like') {
          products[i].isLiked = true;
        } else if (likeData.type === 'dislike') {
          products[i].isLiked = false;
        }
      }
      
      // We keep the quotationStatus field if it exists
      // Only delete the productIdString
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
  
  return products;
};

export default {
  buildProductFilters,
  handleRedisLikeStatus
};