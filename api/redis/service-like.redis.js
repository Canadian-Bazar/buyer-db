import { redisClient , REDIS_KEYS } from "./redis.config.js";




export async function likeServiceHandler(serviceId, userId , type) {
    try {
        const likeKey = REDIS_KEYS.SERVICE_LIKE_BATCH + serviceId.toString() + ':' + userId.toString();
        console.log(likeKey)
        await redisClient.hset(likeKey, 'type', type);
    } catch (err) {
        console.error('Error liking service', { serviceId, userId, error: err.message });
        throw err;
    }
}



