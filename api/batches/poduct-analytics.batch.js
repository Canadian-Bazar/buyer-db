import { 
  ProductActivityLog, 
  ProductMonthlyAnalytics, 
  ProductYearlyAnalytics 
} from '../models/productAnalytics.js';
import moment from 'moment';


export async function trackProductSale(productId, saleAmount, profit, userId = null) {
  try {
    const { redisClient, REDIS_KEYS } = await import('../redis.config.js');
    
    console.log('Tracking product sale:', { productId, saleAmount, profit });
    
    const key = `${REDIS_KEYS.PRODUCT_ACTIVITY}${productId}`;
    await redisClient.hincrby(key, 'sold', 1);
    await redisClient.hincrbyfloat(key, 'totalSales', saleAmount);
    await redisClient.hincrbyfloat(key, 'totalProfit', profit);
    await redisClient.hset(key, 'lastInteracted', Date.now().toString());

    const ttl = await redisClient.ttl(key);
    if (ttl < 0) {
      await redisClient.expire(key, 30 * 24 * 60 * 60); // 30 days
    }

    await ProductActivityLog.create({
      productId,
      userId,
      activityType: 'sold',
      saleAmount,
      profit,
      timestamp: new Date()
    });

    console.log('Product sale tracked successfully');

  } catch (error) {
    console.error('Error tracking product sale:', {
      productId,
      saleAmount,
      profit,
      userId,
      error: error.message
    });
    throw error;
  }
}



export async function runDailyAggregation(targetDate = new Date()) {
  try {
    console.log('Starting daily aggregation for:', targetDate);
    const startTime = Date.now();
    
    const dayStart = moment(targetDate).startOf('day').toDate();
    const dayEnd = moment(targetDate).endOf('day').toDate();
    const year = moment(targetDate).year();
    const month = moment(targetDate).month() + 1; // 1-12
    const day = moment(targetDate).date(); // 1-31
    const week = moment(targetDate).week(); // Week of year

    console.log('Processing date range:', { dayStart, dayEnd, year, month, day, week });

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: dayStart, $lte: dayEnd },
          isProcessed: false
        }
      },
      {
        $group: {
          _id: {
            productId: '$productId',
            activityType: '$activityType'
          },
          count: { $sum: 1 },
          totalSales: { $sum: { $ifNull: ['$saleAmount', 0] } },
          totalProfit: { $sum: { $ifNull: ['$profit', 0] } }
        }
      }
    ];

    const aggregatedData = await ProductActivityLog.aggregate(pipeline);
    console.log('Aggregated data count:', aggregatedData.length);
    
    const productDataMap = new Map();
    
    aggregatedData.forEach(item => {
      const productId = item._id.productId?.toString() || 'all';
      
      if (!productDataMap.has(productId)) {
        productDataMap.set(productId, {
          salesCount: 0, salesAmount: 0, profit: 0,
          viewCount: 0, quotationsSent: 0, quotationsAccepted: 0,
          quotationsRejected: 0, quotationsInProgress: 0
        });
      }

      const data = productDataMap.get(productId);
      
      switch(item._id.activityType) {
        case 'sold':
          data.salesCount = item.count;
          data.salesAmount = item.totalSales;
          data.profit = item.totalProfit;
          break;
        case 'view': 
          data.viewCount = item.count; 
          break;
        case 'sent': 
          data.quotationsSent = item.count; 
          break;
        case 'accepted': 
          data.quotationsAccepted = item.count; 
          break;
        case 'rejected': 
          data.quotationsRejected = item.count; 
          break;
        case 'in-progress': 
          data.quotationsInProgress = item.count; 
          break;
      }
    });

    let processedRecords = 0;
    
    for (const [productIdStr, data] of productDataMap.entries()) {
      const productId = productIdStr === 'all' ? null : productIdStr;
      
      const popularityScore = data.viewCount + (data.quotationsSent * 2);
      const acceptanceRate = data.quotationsSent > 0 ? 
        (data.quotationsAccepted / data.quotationsSent) : 0;
      const bestsellerScore = (data.salesCount * 10) + (acceptanceRate * 5);

      const dailyMetric = {
        day,
        ...data,
        popularityScore,
        bestsellerScore
      };

      const weeklyMetric = {
        week,
        ...data,
        popularityScore,
        bestsellerScore
      };

      await ProductMonthlyAnalytics.findOneAndUpdate(
        {
          productId,
          year,
          month
        },
        {
          $set: {
            [`dailyMetrics.${day - 1}`]: dailyMetric,
            lastUpdated: new Date()
          },
          $inc: {
            'monthlyTotals.salesCount': data.salesCount,
            'monthlyTotals.salesAmount': data.salesAmount,
            'monthlyTotals.profit': data.profit,
            'monthlyTotals.viewCount': data.viewCount,
            'monthlyTotals.quotationsSent': data.quotationsSent,
            'monthlyTotals.quotationsAccepted': data.quotationsAccepted,
            'monthlyTotals.quotationsRejected': data.quotationsRejected,
            'monthlyTotals.quotationsInProgress': data.quotationsInProgress
          }
        },
        { 
          upsert: true,
          new: true
        }
      );

      await updateWeeklyMetrics(productId, year, month, week, weeklyMetric);
      
      processedRecords++;
    }

    await ProductActivityLog.updateMany(
      {
        timestamp: { $gte: dayStart, $lte: dayEnd },
        isProcessed: false
      },
      {
        $set: { isProcessed: true }
      }
    );

    const executionTime = Date.now() - startTime;
    console.log(`Daily aggregation completed. Processed ${processedRecords} products in ${executionTime}ms`);

    return {
      success: true,
      processedRecords,
      executionTime
    };

  } catch (error) {
    console.error('Daily aggregation failed:', error);
    throw error;
  }
}

async function updateWeeklyMetrics(productId, year, month, week, weeklyMetric) {
  try {
    const monthStart = moment({ year, month: month - 1 }).startOf('month');
    const weekStartOfMonth = monthStart.week();
    const weekIndex = week - weekStartOfMonth;
    
    if (weekIndex >= 0 && weekIndex < 6) { // Max 6 weeks in a month
      await ProductMonthlyAnalytics.findOneAndUpdate(
        {
          productId,
          year,
          month
        },
        {
          $set: {
            [`weeklyMetrics.${weekIndex}`]: weeklyMetric
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('Error updating weekly metrics:', error);
  }
}



export async function runMonthlyAggregation(targetDate = new Date()) {
  try {
    console.log('Starting monthly aggregation for:', targetDate);
    const startTime = Date.now();
    
    const year = moment(targetDate).year();
    const month = moment(targetDate).month() + 1;

    const monthlyDocs = await ProductMonthlyAnalytics.find({ year, month });
    console.log('Found monthly docs:', monthlyDocs.length);
    
    let processedRecords = 0;
    
    for (const monthlyDoc of monthlyDocs) {
      const monthlyMetric = {
        month,
        ...monthlyDoc.monthlyTotals
      };

      await ProductYearlyAnalytics.findOneAndUpdate(
        {
          productId: monthlyDoc.productId,
          year
        },
        {
          $set: {
            [`monthlyMetrics.${month - 1}`]: monthlyMetric,
            lastUpdated: new Date()
          },
          $inc: {
            'yearlyTotals.salesCount': monthlyDoc.monthlyTotals.salesCount || 0,
            'yearlyTotals.salesAmount': monthlyDoc.monthlyTotals.salesAmount || 0,
            'yearlyTotals.profit': monthlyDoc.monthlyTotals.profit || 0,
            'yearlyTotals.viewCount': monthlyDoc.monthlyTotals.viewCount || 0,
            'yearlyTotals.quotationsSent': monthlyDoc.monthlyTotals.quotationsSent || 0,
            'yearlyTotals.quotationsAccepted': monthlyDoc.monthlyTotals.quotationsAccepted || 0,
            'yearlyTotals.quotationsRejected': monthlyDoc.monthlyTotals.quotationsRejected || 0,
            'yearlyTotals.quotationsInProgress': monthlyDoc.monthlyTotals.quotationsInProgress || 0
          }
        },
        { upsert: true }
      );
      
      processedRecords++;
    }

    const executionTime = Date.now() - startTime;
    console.log(`Monthly aggregation completed. Processed ${processedRecords} products in ${executionTime}ms`);

    return {
      success: true,
      processedRecords,
      executionTime
    };

  } catch (error) {
    console.error('Monthly aggregation failed:', error);
    throw error;
  }
}



export async function cleanupOldData() {
  try {
    console.log('Starting cleanup of old data...');
    
    const cutoffDate = moment().subtract(90, 'days').toDate();
    
    const deleteResult = await ProductActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate },
      isProcessed: true
    });

    console.log(`Cleaned up ${deleteResult.deletedCount} old activity logs`);

    return {
      success: true,
      deletedCount: deleteResult.deletedCount
    };

  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

// =============================================================================
// BATCH JOB RUNNER (like your existing function pattern)
// =============================================================================

export async function runBatchJob(jobType, targetDate = new Date()) {
  try {
    console.log(`Running batch job: ${jobType} for ${targetDate}`);
    
    let result;
    
    switch (jobType) {
      case 'daily_aggregation':
        result = await runDailyAggregation(targetDate);
        break;
      case 'monthly_aggregation':
        result = await runMonthlyAggregation(targetDate);
        break;
      case 'cleanup':
        result = await cleanupOldData();
        break;
      default:
        throw new Error(`Invalid job type: ${jobType}`);
    }

    console.log(`Batch job ${jobType} completed successfully:`, result);
    return result;

  } catch (error) {
    console.error(`Batch job ${jobType} failed:`, error);
    throw error;
  }
}



export default {
  trackProductSale,
  runDailyAggregation,
  runMonthlyAggregation,
  cleanupOldData,
  runBatchJob
};