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
      
      const dislikedProductIds = new Set();
      try {
        const likeKeys = await redisClient.keys(REDIS_KEYS.LIKE_BATCH + '*:' + userIdStr);
        
        if (likeKeys && likeKeys.length > 0) {
          const pipeline = redisClient.pipeline();
          likeKeys.forEach(key => pipeline.hgetall(key));
          
          const results = await pipeline.exec();
          
          results.forEach((result, index) => {
            const [err, data] = result;
            if (!err && data && data.type === 'dislike') {
              const key = likeKeys[index];
              const parts = key.split(':');
              
              if (parts.length >= 3) {
                const productId = parts[2];
                
                if (productId && productId.length === 24) {
                  dislikedProductIds.add(productId);
                }
              }
            }
          });
        }
      } catch (redisErr) {
        console.error('Error fetching disliked products from Redis', {
          userId: userIdStr,
          error: redisErr.message
        });
      }
      
      const likedQuery = { buyerId: userId };
      
      if (dislikedProductIds.size > 0) {
        try {
          const dislikedObjectIds = [];
          dislikedProductIds.forEach(id => {
            try {
              if (id && typeof id === 'string' && id.length === 24) {
                dislikedObjectIds.push(new mongoose.Types.ObjectId(id));
              }
            } catch (err) {
              console.warn(`Invalid product ID in Redis: ${id}`);
            }
          });
          
          if (dislikedObjectIds.length > 0) {
            likedQuery.productId = { $nin: dislikedObjectIds };
          }
        } catch (err) {
          console.error('Error converting disliked product IDs', err);
        }
      }
      
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
      
      let pendingLikeIds = [];
      try {
        const pendingLikesKey = REDIS_KEYS.PENDING_LIKES + userIdStr;
        pendingLikeIds = await redisClient.smembers(pendingLikesKey) || [];
        
        pendingLikeIds = pendingLikeIds.filter(id => 
          id && typeof id === 'string' && id.length === 24
        );
      } catch (redisErr) {
        console.error('Error fetching pending likes from Redis', {
          userId: userIdStr,
          error: redisErr.message
        });
        pendingLikeIds = [];
      }
      
      let pendingProducts = [];
      if (pendingLikeIds.length > 0) {
        const existingIds = new Set(processedProducts.map(p => p._id.toString()));
        
        const newPendingIds = pendingLikeIds.filter(id => !existingIds.has(id));
        
        if (newPendingIds.length > 0) {
          try {
            const validObjectIds = [];
            for (const id of newPendingIds) {
              try {
                validObjectIds.push(new mongoose.Types.ObjectId(id));
              } catch (err) {
                console.warn(`Invalid pending like ID: ${id}`);
              }
            }
            
            if (validObjectIds.length > 0) {
              pendingProducts = await Product.find({ 
                _id: { $in: validObjectIds }
              })
              .select('_id name slug avgRating ratingsCount isVerified images seller moq minPrice maxPrice deliveryDays')
              .populate({
                path: 'seller',
                select: '_id companyName state profileImage'
              })
              .lean();
              
              pendingProducts = pendingProducts.map(product => ({
                _id: product._id,
                name: product.name,
                slug: product.slug,
                moq: product.moq,
                minPrice: product.minPrice,
                maxPrice: product.maxPrice,
                deliveryDays: product.deliveryDays,
                avgRating: product.avgRating || 0,
                ratingsCount: product.ratingsCount || 0,
                isVerified: product.isVerified || false,
                images: product.images || [],
                seller: product.seller ? {
                  _id: product.seller._id,
                  companyName: product.seller.companyName,
                  location: product.seller.state,
                  profileImage: product.seller.profileImage
                } : null
              }));
            }
          } catch (err) {
            throw buildErrorObject(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching pending products');
          }
        }
      }
      
      const finalProducts = [...processedProducts, ...pendingProducts];
      
      const adjustedTotalCount = Math.max(
        totalLikedProducts + pendingProducts.length, 
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