import { redisClient } from "../redis/redis.config.js";

async function storeMessageInRedis(chatId, message) {
  try {
      const result =  await redisClient.rpush(`MESSAGEQUEUE:${chatId}`, JSON.stringify(message));
    // Keep only last 50 messages for efficiency

  } catch (error) {
    console.error('Error storing message in Redis:', error);
  }
}


export default storeMessageInRedis