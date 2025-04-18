import Product from '../models/products.schema.js'
import ProductVariation from '../models/product-variation.schema.js'
import ProductDescription from '../models/product-description.schema.js'
import ProductPricing from '../models/product-pricing.schema.js'
import handleError from './../utils/handleError.js';
import  {matchedData}  from 'express-validator';
import mongoose from 'mongoose'




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
    
    // Stage 2: Unwind pricing data
    pipeline.push({
      $unwind: {
        path: '$pricingData',
        preserveNullAndEmptyArrays: true
      }
    });
    
    // Stage 3: Initial filter conditions
    const initialMatch = {};
    
    // Text search across multiple fields using regex
    if (validatedData?.search) {
      const searchRegex = new RegExp(validatedData.search, 'i');
      initialMatch.$or = [
        { name: searchRegex },
        { about: { $elemMatch: { $regex: searchRegex } } }
      ];
    }
    
    // Filter by verified status
    if (validatedData?.isVerified !== undefined) {
      initialMatch.isVerified = validatedData.isVerified === 'true';
    }
    
    // Handle MOQ filtering - check if the first tier's minimum is less than or equal to requested quantity
    if (validatedData?.minQuantity) {
      const requestedQuantity = parseInt(validatedData.minQuantity);
      initialMatch['pricingData.quantityPriceTiers.0.min'] = { $lte: requestedQuantity };
    }
    
    // Filter by delivery days
    if (validatedData?.deliveryDays) {
      const maxDeliveryDays = parseInt(validatedData.deliveryDays);
      initialMatch.deliveryDays = { $lte: maxDeliveryDays };
    }
    
    // Add the initial match stage if there are any conditions
    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }
    
    // Stage 4: Join with Seller collection
    pipeline.push({
      $lookup: {
        from: 'Sellers',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerData'
      }
    });
    
    // Stage 5: Unwind the seller array
    pipeline.push({ $unwind: '$sellerData' });
    
    // Stage 6: Match on seller criteria
    const sellerMatch = {};
    
    // Only include products from approved sellers
    sellerMatch['sellerData.approvalStatus'] = 'approved';
    
    // Filter by business type
    if (validatedData?.businessType) {
      sellerMatch['sellerData.businessType'] = new mongoose.Types.ObjectId(validatedData.businessType);
    }
    
    // Filter by location
    if (validatedData?.location) {
      sellerMatch['sellerData.state'] = validatedData.location;
    }
    
    // Add the seller match stage if there are any conditions
    if (Object.keys(sellerMatch).length > 0) {
      pipeline.push({ $match: sellerMatch });
    }
    
    // Stage 7: Filter by subcategories if provided
    if (validatedData?.subcategories && Array.isArray(validatedData.subcategories) && validatedData.subcategories.length > 0) {
      const subcategoryIds = validatedData.subcategories.map(id => new mongoose.Types.ObjectId(id));
      pipeline.push({ 
        $match: { categories: { $in: subcategoryIds } } 
      });
    }
    
    // Stage 8: Add calculated fields including first and last tier
    pipeline.push({
      $addFields: {
        // Get first and last tier objects
        firstTier: { $arrayElemAt: ['$pricingData.quantityPriceTiers', 0] },
        lastTier: { 
          $arrayElemAt: [
            '$pricingData.quantityPriceTiers', 
            { $subtract: [{ $size: '$pricingData.quantityPriceTiers' }, 1] }
          ] 
        },
        // Calculate the number of tiers
        tiersCount: { $size: '$pricingData.quantityPriceTiers' },
        // Get the minimum quantity (MOQ) from the first tier
        moq: { 
          $ifNull: [
            { $arrayElemAt: ['$pricingData.quantityPriceTiers.min', 0] },
            1
          ] 
        },
        // Extract delivery information
        deliveryInfo: {
          days: '$deliveryDays',
          min: '$pricingData.leadTime.min',
          max: '$pricingData.leadTime.max',
          unit: '$pricingData.leadTime.unit'
        }
      }
    });
    
    // Stage A: Add min/max price calculations
    pipeline.push({
      $addFields: {
        calculatedMinPrice: '$lastTier.price',
        calculatedMaxPrice: '$firstTier.price',
        hasUnlimitedTier: { $eq: ['$lastTier.max', null] }
      }
    });
    
    // Stage B: Apply price filters AFTER calculating the tier information
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
    
    // Stage 9: Check if product is liked by current user (if user is logged in)
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
      
      // Add a field to indicate if product is liked
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
    
    // Stage 10: Count total documents for pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'totalProducts' });
    
    // Stage 11: Sort the results
    let sortStage = {};
    
    // Handle ratings sorting with asc/desc parameter
    if (validatedData?.ratings) {
      const ratingsOrder = validatedData.ratings === 'asc' ? 1 : -1;
      sortStage = { $sort: { avgRating: ratingsOrder } };
    } else {
      // Default sorting
      sortStage = { $sort: { avgRating: -1, ratingsCount: -1 } };
    }
    
    pipeline.push(sortStage);
    
    // Stage 12: Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    
    // Stage 13: Project only the necessary fields
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
        seller: {
          _id: '$sellerData._id',
          companyName: '$sellerData.companyName',
          location: '$sellerData.state'
        }
      }
    });
    
    // Execute the aggregation pipeline
    const [countResult, products] = await Promise.all([
      Product.aggregate(countPipeline),
      Product.aggregate(pipeline)
    ]);
    
    // Calculate pagination metadata
    const totalProducts = countResult.length > 0 ? countResult[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        products,
        totalProducts,
        totalPages,
        currentPage: page
      }
    });
    
  } catch (err) {
    handleError(res, err);
  }
};