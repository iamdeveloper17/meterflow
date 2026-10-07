import 'dotenv/config';
import { createMeteringWorker } from './workers/metering.worker';
import { logger } from './utils/logger';

async function main() {
  logger.info('🚀 Starting MeterFlow worker...');

  const worker = createMeteringWorker();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down worker...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('✅ Worker running, waiting for jobs...');
}

main().catch((err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Worker failed to start');
  process.exit(1);
});