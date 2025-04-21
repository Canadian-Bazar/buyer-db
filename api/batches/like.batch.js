import { REDIS_KEYS, redisClient } from "../redis/redis.config.js";
import lockService from '../redis/lock.redis.js';
import mongoose from 'mongoose';
import Liked from '../models/liked.schema.js';


export async function processBatchLikes() {
    const lockValue = await lockService.acquireProcessingLock('batchLikes', 300);
    if (!lockValue) {
      console.log('Batch likes processing already in progress');
      return;
    }
  
    try {
      const keys = await redisClient.keys(REDIS_KEYS.LIKE_BATCH + '*');
      if (keys.length === 0) {
        console.log('No likes to process');
        return;
      }
      
      const bulkOps = [];
      const pipeline = redisClient.pipeline();
      
      for (const key of keys) {
        pipeline.hgetall(key);
      }
      
      const results = await pipeline.exec();
      const deletePipeline = redisClient.pipeline();
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const likeData = results[i][1]; // [err, result] format from pipeline
        
        if (!likeData || !likeData.type) {
          continue;
        }
        
        const keyParts = key.substring(REDIS_KEYS.LIKE_BATCH.length).split(':');
        if (keyParts.length !== 2) {
          console.error(`Invalid key format: ${key}`);
          continue;
        }
        
        const productId = keyParts[0];
        const userId = keyParts[1];
        
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
          console.error(`Invalid ID in key: ${key}`);
          continue;
        }
        
        if (likeData.type === 'like') {
          bulkOps.push({
            updateOne: {
              filter: {
                productId: new mongoose.Types.ObjectId(productId),
                buyerId: new mongoose.Types.ObjectId(userId)
              },
              update: {
                $setOnInsert: {
                  productId: new mongoose.Types.ObjectId(productId),
                  buyerId: new mongoose.Types.ObjectId(userId)
                }
              },
              upsert: true
            }
          });
        } else if (likeData.type === 'dislike') {
          bulkOps.push({
            deleteOne: {
              filter: {
                productId: new mongoose.Types.ObjectId(productId),
                buyerId: new mongoose.Types.ObjectId(userId)
              }
            }
          });
        }
        
        deletePipeline.del(key);
      }
      
      if (bulkOps.length > 0) {
        await Liked.bulkWrite(bulkOps, { ordered: false });
        console.log(`Processed ${bulkOps.length} like/dislike operations`);
      }
      
      await deletePipeline.exec();
      
      return bulkOps.length;
    } catch (err) {
      console.error('Error processing batch likes', { error: err.message });
      throw err;
    } finally {
      await lockService.releaseProcessingLock('batchLikes', lockValue);
    }
  }

  export default {
    processBatchLikes
  }