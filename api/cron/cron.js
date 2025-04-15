// src/cron/analytics.cron.js
import cron from 'node-cron';
import categoryBatchService from '../batches/category.batch.js';
import userInteractionBatchService from '../services/batch/user.interaction.batch.service.js';

/**
 * Schedule all analytics-related cron jobs
 */
export function scheduleAnalyticsCronJobs() {
  // Process category stats every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running category stats batch processing...');
    try {
      await categoryBatchService.processCategoryStats();
    } catch (error) {
      console.error('Error in category stats cron job', error);
    }
  });
  
  // Process user interactions every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running user interactions batch processing...');
    try {
      await userInteractionBatchService.processUserInteractions();
    } catch (error) {
      console.error('Error in user interactions cron job', error);
    }
  });
  
  // Reset daily counters at 12:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('Running daily stats reset...');
    try {
      await categoryBatchService.resetDailyCounters();
    } catch (error) {
      console.error('Error in daily reset cron job', error);
    }
  });
  
  // Reset weekly counters at 12:05 AM on Sunday
  cron.schedule('5 0 * * 0', async () => {
    console.log('Running weekly stats reset...');
    try {
      await categoryBatchService.resetWeeklyCounters();
    } catch (error) {
      console.error('Error in weekly reset cron job', error);
    }
  });
  
  // Clean up expired user interactions once a day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running expired interactions cleanup...');
    try {
      await userInteractionBatchService.cleanupExpiredInteractions();
    } catch (error) {
      console.error('Error in interactions cleanup cron job', error);
    }
  });
  
  console.log('Analytics cron jobs scheduled successfully');
}

export default { scheduleAnalyticsCronJobs };
