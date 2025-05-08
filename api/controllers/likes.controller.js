import { matchedData } from 'express-validator';
import Liked from '../models/liked.schema.js' ;
import handleError from '../utils/handleError.js';
import { likeTypes } from '../utils/likeTypes.js';
import Product from '../models/products.schema.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import httpStatus from 'http-status'
import { likeProductHandler } from '../redis/like.redis.js';
import buildResponse from '../utils/buildResponse.js';
import { REDIS_KEYS, redisClient } from '../redis/redis.config.js';
import mongoose from 'mongoose';


export const handleLikeDislikeController = async (req , res)=>{
    try{

        const validatedData = matchedData(req) ;
        const { type , productId } = validatedData ;

        const productExists = await Product.exists({ _id: productId }) ;
        if (!productExists) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Product not found');
        }

        await likeProductHandler(productId , req.user._id , type) ;

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK)
        )

      
    }catch(err){
        handleError(res , err)
    }
}


export const getLikedProductsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const userId = req.user._id;
    const userIdStr = userId.toString();
    
    const page = validatedData?.page ? parseInt(validatedData.page, 10) : 1;
    const limit = validatedData?.limit ? Math.min(parseInt(validatedData.limit, 10), 50) : 10;
    const skip = (page - 1) * limit;
    
    // Track both liked and disliked product IDs from Redis
    const dislikedProductIds = new Set();
    const likedProductIds = new Set();
    const likeKeyPattern = REDIS_KEYS.LIKE_BATCH + '*:' + userIdStr;
    console.log(likeKeyPattern);
    
    try {
      const likeKeys = await redisClient.keys(likeKeyPattern);
      console.log('Found keys:', likeKeys);
    
      if (likeKeys.length > 0) {
        const pipeline = redisClient.pipeline();
        likeKeys.forEach(key => pipeline.hgetall(key));
    
        const results = await pipeline.exec();
        console.log(results);
    
        results.forEach((result, index) => {
          const [err, data] = result;
    
          if (err) {
            console.error('Redis pipeline error:', err);
            return;
          }
          
          const key = likeKeys[index];
          const parts = key.split(':');
          
          // Format: product:like:<productId>:<userId>
          if (parts.length === 4) {
            const productId = parts[2];
            if (productId && productId.length === 24) {
              if (data?.type === 'dislike') {
                dislikedProductIds.add(productId);
              } else if (data?.type === 'like') {
                likedProductIds.add(productId);
              }
            } else {
              console.warn(`Invalid productId length: ${productId}`);
            }
          } else {
            console.warn(`Unexpected key format: ${key}`);
          }
        });
      }
    } catch (redisErr) {
      console.error('Error fetching products from Redis', {
        userId: userIdStr,
        error: redisErr.message
      });
    }
    
    // Create the query to get products marked as "liked" in database
    const likedQuery = { buyerId: userId };
    
    // Add disliked products filter if any exist to exclude them
    if (dislikedProductIds.size > 0) {
      try {
        const dislikedObjectIds = [];
        dislikedProductIds.forEach(id => {
          try {
            if (id && typeof id === 'string' && id.length === 24) {
              dislikedObjectIds.push(new mongoose.Types.ObjectId(id));
            }
          } catch (err) {
            console.warn(`Invalid disliked product ID in Redis: ${id}`);
          }
        });
        
        if (dislikedObjectIds.length > 0) {
          likedQuery.productId = { $nin: dislikedObjectIds };
        }
      } catch (err) {
        console.error('Error converting disliked product IDs', err);
      }
    }
    
    // Get liked products from the database
    const [likedProducts, totalLikedProducts] = await Promise.all([
      Liked.find(likedQuery)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'productId',
          select: '_id name slug avgRating ratingsCount isVerified images moq minPrice maxPrice deliveryDays',
          populate: { 
            path: 'seller',
            select: '_id companyName state profileImage'
          }
        })
        .lean(),
      Liked.countDocuments(likedQuery)
    ]);
    
    const processedProducts = [];
    for (const item of likedProducts) {
      const product = item.productId;
      if (!product) continue;
      
      const formattedProduct = {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        avgRating: product.avgRating || 0,
        moq: product.moq || 0,
        minPrice: product.minPrice || 0,
        maxPrice: product.maxPrice || 0,
        deliveryDays: product.deliveryDays || 0,
        ratingsCount: product.ratingsCount || 0,
        isVerified: product.isVerified || false,
        images: product.images || [],
        seller: product.seller ? {
          _id: product.seller._id,
          companyName: product.seller.companyName,
          state: product.seller.state,
          profileImage: product.seller.profileImage
        } : null
      };
      
      processedProducts.push(formattedProduct);
    }
    
    // Handle liked products from Redis
    // Convert likedProductIds Set to array
    let redisLikedIds = Array.from(likedProductIds);
    
    let redisLikedProducts = [];
    if (redisLikedIds.length > 0) {
      // Don't include products already fetched from the database
      const existingIds = new Set(processedProducts.map(p => p._id.toString()));
      
      const newLikedIds = redisLikedIds.filter(id => !existingIds.has(id));
      
      if (newLikedIds.length > 0) {
        try {
          const validObjectIds = [];
          for (const id of newLikedIds) {
            try {
              validObjectIds.push(new mongoose.Types.ObjectId(id));
            } catch (err) {
              console.warn(`Invalid Redis liked ID: ${id}`);
            }
          }
          
          if (validObjectIds.length > 0) {
            // Get products that were liked in Redis
            redisLikedProducts = await Product.find({ 
              _id: { $in: validObjectIds }
            })
            .select('_id name slug avgRating ratingsCount isVerified images seller moq minPrice maxPrice deliveryDays')
            .populate({
              path: 'seller',
              select: '_id companyName state profileImage'
            })
            .lean();
            
            redisLikedProducts = redisLikedProducts.map(product => ({
              _id: product._id,
              name: product.name,
              slug: product.slug,
              moq: product.moq || 0,
              minPrice: product.minPrice || 0,
              maxPrice: product.maxPrice || 0,
              deliveryDays: product.deliveryDays || 0,
              avgRating: product.avgRating || 0,
              ratingsCount: product.ratingsCount || 0,
              isVerified: product.isVerified || false,
              images: product.images || [],
              seller: product.seller ? {
                _id: product.seller._id,
                companyName: product.seller.companyName,
                state: product.seller.state,
                profileImage: product.seller.profileImage
              } : null
            }));
          }
        } catch (err) {
          throw buildErrorObject(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching Redis liked products');
        }
      }
    }
    
    const finalProducts = [...processedProducts, ...redisLikedProducts];
    
    const adjustedTotalCount = Math.max(
      totalLikedProducts + redisLikedProducts.length, 
      0
    );
    
    const totalPages = Math.ceil(adjustedTotalCount / limit);
    
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
      docs: finalProducts,
      totalProducts: adjustedTotalCount,
      totalPages,
      hasNext: totalPages > page,
      hasPrev: page > 1,
      currentPage: page
    }));
    
  } catch (err) {
    handleError(res, err);
  }
};