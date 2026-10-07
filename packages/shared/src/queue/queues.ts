import { Queue } from 'bullmq';
import { redisConnection } from './connection';
import { QUEUE_NAMES } from '../constants';

/**
 * Usage Events Queue
 * Receives every event from API, consumed by worker
 */
export const usageEventsQueue = new Queue(QUEUE_NAMES.USAGE_EVENTS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 3600,   // Or remove after 1 hour
    },
    removeOnFail: {
      count: 5000, // Keep last 5000 failed jobs
    },
  },
});

/**
 * Aggregation Queue
 * Runs periodically to sync Redis counters -> Postgres
 */
export const aggregationQueue = new Queue(QUEUE_NAMES.AGGREGATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});