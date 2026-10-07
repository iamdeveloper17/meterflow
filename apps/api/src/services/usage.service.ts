import { prisma } from '@meterflow/database';
import { redisConnection } from '@meterflow/shared';

interface UsageQueryResult {
  customerId: string;
  organizationId: string;
  metric: string;
  billingPeriod: string;
  totalValue: number;
  eventCount: number;
  lastUpdatedAt: string;
  source: 'redis' | 'postgres' | 'combined';
}

/**
 * Get current billing period (YYYY-MM)
 */
function getCurrentBillingPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Fetch usage for a specific customer + metric + period
 * Combines Redis (real-time) + Postgres (historical)
 */
export async function getUsage(params: {
  organizationId: string;
  customerId: string;
  metric?: string;
  billingPeriod?: string;
}): Promise<UsageQueryResult[]> {
  const period = params.billingPeriod || getCurrentBillingPeriod();

  // Fetch from Postgres (aggregated)
  const metricFilter = params.metric
    ? {
        organizationId_name: {
          organizationId: params.organizationId,
          name: params.metric,
        },
      }
    : undefined;

  const dbRecords = await prisma.usageRecord.findMany({
    where: {
      billingPeriod: period,
      customer: {
        organizationId: params.organizationId,
        externalId: params.customerId,
      },
      ...(metricFilter && { metric: metricFilter }),
    },
    include: {
      metric: true,
      customer: true,
    },
  });

  // Build result map: metricName → record
  const results = new Map<string, UsageQueryResult>();

  for (const record of dbRecords) {
    results.set(record.metric.name, {
      customerId: params.customerId,
      organizationId: params.organizationId,
      metric: record.metric.name,
      billingPeriod: record.billingPeriod,
      totalValue: Number(record.totalValue),
      eventCount: record.eventCount,
      lastUpdatedAt: record.lastUpdatedAt.toISOString(),
      source: 'postgres',
    });
  }

  // Fetch from Redis (real-time) — only for the requested metric or all
  const metricsToCheck = params.metric
    ? [params.metric]
    : Array.from(results.keys());

  // If no metric specified, scan Redis for all metrics of this customer
  if (!params.metric) {
    const pattern = `usage:${params.organizationId}:${params.customerId}:*:${period}`;
    const redisKeys = await scanKeys(pattern);

    for (const key of redisKeys) {
      const parts = key.split(':');
      const metricName = parts[3];
      if (metricName && !metricsToCheck.includes(metricName)) {
        metricsToCheck.push(metricName);
      }
    }
  }

  for (const metricName of metricsToCheck) {
    const redisKey = `usage:${params.organizationId}:${params.customerId}:${metricName}:${period}`;
    const redisValue = await redisConnection.get(redisKey);
    const eventCountKey = `event_count:${params.organizationId}:${params.customerId}:${metricName}:${period}`;
    const eventCount = await redisConnection.get(eventCountKey);

    if (redisValue !== null) {
      const redisValueNum = parseFloat(redisValue);
      const existing = results.get(metricName);

      if (existing) {
        // Combine: use Redis value as latest (it's always >= Postgres)
        results.set(metricName, {
          ...existing,
          totalValue: redisValueNum,
          eventCount: eventCount ? parseInt(eventCount, 10) : existing.eventCount,
          lastUpdatedAt: new Date().toISOString(),
          source: 'combined',
        });
      } else {
        // Only in Redis (not yet aggregated to Postgres)
        results.set(metricName, {
          customerId: params.customerId,
          organizationId: params.organizationId,
          metric: metricName,
          billingPeriod: period,
          totalValue: redisValueNum,
          eventCount: eventCount ? parseInt(eventCount, 10) : 0,
          lastUpdatedAt: new Date().toISOString(),
          source: 'redis',
        });
      }
    }
  }

  return Array.from(results.values());
}

/**
 * Scan Redis for keys matching pattern
 */
async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redisConnection.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100
    );
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
}