import Redis from 'ioredis'

const redisConfig ={
    host:process.env.REDIS_HOST ,
    port:process.env.REDIS_PORT ,
   
    connectTimeout: 10000,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }

}


export const redisClient = new Redis(redisConfig)


export const REDIS_KEYS={
  CATEGORY_VIEW: 'category:view:',
  CATEGORY_SEARCH: 'category:search:',
  USER_CATEGORY_INTERACTION: 'user:category:',
  PROCESSING_LOCK: 'analytics:processing:lock' ,
  PRODUCT_ACTIVITY: 'product:activity:',
  LIKE_BATCH:'product:like:'

};


redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  
  redisClient.on('error', (err) => {
  });
  
  export default {
    redisClient,
    REDIS_KEYS
  };





