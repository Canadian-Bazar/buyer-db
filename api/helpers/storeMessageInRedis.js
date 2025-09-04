import { redisClient } from "../redis/redis.config.js";
import Chat from '../models/chat.schema.js'


async function updateUserChatOrder(userId, chatId, messageTimestamp) {
   try {
       const timestamp = new Date(messageTimestamp).getTime();
       await redisClient.zadd(`USER_CHATS:${userId}`, timestamp, chatId);
       // Keep only recent 500 chats per user
       await redisClient.zremrangebyrank(`USER_CHATS:${userId}`, 0, -501);
   } catch (error) {
       console.error('Redis update failed:', error);
   }
}

// MODIFIED: Your existing storeMessageInRedis function
async function storeMessageInRedis(chatId, message , type='product') {
   try {

       if(type==='product')
       await redisClient.rpush(`MESSAGEQUEUE:${chatId}`, JSON.stringify(message));
       else
       await redisClient.rpush(`SERVICE_MESSAGEQUEUE:${chatId}` , JSON.stringify(message))


       
       // NEW: Update chat order for both users
       const chat = await Chat.findById(chatId).select('buyer seller').lean();
       if (chat) {
           await updateUserChatOrder(chat.buyer, chatId, message.createdAt);
           await updateUserChatOrder(chat.seller, chatId, message.createdAt);
       }
   } catch (error) {
       console.error('Error storing message in Redis:', error);
   }
}



export default storeMessageInRedis