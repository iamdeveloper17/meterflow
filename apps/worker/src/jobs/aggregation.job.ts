import { Worker } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '@meterflow/shared';
import { runAggregation } from '../services/aggregation.service';
import { logger } from '../utils/logger';

export function createAggregationWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.AGGREGATION,
    async (job) => {
      logger.info({ jobId: job.id }, 'Starting aggregation job');
      const result = await runAggregation();
      return result;
    },
    {
      connection: redisConnection,
      concurrency: 1, // Only 1 aggregation at a time
    }
  );

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, '✅ Aggregation job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, error: err.message },
      '❌ Aggregation job failed'
    );
  });

  logger.info('🎯 Aggregation worker created');
  return worker;
}