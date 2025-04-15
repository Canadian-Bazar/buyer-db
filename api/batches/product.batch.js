import mongoose from 'mongoose';
import { redisClient, REDIS_KEYS } from '../redis/redis.config.js';
import ProductStats from '../models/products-stats.schema.js';
import lockService from '../redis/lock.redis.js';
import ProductActivityLog from '../models/product-activity.schema.js';

/**
 * Process product activity from Redis to MongoDB
 * @returns {Promise<void>}
 */
export async function processProductActivity() {
  const lockValue = await lockService.acquireProcessingLock('productActivity', 300);
  if (!lockValue) {
    console.log('Product activity processing already in progress');
    return;
  }

  try {
    const activityKeys = await redisClient.keys(`${REDIS_KEYS.PRODUCT_ACTIVITY}*`);
    
    if (activityKeys.length === 0) {
      console.log('No product activity to process');
      return;
    }
    
    const bulkActivityLogs = [];
    const productStatsUpdates = {};
    
    for (const key of activityKeys) {
      const productId = key.replace(REDIS_KEYS.PRODUCT_ACTIVITY, '');
      
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        continue;
      }
      
      const data = await redisClient.hgetall(key);
      if (!data) continue;
      
      // Extract activity counts
      console.log(data)
      const viewCount = parseInt(data?.view || '0');
      const quotationSentCount = parseInt(data?.sent || '0');
      const quotationAcceptedCount = parseInt(data?.accepted || '0');
      const quotationRejectedCount = parseInt(data?.rejected || '0');
      const quotationInProgressCount = parseInt(data['in-progress']|| '0');
      
      if (viewCount > 0) {
        bulkActivityLogs.push({
          insertOne: {
            document: {
              productId: new mongoose.Types.ObjectId(productId),
              activityType: 'view',
              count: viewCount,
              isProcessed: true,
              timestamp: new Date()
            }
          }
        });
      }
      
      if (quotationSentCount > 0) {
        bulkActivityLogs.push({
          insertOne: {
            document: {
              productId: new mongoose.Types.ObjectId(productId),
              activityType: 'sent',
              count: quotationSentCount,
              isProcessed: true,
              timestamp: new Date()
            }
          }
        });
      }
      
      if (quotationAcceptedCount > 0) {
        bulkActivityLogs.push({
          insertOne: {
            document: {
              productId: new mongoose.Types.ObjectId(productId),
              activityType: 'accepted',
              count: quotationAcceptedCount,
              isProcessed: true,
              timestamp: new Date()
            }
          }
        });
      }
      
      if (quotationRejectedCount > 0) {
        bulkActivityLogs.push({
          insertOne: {
            document: {
              productId: new mongoose.Types.ObjectId(productId),
              activityType: 'rejected',
              count: quotationRejectedCount,
              isProcessed: true,
              timestamp: new Date()
            }
          }
        });
      }
      
      if (quotationInProgressCount > 0) {
        bulkActivityLogs.push({
          insertOne: {
            document: {
              productId: new mongoose.Types.ObjectId(productId),
              activityType: 'in-progress',
              count: quotationInProgressCount,
              isProcessed: true,
              timestamp: new Date()
            }
          }
        });
      }
      
      productStatsUpdates[productId] = {
        viewCount,
        quotationCount: quotationSentCount,
        acceptedQuotationCount: quotationAcceptedCount,
        rejectedQuotationCount: quotationRejectedCount,
        inProgressQuotationCount: quotationInProgressCount
      };
      
      await redisClient.del(key);
    }
    
    if (bulkActivityLogs.length > 0) {
      await ProductActivityLog.bulkWrite(bulkActivityLogs);
      console.log(`Added ${bulkActivityLogs.length} product activity logs`);
    }
    
    const bulkStatsOps = [];
    
    for (const [productId, stats] of Object.entries(productStatsUpdates)) {
      const popularityScore = stats.viewCount + (stats.quotationCount * 5);
      
   
      const bestsellerScore = stats.acceptedQuotationCount;
      
      bulkStatsOps.push({
        updateOne: {
          filter: { productId: new mongoose.Types.ObjectId(productId) },
          update: {
            $inc: {
              viewCount: stats.viewCount,
              quotationCount: stats.quotationCount,
              acceptedQuotationCount: stats.acceptedQuotationCount,
              rejectedQuotationCount: stats.rejectedQuotationCount,
              inProgressQuotationCount: stats.inProgressQuotationCount
            },
            $set: {
              popularityScore,
              bestsellerScore,
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      });
    }
    
    if (bulkStatsOps.length > 0) {
      await ProductStats.bulkWrite(bulkStatsOps);
      console.log(`Updated stats for ${bulkStatsOps.length} products`);
    }
  } catch (error) {
    console.error('Error processing product activity', error);
  } finally {
    await lockService.releaseProcessingLock('productActivity', lockValue);
  }
}

/**
 * Clean up old product activity logs
 * @returns {Promise<void>}
 */
export async function cleanupProductActivityLogs() {
  const lockValue = await lockService.acquireProcessingLock('activityCleanup', 300);
  if (!lockValue) {
    console.log('Activity cleanup already in progress');
    return;
  }
  
  try {
    // Delete logs older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const result = await ProductActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`Deleted ${result.deletedCount} old activity logs`);
  } catch (error) {
    console.error('Error cleaning up activity logs', error);
  } finally {
    await lockService.releaseProcessingLock('activityCleanup', lockValue);
  }
}

export default {
  processProductActivity,
  cleanupProductActivityLogs
};