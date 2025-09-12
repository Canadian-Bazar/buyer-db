import { redisClient } from './redis.config.js'

/**
 * Publisher for quotation analytics events
 * Sends events to seller-db for analytics tracking
 */

export const QUOTATION_EVENTS_CHANNEL = 'quotation-analytics-events'

/**
 * Publish quotation sent event to seller-db analytics
 */
export const publishQuotationSentEvent = async (quotationData) => {
  try {
    const event = {
      type: 'QUOTATION_SENT',
      quotationId: quotationData.quotationId,
      productId: quotationData.productId,
      serviceId: quotationData.serviceId,
      sellerId: quotationData.sellerId,
      buyerId: quotationData.buyerId,
      isService: quotationData.isService || false,
      timestamp: new Date().toISOString()
    }

    await redisClient.publish(QUOTATION_EVENTS_CHANNEL, JSON.stringify(event))
    
    console.log(`📤 Published QUOTATION_SENT event: ${quotationData.isService ? 'SERVICE' : 'PRODUCT'} - ${quotationData.quotationId}`)
    
    return true
  } catch (error) {
    console.error('❌ Failed to publish quotation sent event:', error)
    return false
  }
}

/**
 * Publish quotation status change events (for future use)
 */
export const publishQuotationStatusEvent = async (quotationData, status) => {
  try {
    const event = {
      type: `QUOTATION_${status.toUpperCase()}`,
      quotationId: quotationData.quotationId,
      productId: quotationData.productId,
      serviceId: quotationData.serviceId, 
      sellerId: quotationData.sellerId,
      buyerId: quotationData.buyerId,
      isService: quotationData.isService || false,
      previousStatus: quotationData.previousStatus,
      newStatus: status,
      timestamp: new Date().toISOString()
    }

    await redisClient.publish(QUOTATION_EVENTS_CHANNEL, JSON.stringify(event))
    
    console.log(`📤 Published QUOTATION_${status.toUpperCase()} event: ${quotationData.quotationId}`)
    
    return true
  } catch (error) {
    console.error(`❌ Failed to publish quotation ${status} event:`, error)
    return false
  }
}

export default {
  publishQuotationSentEvent,
  publishQuotationStatusEvent,
  QUOTATION_EVENTS_CHANNEL
}