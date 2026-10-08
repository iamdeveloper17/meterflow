import type { UsageEventJob } from '@meterflow/shared';
import { redisConnection } from '@meterflow/shared';
import { prisma } from '@meterflow/database';
import { logger } from '../utils/logger';

/**
 * Generate Redis key for usage counter
 */
function getCounterKey(job: UsageEventJob, billingPeriod: string): string {
  return `usage:${job.organizationId}:${job.customerId}:${job.metric}:${billingPeriod}`;
}

/**
 * Get current billing period in YYYY-MM format
 */
function getBillingPeriod(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Increment usage counter atomically in Redis
 */
export async function incrementUsageCounter(job: UsageEventJob): Promise<{
  key: string;
  newValue: number;
  billingPeriod: string;
}> {
  const billingPeriod = getBillingPeriod(job.timestamp);
  const key = getCounterKey(job, billingPeriod);

  const newValue = await redisConnection.incrbyfloat(key, job.value);

  logger.debug(
    {
      key,
      customerId: job.customerId,
      metric: job.metric,
      value: job.value,
      newValue,
      billingPeriod,
    },
    'Counter incremented'
  );

  return {
    key,
    newValue: Number(newValue),
    billingPeriod,
  };
}

/**
 * Track event count in Redis
 */
export async function incrementEventCount(job: UsageEventJob): Promise<void> {
  const billingPeriod = getBillingPeriod(job.timestamp);
  const countKey = `event_count:${job.organizationId}:${job.customerId}:${job.metric}:${billingPeriod}`;
  await redisConnection.incr(countKey);
}

/**
 * Store raw event in Redis (7 days TTL)
 */
export async function storeRawEventInRedis(job: UsageEventJob): Promise<void> {
  const eventKey = `event:${job.eventId}`;

  await redisConnection.setex(
    eventKey,
    7 * 24 * 60 * 60,
    JSON.stringify({
      eventId: job.eventId,
      organizationId: job.organizationId,
      customerId: job.customerId,
      metric: job.metric,
      value: job.value,
      timestamp: job.timestamp,
      metadata: job.metadata,
      processedAt: Date.now(),
    })
  );
}

/**
 * Store raw event in Postgres (permanent, for audit + dashboard)
 */
export async function storeRawEventInPostgres(job: UsageEventJob): Promise<void> {
  try {
    await prisma.rawEvent.create({
      data: {
        id: job.eventId,
        organizationId: job.organizationId,
        customerId: job.customerId,
        metricName: job.metric,
        value: job.value,
        idempotencyKey: job.idempotencyKey,
        metadata: (job.metadata ?? {}) as object,
      },
    });
  } catch (err) {
    // Duplicate (idempotency) — ignore
    if ((err as any)?.code === 'P2002') {
      logger.debug({ eventId: job.eventId }, 'Raw event already exists, skipping');
      return;
    }
    throw err;
  }
}

/**
 * Legacy function name for compatibility
 */
export async function storeRawEvent(job: UsageEventJob): Promise<void> {
  await storeRawEventInRedis(job);
}