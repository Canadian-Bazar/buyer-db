import { redisClient, REDIS_KEYS } from './redis.config.js';

/**
 * Increment category view count in Redis
 * @param {string|ObjectId} categoryId - The category ID
 * @returns {Promise<void>}
 */
export async function incrementCategoryView(categoryId) {
  try {
    const categoryKey = REDIS_KEYS.CATEGORY_VIEW + categoryId.toString();
    
    await redisClient.hincrby(categoryKey, 'total', 1);
    await redisClient.hincrby(categoryKey, 'daily', 1);
    await redisClient.hincrby(categoryKey, 'weekly', 1);
    
    const dailyKeyExists = await redisClient.exists(`${categoryKey}:daily:expiry`);
    if (!dailyKeyExists) {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor((midnight - new Date()) / 1000);
      
      await redisClient.set(`${categoryKey}:daily:expiry`, 1);
      await redisClient.expire(`${categoryKey}:daily:expiry`, secondsUntilMidnight);
    }
    
    const today = new Date();
    if (today.getDay() === 0) {
      const weeklyKeyExists = await redisClient.exists(`${categoryKey}:weekly:expiry`);
      if (!weeklyKeyExists) {
        const endOfDay = new Date();
        endOfDay.setHours(24, 0, 0, 0);
        const secondsUntilEndOfDay = Math.floor((endOfDay - new Date()) / 1000);
        
        await redisClient.set(`${categoryKey}:weekly:expiry`, 1);
        await redisClient.expire(`${categoryKey}:weekly:expiry`, secondsUntilEndOfDay);
      }
    }
  } catch (error) {
    console.error('Error incrementing category view', { categoryId, error: error.message });
    throw error;
  }
}

/**
 * Increment category search count in Redis
 * @param {string|ObjectId} categoryId - The category ID
 * @returns {Promise<void>}
 */
export async function incrementCategorySearch(categoryId) {
  try {
    const categoryKey = REDIS_KEYS.CATEGORY_SEARCH + categoryId.toString();
    
    await redisClient.hincrby(categoryKey, 'total', 1);
    await redisClient.hincrby(categoryKey, 'daily', 1);
    await redisClient.hincrby(categoryKey, 'weekly', 1);
    
    const dailyKeyExists = await redisClient.exists(`${categoryKey}:daily:expiry`);
    if (!dailyKeyExists) {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor((midnight - new Date()) / 1000);
      
      await redisClient.set(`${categoryKey}:daily:expiry`, 1);
      await redisClient.expire(`${categoryKey}:daily:expiry`, secondsUntilMidnight);
    }
    
    const today = new Date();
    if (today.getDay() === 0) {
      const weeklyKeyExists = await redisClient.exists(`${categoryKey}:weekly:expiry`);
      if (!weeklyKeyExists) {
        const endOfDay = new Date();
        endOfDay.setHours(24, 0, 0, 0);
        const secondsUntilEndOfDay = Math.floor((endOfDay - new Date()) / 1000);
        
        await redisClient.set(`${categoryKey}:weekly:expiry`, 1);
        await redisClient.expire(`${categoryKey}:weekly:expiry`, secondsUntilEndOfDay);
      }
    }
  } catch (error) {
    console.error('Error incrementing category search', { categoryId, error: error.message });
    throw error;
  }
}

/**
 * Get category stats from Redis
 * @param {string|ObjectId} categoryId - The category ID
 * @returns {Promise<Object>} Category stats
 */
export async function getCategoryStats(categoryId) {
  try {
    const viewKey = REDIS_KEYS.CATEGORY_VIEW + categoryId.toString();
    const searchKey = REDIS_KEYS.CATEGORY_SEARCH + categoryId.toString();
    
    const viewData = await redisClient.hgetall(viewKey) || {};
    const searchData = await redisClient.hgetall(searchKey) || {};
    
    return {
      viewCount: parseInt(viewData.total || '0'),
      dailyViews: parseInt(viewData.daily || '0'),
      weeklyViews: parseInt(viewData.weekly || '0'),
      searchCount: parseInt(searchData.total || '0'),
      dailySearches: parseInt(searchData.daily || '0'),
      weeklySearches: parseInt(searchData.weekly || '0')
    };
  } catch (error) {
    console.error('Error getting category stats from Redis', { categoryId, error: error.message });
    throw error;
  }
}





export default {
  incrementCategoryView,
  incrementCategorySearch,
  getCategoryStats
};