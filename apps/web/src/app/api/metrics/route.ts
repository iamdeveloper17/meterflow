import { NextResponse } from 'next/server';
import { prisma } from '@meterflow/database';
import { redisConnection } from '@meterflow/shared';

export const dynamic = 'force-dynamic';

function getCurrentBillingPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function GET() {
  try {
    const period = getCurrentBillingPeriod();

    const metrics = await prisma.metric.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usageRecords: {
          where: { billingPeriod: period },
        },
      },
    });

    // Enrich each metric with live Redis usage
    const enriched = await Promise.all(
      metrics.map(async (metric: any) => {          // ← async add kiya
        // Scan Redis for all keys matching this metric
        const pattern = `usage:*:*:${metric.name}:${period}`;
        const keys = await scanKeys(pattern);

        let liveUsage = 0;
        let customerCount = 0;

        for (const key of keys) {
          const value = await redisConnection.get(key);
          if (value) {
            liveUsage += parseFloat(value);
            customerCount++;
          }
        }

        const dbUsage = metric.usageRecords.reduce(
          (sum: number, r: any) => sum + Number(r.totalValue),
          0
        );

        return {
          id: metric.id,
          name: metric.name,
          displayName: metric.displayName,
          unit: metric.unit,
          aggregation: metric.aggregation,
          organizationId: metric.organizationId,
          createdAt: metric.createdAt.toISOString(),
          liveUsage: liveUsage || dbUsage,
          customerCount,
          recordCount: metric.usageRecords.length,
        };
      })
    );

    return NextResponse.json({
      metrics: enriched,
      billingPeriod: period,
    });
  } catch (err) {
    console.error('Metrics fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', message: (err as Error).message },
      { status: 500 }
    );
  }
}

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