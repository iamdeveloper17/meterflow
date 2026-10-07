import type { UsageEventJob } from '@meterflow/shared';
import { redisConnection } from '@meterflow/shared';
import { logger } from '../utils/logger';

/**
 * Generate Redis key for usage counter
 * Format: usage:{organizationId}:{customerId}:{metric}:{billingPeriod}
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
 * Increment usage counter atomically
 */
export async function incrementUsageCounter(job: UsageEventJob): Promise<{
  key: string;
  newValue: number;
  billingPeriod: string;
}> {
  const billingPeriod = getBillingPeriod(job.timestamp);
  const key = getCounterKey(job, billingPeriod);

  // Atomic increment (Redis INCRBYFLOAT for decimal support)
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
 * Track event count (how many events, not the value)
 */
export async function incrementEventCount(job: UsageEventJob): Promise<void> {
  const billingPeriod = getBillingPeriod(job.timestamp);
  const countKey = `event_count:${job.organizationId}:${job.customerId}:${job.metric}:${billingPeriod}`;

  await redisConnection.incr(countKey);
}

/**
 * Store raw event metadata for audit (short-lived, 7 days)
 */
export async function storeRawEvent(job: UsageEventJob): Promise<void> {
  const eventKey = `event:${job.eventId}`;

  await redisConnection.setex(
    eventKey,
    7 * 24 * 60 * 60, // 7 days in seconds
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