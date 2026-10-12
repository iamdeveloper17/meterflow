import 'dotenv/config';
import { createMeteringWorker } from './workers/metering.worker.js';
import { createAggregationWorker } from './jobs/aggregation.job.js';
import { registerCronJobs } from './schedulers/cron.js';
import { logger } from './utils/logger.js';

async function main() {
  logger.info('🚀 Starting MeterFlow worker...');

  // 1. Create metering worker (processes usage events)
  const meteringWorker = createMeteringWorker();

  // 2. Create aggregation worker (syncs Redis → Postgres)
  const aggregationWorker = createAggregationWorker();

  // 3. Register cron jobs
  await registerCronJobs();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down worker...');
    await Promise.all([
      meteringWorker.close(),
      aggregationWorker.close(),
    ]);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('✅ All workers running, waiting for jobs...');
}

main().catch((err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Worker failed to start');
  process.exit(1);
});