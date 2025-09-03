// src/cron/analytics.cron.js
import cron from 'node-cron';
import categoryBatchService from '../batches/category.batch.js';
import categoryInteractionBatchService from '../batches/category-interaction.batch.js';
import productBatch from '../batches/product.batch.js';
import likeBatch from '../batches/like.batch.js';
import serviceLikeBatch from '../batches/service-like.batch.js';
import { 
  processPerformanceAnalytics, 
  cleanupPerformanceAnalytics 
} from '../batches/product-performance.batch.js';

/**
 * Schedule all analytics-related cron jobs
 */
export function scheduleAnalyticsCronJobs() {
  // Process category stats every 15 minutes
  // cron.schedule('*/15 * * * *', async () => {
  //   console.log('Running category stats batch processing...');
  //   try {
  //     await categoryBatchService.processCategoryStats();
  //   } catch (error) {
  //     console.error('Error in category stats cron job', error);
  //   }
  // });

  // // Process user interactions every 30 minutes
  // cron.schedule('*/30 * * * *', async () => {
  //   console.log('Running user interactions batch processing...');
  //   try {
  //     await categoryInteractionBatchService.processUserInteractions();
  //   } catch (error) {
  //     console.error('Error in user interactions cron job', error);
  //   }
  // });

  // setInterval(async () => {
  //   try {
  //     await categoryBatchService.processCategoryStats();
  //   } catch (error) {
  //     console.error('Error in category stats batch', error);
  //   }
  // }, 15 * 1000);

  // setInterval(async () => {
  //   try {
  //     await categoryInteractionBatchService.processUserInteractions();
  //   } catch (error) {
  //     console.error('Error in user interactions batch', error);
  //   }
  // }, 15 * 1000);

  // cron.schedule('1 0 * * *', async () => {
  //   try {
  //     await categoryBatchService.resetDailyCounters();
  //   } catch (error) {
  //     console.error('Error in daily reset cron job', error);
  //   }
  // });

  // cron.schedule('5 0 * * 0', async () => {
  //   try {
  //     await categoryBatchService.resetWeeklyCounters();
  //   } catch (error) {
  //     console.error('Error in weekly reset cron job', error);
  //   }
  // });

  // Clean up expired user interactions once a day at 2:00 AM
  // cron.schedule('0 2 * * *', async () => {
  //   try {
  //     await categoryInteractionBatchService.cleanupExpiredInteractions();
  //   } catch (error) {
  //     console.error('Error in interactions cleanup cron job', error);
  //   }
  // });

  // cron.schedule('*/15 * * * *', async () => {
  //   console.log('Running product activity batch processing...');
  //   try {
  //     await productBatchService.processProductActivity();
  //   } catch (error) {
  //     console.error('Error in product activity cron job', error);
  //   }
  // });

  // setInterval(
  //   async () =>{
  //     try{
  //        await productBatch.processProductActivity();
  //     }catch(err){
  //       console.error('Error in processing interactions')
  //     }
  //   } , 15*10000
  // )

  // =========================================================================
  // EXISTING BATCH JOBS
  // =========================================================================
  
  // Process batch likes every 15 seconds (existing)
  setInterval(
    async () => {
      try {
        await likeBatch.processBatchLikes();
      } catch (err) {
        console.error('Error in processing like interactions', err);
      }
    }, 15 * 1000
  );

  // Process batch service likes every 15 seconds
  setInterval(
    async () => {
      try {
        await serviceLikeBatch.processBatchServiceLikes();
      } catch (err) {
        console.error('Error in processing service like interactions', err);
      }
    }, 15 * 1000
  );

  // =========================================================================
  // NEW PERFORMANCE ANALYTICS BATCH JOBS
  // =========================================================================

  // Process product activity every 5 minutes (Redis -> MongoDB activity logs + stats)
  setInterval(
    async () => {
      console.log('🔄 Running product activity processing...');
      try {
        await productBatch.processProductActivity();
      } catch (err) {
        console.error('❌ Error in product activity processing:', err);
      }
    }, 5 * 60 * 1000 // 5 minutes
  );

  // Process performance analytics every 15 minutes (Activity logs -> Analytics collections)
  setInterval(
    async () => {
      console.log('📊 Running performance analytics processing...');
      try {
        await processPerformanceAnalytics();
      } catch (err) {
        console.error('❌ Error in performance analytics processing:', err);
      }
    }, 15 * 60 * 1000 // 15 minutes
  );

  // Comprehensive analytics processing every hour (Ensure all data is processed)
  setInterval(
    async () => {
      console.log('🔄 Running comprehensive analytics processing...');
      try {
        await productBatch.processAllAnalytics();
      } catch (err) {
        console.error('❌ Error in comprehensive analytics processing:', err);
      }
    }, 60 * 60 * 1000 // 1 hour
  );

  // =========================================================================
  // CLEANUP JOBS USING CRON SCHEDULE
  // =========================================================================

  // Cleanup old activity logs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running activity logs cleanup (daily at 2 AM)...');
    try {
      await productBatch.cleanupProductActivityLogs();
    } catch (error) {
      console.error('❌ Error in activity logs cleanup:', error);
    }
  }, {
    name: 'activity-logs-cleanup',
    timezone: 'UTC'
  });

  // Cleanup old performance analytics weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('🧹 Running performance analytics cleanup (weekly on Sunday at 3 AM)...');
    try {
      await cleanupPerformanceAnalytics();
    } catch (error) {
      console.error('❌ Error in performance analytics cleanup:', error);
    }
  }, {
    name: 'performance-analytics-cleanup',
    timezone: 'UTC'
  });

  // Comprehensive cleanup monthly on 1st at 4 AM
  cron.schedule('0 4 1 * *', async () => {
    console.log('🧹 Running comprehensive analytics cleanup (monthly on 1st at 4 AM)...');
    try {
      await productBatch.cleanupAllAnalytics();
    } catch (error) {
      console.error('❌ Error in comprehensive analytics cleanup:', error);
    }
  }, {
    name: 'comprehensive-analytics-cleanup',
    timezone: 'UTC'
  });

  console.log('✅ All analytics cron jobs scheduled successfully');
  console.log('📋 Active jobs:');
  console.log('   - Like batch processing: Every 15 seconds');
  console.log('   - Service like batch processing: Every 15 seconds');
  console.log('   - Product activity processing: Every 5 minutes');
  console.log('   - Performance analytics processing: Every 15 minutes');
  console.log('   - Comprehensive analytics processing: Every hour');
  console.log('   - Activity logs cleanup: Daily at 2 AM UTC');
  console.log('   - Performance analytics cleanup: Weekly on Sunday at 3 AM UTC');
  console.log('   - Comprehensive cleanup: Monthly on 1st at 4 AM UTC');
}

export default { scheduleAnalyticsCronJobs };