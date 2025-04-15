import { redisClient , REDIS_KEYS } from "./redis.config.js";

export  async function trackProductActivity(productId , userId=null , activityType){

  console.log(activityType)
    const validActivityTypes = ['view', 'sent', 'accepted', 'rejected', 'in-progress']

    try{

      console.log(validActivityTypes.includes(activityType))

    if(!validActivityTypes.includes(activityType)){
        throw new Error('Invalid Activity Type')
    }

    const key = `${REDIS_KEYS.PRODUCT_ACTIVITY}${productId}`

    await redisClient.hincrby(key , activityType , 1)
    console.log('bror')
    await redisClient.hset(key , 'lastInteracted' , Date.now().toString())
    console.log('sdjsdsjs')

    const ttl = await redisClient.ttl(key);
    if (ttl < 0) {
      await redisClient.expire(key, 30 * 24 * 60 * 60); // 30 days
    }
}catch(err){
  console.log(err)
    console.error('Error tracking product activity', {
        productId,
        userId,
        activityType,
        error: err.message
      });
      throw err;
}


} 



export async function trackQuotationStatus(productId, quotationId, activityType) {
    try {
      // Map status to activity type

      // console.log(status)
      // let activityType;
      // switch (status) {
      //   case 'sent':
      //     activityType = 'quotation_sent';
      //     break;
      //   case 'in-progess':
      //     activityType = 'quotation_in_progress';
      //     break;
      //   case 'accepted':
      //     activityType = 'quotation_accepted';
      //     break;
      //   case 'rejected':
      //     activityType = 'quotation_rejected';
      //     break;
      //   default:
      //     throw new Error(`Invalid quotation status: ${status}`);
      // }
      
      // Track the activity
      await trackProductActivity(productId, null, activityType);
      
 
      const key = `${REDIS_KEYS.PRODUCT_ACTIVITY}${productId}`;
      const quotationKey = `quotation:${quotationId}`;
      await redisClient.hset(key, quotationKey, activityType);
    } catch (error) {
      console.error('Error tracking quotation status', {
        productId,
        quotationId,
        activityType,
        error: error.message
      });
      throw error;
    }
  }

  export async function getProductActivityStats(productId) {
    try {
      const key = `${REDIS_KEYS.PRODUCT_ACTIVITY}${productId}`;
      const data = await redisClient.hgetall(key);
      
      if (!data) {
        return {
          viewCount: 0,
          quotationCount: 0,
          acceptedQuotationCount: 0,
          rejectedQuotationCount: 0,
          inProgressQuotationCount: 0
        };
      }
      
      return {
        viewCount: parseInt(data.view || '0'),
        quotationCount: parseInt(data.quotation_sent || '0'),
        acceptedQuotationCount: parseInt(data.quotation_accepted || '0'),
        rejectedQuotationCount: parseInt(data.quotation_rejected || '0'),
        inProgressQuotationCount: parseInt(data.quotation_in_progress || '0'),
        lastUpdated: data.lastUpdated ? new Date(parseInt(data.lastUpdated)) : null
      };
    } catch (error) {
      console.error('Error getting product activity stats', {
        productId,
        error: error.message
      });
      throw error;
    }
  }
  
  export default {
    trackProductActivity,
    trackQuotationStatus,
    getProductActivityStats
  };