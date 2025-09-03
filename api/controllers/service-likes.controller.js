import { matchedData } from 'express-validator';
import ServiceLiked from '../models/service-liked.schema.js' ;
import handleError from '../utils/handleError.js';
import Service from '../models/service.schema.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import httpStatus from 'http-status'
import { likeServiceHandler } from '../redis/service-like.redis.js';
import buildResponse from '../utils/buildResponse.js';
import { REDIS_KEYS, redisClient } from '../redis/redis.config.js';
import mongoose from 'mongoose';


export const handleServiceLikeDislikeController = async (req , res)=>{
    try{

        const validatedData = matchedData(req) ;
        const { type , serviceId } = validatedData ;

        const serviceExists = await Service.exists({ _id: serviceId }) ;
        if (!serviceExists) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Service not found');
        }

        await likeServiceHandler(serviceId , req.user._id , type) ;

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK)
        )

      
    }catch(err){
        handleError(res , err)
    }
}


export const getLikedServicesController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const userId = req.user._id;
    const userIdStr = userId.toString();
    
    const page = validatedData?.page ? parseInt(validatedData.page, 10) : 1;
    const limit = validatedData?.limit ? Math.min(parseInt(validatedData.limit, 10), 50) : 10;
    const skip = (page - 1) * limit;
    
    // Track both liked and disliked service IDs from Redis
    const dislikedServiceIds = new Set();
    const likedServiceIds = new Set();
    const likeKeyPattern = REDIS_KEYS.SERVICE_LIKE_BATCH + '*:' + userIdStr;
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
          
          // Format: service:like:<serviceId>:<userId>
          if (parts.length === 4) {
            const serviceId = parts[2];
            if (serviceId && serviceId.length === 24) {
              if (data?.type === 'dislike') {
                dislikedServiceIds.add(serviceId);
              } else if (data?.type === 'like') {
                likedServiceIds.add(serviceId);
              }
            } else {
              console.warn(`Invalid serviceId length: ${serviceId}`);
            }
          } else {
            console.warn(`Unexpected key format: ${key}`);
          }
        });
      }
    } catch (redisErr) {
      console.error('Error fetching services from Redis', {
        userId: userIdStr,
        error: redisErr.message
      });
    }
    
    // Create the query to get services marked as "liked" in database
    const likedQuery = { buyerId: userId };
    
    // Add disliked services filter if any exist to exclude them
    if (dislikedServiceIds.size > 0) {
      try {
        const dislikedObjectIds = [];
        dislikedServiceIds.forEach(id => {
          try {
            if (id && typeof id === 'string' && id.length === 24) {
              dislikedObjectIds.push(new mongoose.Types.ObjectId(id));
            }
          } catch (err) {
            console.warn(`Invalid disliked service ID in Redis: ${id}`);
          }
        });
        
        if (dislikedObjectIds.length > 0) {
          likedQuery.serviceId = { $nin: dislikedObjectIds };
        }
      } catch (err) {
        console.error('Error converting disliked service IDs', err);
      }
    }
    
    // Get liked services from the database
    const [likedServices, totalLikedServices] = await Promise.all([
      ServiceLiked.find(likedQuery)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'serviceId',
          select: '_id name slug description isComplete completionPercentage category',
          populate: { 
            path: 'seller',
            select: '_id companyName state profileImage'
          }
        })
        .lean(),
      ServiceLiked.countDocuments(likedQuery)
    ]);
    
    const processedServices = [];
    for (const item of likedServices) {
      const service = item.serviceId;
      if (!service) continue;
      
      const formattedService = {
        _id: service._id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        isComplete: service.isComplete || false,
        completionPercentage: service.completionPercentage || 0,
        category: service.category,
        seller: service.seller ? {
          _id: service.seller._id,
          companyName: service.seller.companyName,
          state: service.seller.state,
          profileImage: service.seller.profileImage
        } : null
      };
      
      processedServices.push(formattedService);
    }
    
    // Handle liked services from Redis
    // Convert likedServiceIds Set to array
    let redisLikedIds = Array.from(likedServiceIds);
    
    let redisLikedServices = [];
    if (redisLikedIds.length > 0) {
      // Don't include services already fetched from the database
      const existingIds = new Set(processedServices.map(s => s._id.toString()));
      
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
            // Get services that were liked in Redis
            redisLikedServices = await Service.find({ 
              _id: { $in: validObjectIds }
            })
            .select('_id name slug description isComplete completionPercentage category seller')
            .populate({
              path: 'seller',
              select: '_id companyName state profileImage',
              strictPopulate: false
            })
            .lean();
            
            redisLikedServices = redisLikedServices.map(service => ({
              _id: service._id,
              name: service.name,
              slug: service.slug,
              description: service.description,
              isComplete: service.isComplete || false,
              completionPercentage: service.completionPercentage || 0,
              category: service.category,
              seller: service.seller ? {
                _id: service.seller._id,
                companyName: service.seller.companyName,
                state: service.seller.state,
                profileImage: service.seller.profileImage
              } : null
            }));
          }
        } catch (err) {
          console.error('Detailed error in Redis liked services fetch:', err);
          throw buildErrorObject(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching Redis liked services');
        }
      }
    }
    
    const finalServices = [...processedServices, ...redisLikedServices];
    
    const adjustedTotalCount = Math.max(
      totalLikedServices + redisLikedServices.length, 
      0
    );
    
    const totalPages = Math.ceil(adjustedTotalCount / limit);
    
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
      docs: finalServices,
      totalServices: adjustedTotalCount,
      totalPages,
      hasNext: totalPages > page,
      hasPrev: page > 1,
      currentPage: page
    }));
    
  } catch (err) {
    console.error('Error in getLikedServicesController:', err);
    handleError(res, err);
  }
}