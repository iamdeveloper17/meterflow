import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn('⚠️  REDIS_URL not set. Redis features will fail when used.');
}

export const redisConnection = new Redis(REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected');
});

redisConnection.on('error', (err: Error) => {
  console.error('❌ Redis error:', err.message);
});

redisConnection.on('ready', () => {
  console.log('🎯 Redis ready to accept commands');
});