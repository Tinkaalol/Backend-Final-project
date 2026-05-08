import Redis from 'ioredis';
import { config } from './env.js';

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null, 
});

redis.on('error', (err) => {
  console.error(' Redis error:', err.message);
});

export async function connectRedis() {
  if (redis.status === 'connecting' || redis.status === 'ready') {
    return;
  }

  try {
    await redis.connect();
    console.log(' Redis connected');
  } catch (err) {
    if (err.message.includes('already connecting')) {
      return;
    }
    console.error(' Failed to connect to Redis:', err.message);
    throw err;
  }
}