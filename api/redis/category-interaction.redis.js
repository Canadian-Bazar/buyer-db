// src/services/redis/user.interaction.redis.service.js
import buildErrorObject from '../utils/buildErrorObject.js';
import { redisClient, REDIS_KEYS } from './redis.config.js';

/**
 * Track user-category interaction in Redis
 * @param {string|ObjectId} userId - The user ID
 * @param {string|ObjectId} categoryId - The category ID
 * @param {string} interactionType - The type of interaction ('view' or 'search')
 * @returns {Promise<void>}
 */
export async function trackUserCategoryInteraction(userId, categoryId, interactionType) {
  try {
    // Validate interaction type
    if (!['view', 'search'].includes(interactionType)) {
      throw new Error(`Invalid interaction type: ${interactionType}`);
    }
    
    const key = `${REDIS_KEYS.USER_CATEGORY_INTERACTION}${userId}:${categoryId}`;
    
   
    await redisClient.hincrby(key, interactionType, 1);
    
    
    await redisClient.hset(key, 'lastInteracted', Date.now());
    
    
    const ttl = await redisClient.ttl(key);
    if (ttl < 0) {
      await redisClient.expire(key, 90 * 24 * 60 * 60); 
    }
  } catch (error) {
    console.error('Error tracking user category interaction', { 
      userId, 
      categoryId, 
      interactionType, 
      error: error.message 
    });
    throw error;
  }
}




// export async function trackUserCat(userId , categoryId , interactionType){

//   try{

//   if(!['view' , 'search'].includes(interactionType)) throw new Error('Invalid Action Type')

//     const key = `${REDIS_KEYS.USER_CATEGORY_INTERACTION}${userId}:${categoryId}`

//     await redisClient.hincrby(key , interactionType , 1)
//     // await redisClient.set(key , 'lastInteracted' , Date.now())

//     const ttl = await redisClient.ttl(key);
//     if (ttl < 0) {
//       await redisClient.expire(key, 90 * 24 * 60 * 60); 
//     }
//   }catch(err){
//     console.error('Error tracking user category interaction', { 
//       userId, 
//       categoryId, 
//       interactionType, 
//       error: error.message 
//     });
//     throw error;

//   }

// }

/**
 * Get all user-category interactions for a specific user
 * @param {string|ObjectId} userId - The user ID
 * @returns {Promise<Array>} Array of user category interactions
 */
export async function getUserCategoryInteractions(userId) {
  try {
    // Get all keys for this user
    const keys = await redisClient.keys(`${REDIS_KEYS.USER_CATEGORY_INTERACTION}${userId}:*`);
    
    const interactions = [];
    
    for (const key of keys) {
     
      const categoryId = key.split(':').pop();
      
      
      const data = await redisClient.hgetall(key);
      
      if (data) {
        interactions.push({
          categoryId,
          viewCount: parseInt(data.view || '0'),
          searchCount: parseInt(data.search || '0'),
          lastInteracted: data.lastInteracted ? new Date(parseInt(data.lastInteracted)) : new Date(),
        });
      }
    }
    
    return interactions;
  } catch (error) {
    console.error('Error getting user category interactions', { userId, error: error.message });
    throw error;
  }
}



// export async function getUserCategories(userId){
//   try{

//     const keys = await redisClient.keys(`${REDIS_KEYS.USER_CATEGORY_INTERACTION}${userId}:*`)

//     const interactions =[]


//     for (const key of keys){
//       const categoryId = key.split(':').pop()
//       const data = await redisClient.hgetall(key);
      
//       if (data) {
//         interactions.push({
//           categoryId,
//           viewCount: parseInt(data.view || '0'),
//           searchCount: parseInt(data.search || '0'),
//           lastInteracted: data.lastInteracted ? new Date(parseInt(data.lastInteracted)) : new Date(),
//         });
//       }
//     }
    
//     return interactions;

//   }catch(err){}
// }

export default {
  trackUserCategoryInteraction,
  getUserCategoryInteractions
};