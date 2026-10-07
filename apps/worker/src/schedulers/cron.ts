import { aggregationQueue, QUEUE_NAMES } from '@meterflow/shared';
import { logger } from '../utils/logger';

/**
 * Register all cron jobs
 */
export async function registerCronJobs(): Promise<void> {
  logger.info('🕐 Registering cron jobs...');

  // Cleanup existing repeatable jobs (avoid duplicates on restart)
  const existingJobs = await aggregationQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await aggregationQueue.removeRepeatableByKey(job.key);
  }

  // Register aggregation job — every 5 minutes
  await aggregationQueue.add(
    'aggregate-usage',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes (cron syntax)
      },
      jobId: 'aggregation-cron', // Single job ID
    }
  );

  logger.info('✅ Cron jobs registered (aggregation every 5 minutes)');
}