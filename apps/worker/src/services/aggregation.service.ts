import { prisma } from '@meterflow/database';
import { redisConnection } from '@meterflow/shared';
import { logger } from '../utils/logger';

/**
 * Scan Redis for all usage counters matching pattern
 * Key format: usage:{orgId}:{customerId}:{metric}:{billingPeriod}
 */
async function scanUsageKeys(): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redisConnection.scan(
      cursor,
      'MATCH',
      'usage:*',
      'COUNT',
      100
    );
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
}

/**
 * Parse a Redis key into structured data
 */
function parseUsageKey(key: string): {
  organizationId: string;
  customerId: string;
  metric: string;
  billingPeriod: string;
} | null {
  // Format: usage:{orgId}:{customerId}:{metric}:{billingPeriod}
  const parts = key.split(':');

  if (parts.length !== 5 || parts[0] !== 'usage') {
    return null;
  }

  return {
    organizationId: parts[1],
    customerId: parts[2],
    metric: parts[3],
    billingPeriod: parts[4],
  };
}

/**
 * Sync a single Redis counter to Postgres (upsert)
 */
async function syncCounterToPostgres(key: string, value: number): Promise<void> {
  const parsed = parseUsageKey(key);
  if (!parsed) {
    logger.warn({ key }, 'Invalid usage key format, skipping');
    return;
  }

  // Find metric in database (must exist)
  const metric = await prisma.metric.findUnique({
    where: {
      organizationId_name: {
        organizationId: parsed.organizationId,
        name: parsed.metric,
      },
    },
  });

  if (!metric) {
    // Metric not registered — skip silently (or log for debugging)
    logger.debug(
      { key, metricName: parsed.metric, orgId: parsed.organizationId },
      'Metric not found in DB, skipping'
    );
    return;
  }

  // Find customer in database
  const customer = await prisma.customer.findUnique({
    where: {
      organizationId_externalId: {
        organizationId: parsed.organizationId,
        externalId: parsed.customerId,
      },
    },
  });

  if (!customer) {
    // Customer not registered — skip
    logger.debug(
      { key, customerId: parsed.customerId, orgId: parsed.organizationId },
      'Customer not found in DB, skipping'
    );
    return;
  }

  // Upsert aggregated usage
  await prisma.usageRecord.upsert({
    where: {
      customerId_metricId_billingPeriod: {
        customerId: customer.id,
        metricId: metric.id,
        billingPeriod: parsed.billingPeriod,
      },
    },
    create: {
      customerId: customer.id,
      metricId: metric.id,
      billingPeriod: parsed.billingPeriod,
      totalValue: value,
      eventCount: 1,
    },
    update: {
      totalValue: value,
      lastUpdatedAt: new Date(),
    },
  });

  logger.debug(
    {
      customerId: parsed.customerId,
      metric: parsed.metric,
      billingPeriod: parsed.billingPeriod,
      value,
    },
    'Usage synced to Postgres'
  );
}

/**
 * Main aggregation function — scans Redis, syncs to Postgres
 */
export async function runAggregation(): Promise<{
  scanned: number;
  synced: number;
  skipped: number;
  errors: number;
}> {
  const startTime = Date.now();
  logger.info('🔄 Starting aggregation...');

  const keys = await scanUsageKeys();
  logger.info({ count: keys.length }, 'Found usage keys in Redis');

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const key of keys) {
    try {
      const valueStr = await redisConnection.get(key);
      if (!valueStr) {
        skipped++;
        continue;
      }

      const value = parseFloat(valueStr);
      if (isNaN(value)) {
        skipped++;
        continue;
      }

      const beforeSync = parseUsageKey(key);
      if (!beforeSync) {
        skipped++;
        continue;
      }

      await syncCounterToPostgres(key, value);
      synced++;
    } catch (err) {
      errors++;
      logger.error({ error: (err as Error).message, key }, 'Failed to sync key');
    }
  }

  const duration = Date.now() - startTime;

  logger.info(
    {
      scanned: keys.length,
      synced,
      skipped,
      errors,
      durationMs: duration,
    },
    '✅ Aggregation complete'
  );

  return {
    scanned: keys.length,
    synced,
    skipped,
    errors,
  };
}