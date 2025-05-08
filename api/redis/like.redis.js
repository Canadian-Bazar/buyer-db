import { redisClient , REDIS_KEYS } from "./redis.config.js";




export async function likeProductHandler(productId, userId , type) {
    try {
        const likeKey = REDIS_KEYS.LIKE_BATCH + productId.toString() + ':' + userId.toString();
        console.log(likeKey)
        await redisClient.hset(likeKey, 'type', type);
    } catch (err) {
        console.error('Error liking product', { productId, userId, error: err.message });
        throw err;
    }
}




