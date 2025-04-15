import mongoose from 'mongoose';
import { redisClient, REDIS_KEYS } from '../redis/redis.config.js';
import CategoryStats from '../models/category.stats.schema.js';
import lockService from '../redis/lock.redis.service.js';
import categoryRedisService from '../redis/category-stats.redis.js'

/**
 * Process category stats from Redis to MongoDB
 * @returns {Promise<void>}
 */
export async function processCategoryStats() {
  const lockValue = await lockService.acquireProcessingLock('categoryStats', 300); 
  if (!lockValue) {
    console.log('Category stats processing already in progress');
    return;
  }

  try {
    // Get all category view keys from Redis (excluding expiry keys)
    const viewKeys = await redisClient.keys(`${REDIS_KEYS.CATEGORY_VIEW}*`);
    const searchKeys = await redisClient.keys(`${REDIS_KEYS.CATEGORY_SEARCH}*`);

    
    const categoryIds = new Set();

    for (const key of viewKeys) {
      if (!key.includes(':daily:expiry') && !key.includes(':weekly:expiry')) {
        const categoryId = key.replace(REDIS_KEYS.CATEGORY_VIEW, '');
        categoryIds.add(categoryId);
      }
    }

    for (const key of searchKeys) {
      if (!key.includes(':daily:expiry') && !key.includes(':weekly:expiry')) {
        const categoryId = key.replace(REDIS_KEYS.CATEGORY_SEARCH, '');
        categoryIds.add(categoryId);
      }
    }

    const bulkOps = [];

    for (const categoryId of categoryIds) {
     
      if (!mongoose.Types.ObjectId.isValid(categoryId)) continue;

      
      const stats = await categoryRedisService.getCategoryStats(categoryId);

      // Parse data
      const {
        viewCount,
        dailyViews,
        weeklyViews,
        searchCount,
        dailySearches,
        weeklySearches
      } = stats;

      // Calculate popularity score using the formula
      const popularityScore =
        (viewCount + searchCount * 2) * 0.6 +
        (weeklyViews + weeklySearches * 2) * 3 * 0.3 +
        (dailyViews + dailySearches * 2) * 7 * 0.1;

      // Add to bulk operation
      bulkOps.push({
        updateOne: {
          filter: { categoryId: mongoose.Types.ObjectId(categoryId) },
          update: {
            $set: {
              viewCount,
              searchCount,
              dailyViews,
              dailySearches,
              weeklyViews,
              weeklySearches,
              popularityScore,
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      });
    }

  
    if (bulkOps.length > 0) {
      await CategoryStats.bulkWrite(bulkOps);
      console.log(`Processed stats for ${bulkOps.length} categories`);
    } else {
      console.log('No categories to process');
    }
  } catch (error) {
    console.error('Error processing category stats', error);
  } finally {

    await lockService.releaseProcessingLock('categoryStats', lockValue);
  }
}

/**
 * Reset daily counters
 * @returns {Promise<void>}
 */
export async function resetDailyCounters() {
  const lockValue = await lockService.acquireProcessingLock('dailyReset', 300);
  if (!lockValue) {
    console.log('Daily reset already in progress');
    return;
  }

  try {
    // First update MongoDB
    await CategoryStats.updateMany(
      {},
      { $set: { dailyViews: 0, dailySearches: 0 } }
    );

    console.log('Daily counters reset in MongoDB');

    // Then reset in Redis
    const viewKeys = await redisClient.keys(`${REDIS_KEYS.CATEGORY_VIEW}*`);
    const searchKeys = await redisClient.keys(`${REDIS_KEYS.CATEGORY_SEARCH}*`);

    // Extract unique category IDs
    const categoryIds = new Set();

    for (const key of viewKeys) {
      if (!key.includes(':daily:expiry') && !key.includes(':weekly:expiry')) {
        const categoryId = key.replace(REDIS_KEYS.CATEGORY_VIEW, '');
        categoryIds.add(categoryId);
      }
    }

    for (const categoryId of categoryIds) {
      const viewKey = REDIS_KEYS.CATEGORY_VIEW + categoryId;
      const searchKey = REDIS_KEYS.CATEGORY_SEARCH + categoryId;

      await redisClient.hset(viewKey, 'daily', 0);
      await redisClient.hset(searchKey, 'daily', 0);
    }

    console.log(`Daily counters reset in Redis for ${categoryIds.size} categories`);
  } catch (error) {
    console.error('Error resetting daily counters', error);
  } finally {
    await lockService.releaseProcessingLock('dailyReset', lockValue);
  }
}

/**
 * Reset weekly counters
 * @returns {Promise<void>}
 */
export async function resetWeeklyCounters() {
  const lockValue = await lockService.acquireProcessingLock('weeklyReset', 300);
  if (!lockValue) {
    console.log('Weekly reset already in progress');
    return;
  }

  try {
    // First update MongoDB
    await CategoryStats.updateMany(
      {},
      { $set: { weeklyViews: 0, weeklySearches: 0 } }
    );

    console.log('Weekly counters reset in MongoDB');

    // Then reset in Redis
    const viewKeys = await redisClient.keys(`${REDIS_KEYS.CATEGORY_VIEW}*`);

    // Extract unique category IDs
    const categoryIds = new Set();

    for (const key of viewKeys) {
      if (!key.includes(':daily:expiry') && !key.includes(':weekly:expiry')) {
        const categoryId = key.replace(REDIS_KEYS.CATEGORY_VIEW, '');
        categoryIds.add(categoryId);
      }
    }

    for (const categoryId of categoryIds) {
      const viewKey = REDIS_KEYS.CATEGORY_VIEW + categoryId;
      const searchKey = REDIS_KEYS.CATEGORY_SEARCH + categoryId;

      await redisClient.hset(viewKey, 'weekly', 0);
      await redisClient.hset(searchKey, 'weekly', 0);
    }

    console.log(`Weekly counters reset in Redis for ${categoryIds.size} categories`);
  } catch (error) {
    console.error('Error resetting weekly counters', error);
  } finally {
    await lockService.releaseProcessingLock('weeklyReset', lockValue);
  }
}

export default {
  processCategoryStats,
  resetDailyCounters,
  resetWeeklyCounters
};
