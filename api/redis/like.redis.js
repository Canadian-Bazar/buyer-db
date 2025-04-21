import { redisClient , REDIS_KEYS } from "./redis.config";




export async function likeProductHandler(productId, userId) {
    try {
        const likeKey = REDIS_KEYS.LIKE_BATCH + productId.toString() + ':' + userId.toString();
        const likeKeyExists = await redisClient.exists(likeKey);
        
        if (!likeKeyExists) {
            await redisClient.set(likeKey, '1');
        } else {
            await redisClient.del(likeKey);
        }
    } catch (err) {
        console.error('Error liking product', { productId, userId, error: err.message });
        throw err;
    }
}



export async function processBatchLikes(){
    try{
        const keys = await redisClient.keys(REDIS_KEYS.LIKE_BATCH + '*');
        if (keys.length === 0) {
            console.log('No likes to process');
            return;
        }
        
        const pipeline = redisClient.pipeline();
        keys.forEach(key => {
            pipeline.get(key);
            pipeline.del(key);
        });
        
        const results = await pipeline.exec();
        
        results.forEach((result, index) => {
            if (result[0]) {
                console.log(`Error processing key ${keys[index]}: ${result[0].message}`);
            } else {
                console.log(`Processed key ${keys[index]}: ${result[1]}`);
            }
        });
    }catch(err){
        console.error('Error processing batch likes', { error: err.message });
        throw err;
    }

}
