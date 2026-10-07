import { Worker } from 'bullmq';
import type { UsageEventJob } from '@meterflow/shared';
import { redisConnection, QUEUE_NAMES } from '@meterflow/shared';
import {
  incrementUsageCounter,
  incrementEventCount,
  storeRawEvent,
} from '../services/counter.service';
import { logger } from '../utils/logger';

export function createMeteringWorker(): Worker {
  const worker = new Worker<UsageEventJob>(
    QUEUE_NAMES.USAGE_EVENTS,
    async (job) => {
      const data = job.data;

      logger.info(
        {
          jobId: job.id,
          eventId: data.eventId,
          customerId: data.customerId,
          metric: data.metric,
          value: data.value,
        },
        'Processing usage event'
      );

      // 1. Increment Redis counter (atomic)
      const { key, newValue, billingPeriod } = await incrementUsageCounter(data);

      // 2. Increment event count
      await incrementEventCount(data);

      // 3. Store raw event (audit trail)
      await storeRawEvent(data);

      return {
        eventId: data.eventId,
        counterKey: key,
        newValue,
        billingPeriod,
      };
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process 10 jobs in parallel
      limiter: {
        max: 1000, // Max 1000 jobs
        duration: 1000, // per 1 second
      },
    }
  );

  worker.on('completed', (job, result) => {
    logger.debug(
      {
        jobId: job.id,
        result,
      },
      '✅ Job completed'
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        error: err.message,
        stack: err.stack,
      },
      '❌ Job failed'
    );
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Worker error');
  });

  logger.info('🎯 Metering worker created');
  return worker;
}