
import mongoose from 'mongoose';
import { redisClient, REDIS_KEYS } from '../redis/redis.config.js';
import CategoryStats from '../models/category.stats.schema.js';
import lockService from '../redis/lock.redis.js';
import categoryRedisService from '../redis/category-stats.redis.js'
import  CategoryInteraction from '../models/category-interaction.schema.js'

/**
 * Process user category interactions from Redis to MongoDB
 * @returns {Promise<void>}
 */
export async function processUserInteractions() {
    const lockValue = await lockService.acquireProcessingLock('userInteractions', 300);
    if (!lockValue) {
      console.log('User interactions processing already in progress');
      return;
    }
  
    try {
      const interactionKeys = await redisClient.keys(`${REDIS_KEYS.USER_CATEGORY_INTERACTION}*`);
      const bulkOps = [];

      const allKeys = await redisClient.keys('*');

      console.log(interactionKeys)
  
      for (const key of interactionKeys) {
        const parts = key.replace(REDIS_KEYS.USER_CATEGORY_INTERACTION, '').split(':');
        if (parts.length !== 2) continue;
  
        const [userId, categoryId] = parts;
  
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(categoryId)) {
          continue;
        }
  
        const data = await redisClient.hgetall(key);
        if (!data) continue;
  
        const viewCount = parseInt(data.view || '0');
        const searchCount = parseInt(data.search || '0');
        const lastInteracted = data.lastInteracted ? new Date(parseInt(data.lastInteracted)) : new Date();
  
        const expiresAt = new Date(lastInteracted);
        expiresAt.setDate(expiresAt.getDate() + 90);
  
        bulkOps.push({
          updateOne: {
            filter: {
              userId: new mongoose.Types.ObjectId(userId),
              categoryId:new  mongoose.Types.ObjectId(categoryId)
            },
            update: {
              $set: {
                viewCount,
                searchCount,
                lastInteracted,
                expiresAt
              }
            },
            upsert: true
          }
        });
      }
  
      if (bulkOps.length > 0) {
        await CategoryInteraction.bulkWrite(bulkOps);
        console.log(`Processed ${bulkOps.length} user-category interactions`);
      } else {
        console.log('No user interactions to process');
      }
    } catch (error) {
      console.log('what the hell')
      console.error('Error processing user interactions');
    } finally {
      await lockService.releaseProcessingLock('userInteractions', lockValue);
    }
  }
  
  /**
   * Clean up expired user interactions from Redis
   * @returns {Promise<void>}
   */
  export async function cleanupExpiredInteractions() {
    const lockValue = await lockService.acquireProcessingLock('interactionCleanup', 300);
    if (!lockValue) {
      console.log('Interaction cleanup already in progress');
      return;
    }
  
    try {
      const interactionKeys = await redisClient.keys(`${REDIS_KEYS.USER_CATEGORY_INTERACTION}*`);
      let cleanedCount = 0;
  
      for (const key of interactionKeys) {
        const lastInteracted = await redisClient.hget(key, 'lastInteracted');
        if (!lastInteracted) continue;
  
        const interactionDate = new Date(parseInt(lastInteracted));
        const expiryDate = new Date(interactionDate);
        expiryDate.setDate(expiryDate.getDate() + 90);
  
        if (expiryDate < new Date()) {
          await redisClient.del(key);
          cleanedCount++;
        }
      }
  
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired user interactions from Redis`);
      }
    } catch (error) {
      console.error('Error cleaning up expired interactions', error);
    } finally {
      await lockService.releaseProcessingLock('interactionCleanup', lockValue);
    }
  }
  
  export default {
    processUserInteractions,
    cleanupExpiredInteractions
  };