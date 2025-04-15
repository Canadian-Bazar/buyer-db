import { redisClient, REDIS_KEYS } from './redis.config.js';

/**
 * Acquire a distributed lock using Redis
 * @param {string} lockName - The name of the lock
 * @param {number} lockTimeout - Lock timeout in seconds
 * @returns {Promise<string|null>} Lock value if acquired, null otherwise
 */
export async function acquireProcessingLock(lockName, lockTimeout = 60) {
  try {
    const lockKey = `${REDIS_KEYS.PROCESSING_LOCK}:${lockName}`;
    const lockValue = Date.now().toString();
    
    // Try to set the lock with NX option (only if it doesn't exist)
    const result = await redisClient.set(lockKey, lockValue, 'NX', 'EX', lockTimeout);
    
    if (result === 'OK') {
      console.log(`Lock acquired: ${lockName}`, { lockValue });
      return lockValue;
    }
    
    console.log(`Failed to acquire lock: ${lockName}`);
    return null;
  } catch (error) {
    console.error('Error acquiring processing lock', { lockName, error: error.message });
    return null;
  }
}

/**
 * Release a distributed lock
 * @param {string} lockName - The name of the lock
 * @param {string} lockValue - The value of the lock to ensure it's ours
 * @returns {Promise<boolean>} True if released, false otherwise
 */
export async function releaseProcessingLock(lockName, lockValue) {
  try {
    const lockKey = `${REDIS_KEYS.PROCESSING_LOCK}:${lockName}`;
    
    // Get current lock value
    const currentValue = await redisClient.get(lockKey);
    
    // Only delete if the current value matches our lock value
    if (currentValue === lockValue) {
      await redisClient.del(lockKey);
      console.log(`Lock released: ${lockName}`, { lockValue });
      return true;
    }
    
    console.log(`Failed to release lock: ${lockName}, values don't match`, {
      expected: lockValue,
      actual: currentValue
    });
    return false;
  } catch (error) {
    console.error('Error releasing processing lock', { lockName, lockValue, error: error.message });
    return false;
  }
}

/**
 * Check if a lock exists
 * @param {string} lockName - The name of the lock
 * @returns {Promise<boolean>} True if lock exists, false otherwise
 */
export async function checkLockExists(lockName) {
  try {
    const lockKey = `${REDIS_KEYS.PROCESSING_LOCK}:${lockName}`;
    const exists = await redisClient.exists(lockKey);
    return exists === 1;
  } catch (error) {
    console.error('Error checking if lock exists', { lockName, error: error.message });
    return false;
  }
}

export default {
  acquireProcessingLock,
  releaseProcessingLock,
  checkLockExists
};