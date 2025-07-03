import moment from 'moment';
import { ProductMonthlyPerformance, ProductYearlyPerformance } from '../models/product-performance-analytics.schema.js';
import ProductActivityLog from '../models/product-activity.schema.js';
import lockService from '../redis/lock.redis.js';

/**
 * Process performance analytics from activity logs to analytics collections
 * This runs on BUYER SIDE to process activity data into performance analytics
 * @returns {Promise<void>}
 */
export async function processPerformanceAnalytics() {
  const lockValue = await lockService.acquireProcessingLock('performanceAnalytics', 300);
  if (!lockValue) {
    console.log('Performance analytics processing already in progress');
    return;
  }

  try {
    // Get unprocessed activity logs from the last 7 days
    const unprocessedLogs = await ProductActivityLog.find({
      isProcessed: false,
      timestamp: { $gte: moment().subtract(7, 'days').toDate() }
    }).lean();

    if (unprocessedLogs.length === 0) {
      console.log('No unprocessed activity logs found for performance analytics');
      return;
    }

    console.log(`📊 Processing ${unprocessedLogs.length} activity logs for performance analytics`);

    // Group logs by product, date, and aggregate data
    const groupedData = {};
    
    for (const log of unprocessedLogs) {
      const date = moment(log.timestamp);
      const productId = log.productId.toString();
      const year = date.year();
      const month = date.month() + 1;
      const day = date.date();
      const week = date.week();
      
      const key = `${productId}-${year}-${month}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          productId: log.productId,
          year,
          month,
          dailyMetrics: Array(31).fill(null).map((_, index) => ({
            day: index + 1,
            viewCount: 0,
            quotationsSent: 0,
            quotationsAccepted: 0,
            quotationsRejected: 0,
            quotationsInProgress: 0,
            popularityScore: 0,
            bestsellerScore: 0
          })),
          weeklyMetrics: {},
          monthlyTotals: {
            viewCount: 0,
            quotationsSent: 0,
            quotationsAccepted: 0,
            quotationsRejected: 0,
            quotationsInProgress: 0,
            popularityScore: 0,
            bestsellerScore: 0
          }
        };
      }
      
      const data = groupedData[key];
      
      // Initialize weekly metrics if not exists
      if (!data.weeklyMetrics[week]) {
        data.weeklyMetrics[week] = {
          week,
          viewCount: 0,
          quotationsSent: 0,
          quotationsAccepted: 0,
          quotationsRejected: 0,
          quotationsInProgress: 0,
          popularityScore: 0,
          bestsellerScore: 0
        };
      }
      
      // Process based on activity type
      let count = log.count || 1;
      const dayIndex = day - 1; // Convert to 0-based index
      
      switch (log.activityType) {
        case 'view':
          data.dailyMetrics[dayIndex].viewCount += count;
          data.weeklyMetrics[week].viewCount += count;
          data.monthlyTotals.viewCount += count;
          break;
        case 'sent':
          data.dailyMetrics[dayIndex].quotationsSent += count;
          data.weeklyMetrics[week].quotationsSent += count;
          data.monthlyTotals.quotationsSent += count;
          break;
        case 'accepted':
          data.dailyMetrics[dayIndex].quotationsAccepted += count;
          data.weeklyMetrics[week].quotationsAccepted += count;
          data.monthlyTotals.quotationsAccepted += count;
          break;
        case 'rejected':
          data.dailyMetrics[dayIndex].quotationsRejected += count;
          data.weeklyMetrics[week].quotationsRejected += count;
          data.monthlyTotals.quotationsRejected += count;
          break;
        case 'in-progress':
          data.dailyMetrics[dayIndex].quotationsInProgress += count;
          data.weeklyMetrics[week].quotationsInProgress += count;
          data.monthlyTotals.quotationsInProgress += count;
          break;
      }
    }

    // Calculate popularity and bestseller scores
    for (const key in groupedData) {
      const data = groupedData[key];
      
      // Calculate scores for daily metrics
      for (let i = 0; i < data.dailyMetrics.length; i++) {
        const dayData = data.dailyMetrics[i];
        dayData.popularityScore = dayData.viewCount + (dayData.quotationsSent * 5);
        dayData.bestsellerScore = dayData.quotationsAccepted;
      }
      
      // Calculate scores for weekly metrics
      for (const week in data.weeklyMetrics) {
        const weekData = data.weeklyMetrics[week];
        weekData.popularityScore = weekData.viewCount + (weekData.quotationsSent * 5);
        weekData.bestsellerScore = weekData.quotationsAccepted;
      }
      
      // Calculate scores for monthly totals
      data.monthlyTotals.popularityScore = data.monthlyTotals.viewCount + (data.monthlyTotals.quotationsSent * 5);
      data.monthlyTotals.bestsellerScore = data.monthlyTotals.quotationsAccepted;
    }

    // Update monthly performance documents
    const bulkMonthlyOps = [];
    
    for (const key in groupedData) {
      const data = groupedData[key];
      
      // Convert weekly metrics to array
      const weeklyMetricsArray = Object.values(data.weeklyMetrics);
      
      bulkMonthlyOps.push({
        updateOne: {
          filter: {
            productId: data.productId,
            year: data.year,
            month: data.month
          },
          update: {
            $inc: {
              'monthlyTotals.viewCount': data.monthlyTotals.viewCount,
              'monthlyTotals.quotationsSent': data.monthlyTotals.quotationsSent,
              'monthlyTotals.quotationsAccepted': data.monthlyTotals.quotationsAccepted,
              'monthlyTotals.quotationsRejected': data.monthlyTotals.quotationsRejected,
              'monthlyTotals.quotationsInProgress': data.monthlyTotals.quotationsInProgress,
              'monthlyTotals.popularityScore': data.monthlyTotals.popularityScore,
              'monthlyTotals.bestsellerScore': data.monthlyTotals.bestsellerScore
            },
            $set: {
              lastUpdated: new Date()
            },
            $addToSet: {
              weeklyMetrics: { $each: weeklyMetricsArray }
            }
          },
          upsert: true
        }
      });

      // Handle daily metrics separately to avoid array size issues
      for (let i = 0; i < data.dailyMetrics.length; i++) {
        const dayData = data.dailyMetrics[i];
        if (dayData.viewCount > 0 || dayData.quotationsSent > 0 || dayData.quotationsAccepted > 0 || 
            dayData.quotationsRejected > 0 || dayData.quotationsInProgress > 0) {
          
          bulkMonthlyOps.push({
            updateOne: {
              filter: {
                productId: data.productId,
                year: data.year,
                month: data.month,
                'dailyMetrics.day': dayData.day
              },
              update: {
                $inc: {
                  'dailyMetrics.$.viewCount': dayData.viewCount,
                  'dailyMetrics.$.quotationsSent': dayData.quotationsSent,
                  'dailyMetrics.$.quotationsAccepted': dayData.quotationsAccepted,
                  'dailyMetrics.$.quotationsRejected': dayData.quotationsRejected,
                  'dailyMetrics.$.quotationsInProgress': dayData.quotationsInProgress,
                  'dailyMetrics.$.popularityScore': dayData.popularityScore,
                  'dailyMetrics.$.bestsellerScore': dayData.bestsellerScore
                }
              }
            }
          });
        }
      }
    }

    if (bulkMonthlyOps.length > 0) {
      await ProductMonthlyPerformance.bulkWrite(bulkMonthlyOps);
      console.log(`✅ Updated ${Object.keys(groupedData).length} monthly performance documents`);
    }

    // Update yearly performance analytics
    await updateYearlyPerformanceAnalytics(groupedData);

    // Mark logs as processed
    const logIds = unprocessedLogs.map(log => log._id);
    await ProductActivityLog.updateMany(
      { _id: { $in: logIds } },
      { $set: { isProcessed: true } }
    );

    console.log(`✅ Marked ${logIds.length} activity logs as processed for performance analytics`);

  } catch (error) {
    console.error('❌ Error processing performance analytics:', error);
  } finally {
    await lockService.releaseProcessingLock('performanceAnalytics', lockValue);
  }
}

/**
 * Update yearly performance analytics
 * @param {Object} groupedData - Grouped performance data by month
 */
async function updateYearlyPerformanceAnalytics(groupedData) {
  const yearlyData = {};
  
  // Group by product and year
  for (const key in groupedData) {
    const data = groupedData[key];
    const yearKey = `${data.productId}-${data.year}`;
    
    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = {
        productId: data.productId,
        year: data.year,
        monthlyMetrics: Array(12).fill(null).map((_, index) => ({
          month: index + 1,
          viewCount: 0,
          quotationsSent: 0,
          quotationsAccepted: 0,
          quotationsRejected: 0,
          quotationsInProgress: 0,
          popularityScore: 0,
          bestsellerScore: 0
        })),
        yearlyTotals: {
          viewCount: 0,
          quotationsSent: 0,
          quotationsAccepted: 0,
          quotationsRejected: 0,
          quotationsInProgress: 0,
          popularityScore: 0,
          bestsellerScore: 0
        }
      };
    }
    
    const yearData = yearlyData[yearKey];
    const monthIndex = data.month - 1; // Convert to 0-based index
    
    // Update monthly data in yearly document
    yearData.monthlyMetrics[monthIndex].viewCount += data.monthlyTotals.viewCount;
    yearData.monthlyMetrics[monthIndex].quotationsSent += data.monthlyTotals.quotationsSent;
    yearData.monthlyMetrics[monthIndex].quotationsAccepted += data.monthlyTotals.quotationsAccepted;
    yearData.monthlyMetrics[monthIndex].quotationsRejected += data.monthlyTotals.quotationsRejected;
    yearData.monthlyMetrics[monthIndex].quotationsInProgress += data.monthlyTotals.quotationsInProgress;
    yearData.monthlyMetrics[monthIndex].popularityScore += data.monthlyTotals.popularityScore;
    yearData.monthlyMetrics[monthIndex].bestsellerScore += data.monthlyTotals.bestsellerScore;
    
    // Update yearly totals
    yearData.yearlyTotals.viewCount += data.monthlyTotals.viewCount;
    yearData.yearlyTotals.quotationsSent += data.monthlyTotals.quotationsSent;
    yearData.yearlyTotals.quotationsAccepted += data.monthlyTotals.quotationsAccepted;
    yearData.yearlyTotals.quotationsRejected += data.monthlyTotals.quotationsRejected;
    yearData.yearlyTotals.quotationsInProgress += data.monthlyTotals.quotationsInProgress;
    yearData.yearlyTotals.popularityScore += data.monthlyTotals.popularityScore;
    yearData.yearlyTotals.bestsellerScore += data.monthlyTotals.bestsellerScore;
  }
  
  // Update yearly documents
  const bulkYearlyOps = [];
  
  for (const yearKey in yearlyData) {
    const data = yearlyData[yearKey];
    
    bulkYearlyOps.push({
      updateOne: {
        filter: {
          productId: data.productId,
          year: data.year
        },
        update: {
          $inc: {
            'yearlyTotals.viewCount': data.yearlyTotals.viewCount,
            'yearlyTotals.quotationsSent': data.yearlyTotals.quotationsSent,
            'yearlyTotals.quotationsAccepted': data.yearlyTotals.quotationsAccepted,
            'yearlyTotals.quotationsRejected': data.yearlyTotals.quotationsRejected,
            'yearlyTotals.quotationsInProgress': data.yearlyTotals.quotationsInProgress,
            'yearlyTotals.popularityScore': data.yearlyTotals.popularityScore,
            'yearlyTotals.bestsellerScore': data.yearlyTotals.bestsellerScore
          },
          $set: {
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    });

    // Handle monthly metrics updates
    for (let i = 0; i < data.monthlyMetrics.length; i++) {
      const monthData = data.monthlyMetrics[i];
      if (monthData.viewCount > 0 || monthData.quotationsSent > 0 || monthData.quotationsAccepted > 0 || 
          monthData.quotationsRejected > 0 || monthData.quotationsInProgress > 0) {
        
        bulkYearlyOps.push({
          updateOne: {
            filter: {
              productId: data.productId,
              year: data.year,
              'monthlyMetrics.month': monthData.month
            },
            update: {
              $inc: {
                'monthlyMetrics.$.viewCount': monthData.viewCount,
                'monthlyMetrics.$.quotationsSent': monthData.quotationsSent,
                'monthlyMetrics.$.quotationsAccepted': monthData.quotationsAccepted,
                'monthlyMetrics.$.quotationsRejected': monthData.quotationsRejected,
                'monthlyMetrics.$.quotationsInProgress': monthData.quotationsInProgress,
                'monthlyMetrics.$.popularityScore': monthData.popularityScore,
                'monthlyMetrics.$.bestsellerScore': monthData.bestsellerScore
              }
            }
          }
        });
      }
    }
  }
  
  if (bulkYearlyOps.length > 0) {
    await ProductYearlyPerformance.bulkWrite(bulkYearlyOps);
    console.log(`✅ Updated ${Object.keys(yearlyData).length} yearly performance documents`);
  }
}

/**
 * Clean up old performance analytics data
 * @returns {Promise<void>}
 */
export async function cleanupPerformanceAnalytics() {
  const lockValue = await lockService.acquireProcessingLock('performanceCleanup', 300);
  if (!lockValue) {
    console.log('Performance analytics cleanup already in progress');
    return;
  }
  
  try {
    // Delete monthly documents older than 2 years
    const cutoffDate = moment().subtract(2, 'years').startOf('year');
    
    const monthlyResult = await ProductMonthlyPerformance.deleteMany({
      year: { $lt: cutoffDate.year() }
    });
    
    console.log(`🗑️ Deleted ${monthlyResult.deletedCount} old monthly performance documents`);
    
    // Delete yearly documents older than 5 years
    const yearlyResult = await ProductYearlyPerformance.deleteMany({
      year: { $lt: moment().subtract(5, 'years').year() }
    });
    
    console.log(`🗑️ Deleted ${yearlyResult.deletedCount} old yearly performance documents`);
    
  } catch (error) {
    console.error('❌ Error cleaning up performance analytics:', error);
  } finally {
    await lockService.releaseProcessingLock('performanceCleanup', lockValue);
  }
}

export default {
  processPerformanceAnalytics,
  cleanupPerformanceAnalytics
};