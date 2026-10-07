import { usageEventsQueue } from '@meterflow/shared';
import type { UsageEventJob } from '@meterflow/shared';
import { logger } from '../utils/logger';

export async function publishUsageEvent(job: UsageEventJob): Promise<void> {
  try {
    // Use idempotencyKey as jobId to prevent duplicates
    const jobId = job.idempotencyKey || job.eventId;

    await usageEventsQueue.add('track-usage', job, {
      jobId,
    });

    logger.debug({ eventId: job.eventId, jobId }, 'Event queued');
  } catch (error) {
    logger.error({ error, job }, 'Failed to publish event');
    throw error;
  }
}

export async function publishBatchUsageEvents(jobs: UsageEventJob[]): Promise<void> {
  try {
    const bulkJobs = jobs.map((job) => ({
      name: 'track-usage',
      data: job,
      opts: {
        jobId: job.idempotencyKey || job.eventId,
      },
    }));

    await usageEventsQueue.addBulk(bulkJobs);

    logger.debug({ count: jobs.length }, 'Batch events queued');
  } catch (error) {
    logger.error({ error, count: jobs.length }, 'Failed to publish batch');
    throw error;
  }
}