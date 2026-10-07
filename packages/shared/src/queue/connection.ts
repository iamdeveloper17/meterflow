import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  // Don't throw immediately — allow the app to load .env first
  console.warn('⚠️  REDIS_URL not set. Redis features will fail when used.');
}

export const redisConnection = new IORedis(REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redisConnection.on('ready', () => {
  console.log('🎯 Redis ready to accept commands');
});