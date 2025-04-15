import { redisClient } from './redis.config.js';

const flushRedis = async () => {
  try {
    await redisClient.flushall();
    console.log('✅ Redis has been flushed successfully.');
  } catch (error) {
    console.error('❌ Error flushing Redis:', error);
  } finally {
    redisClient.disconnect(); // Cleanly disconnect
  }
};

flushRedis();
