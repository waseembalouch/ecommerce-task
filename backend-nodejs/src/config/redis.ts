import Redis from 'ioredis';
import { config } from './env';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

export default redis;
