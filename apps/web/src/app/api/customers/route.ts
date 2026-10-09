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

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usageRecords: {
          where: { billingPeriod: period },
          include: { metric: true },
        },
      },
    });

    // Enrich with Redis real-time data
    const enriched = await Promise.all(
     customers.map(async (customer: any) => {
        let liveUsage = 0;

        // Sum all usage records for this period
        const dbUsage = customer.usageRecords.reduce((sum: number, r: any) => sum + Number(r.totalValue), 0);

        // Scan Redis for this customer's counters
        const pattern = `usage:${customer.organizationId}:${customer.externalId}:*:${period}`;
        const keys = await scanKeys(pattern);

        for (const key of keys) {
          const value = await redisConnection.get(key);
          if (value) liveUsage += parseFloat(value);
        }

        return {
          id: customer.id,
          externalId: customer.externalId,
          name: customer.name,
          email: customer.email,
          organizationId: customer.organizationId,
          createdAt: customer.createdAt.toISOString(),
          usageRecordsCount: customer.usageRecords.length,
          dbUsage,
          liveUsage: liveUsage || dbUsage,
          metricCount: customer.usageRecords.length,
        };
      })
    );

    return NextResponse.json({
      customers: enriched,
      billingPeriod: period,
    });
  } catch (err) {
    console.error('Customers fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch customers', message: (err as Error).message },
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