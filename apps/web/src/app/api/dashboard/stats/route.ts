import { NextResponse } from 'next/server';
import { prisma } from '@meterflow/database';
import { redisConnection } from '@meterflow/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Total customers
    const totalCustomers = await prisma.customer.count();

    // 2. Total usage records
    const totalUsageRecords = await prisma.usageRecord.count();

    // 3. Total events
    const totalEvents = await prisma.rawEvent.count();

    // 4. Total usage sum
    const usageSum = await prisma.usageRecord.aggregate({
      _sum: { totalValue: true },
    });

    // 5. Active Redis counters
    const redisKeys = await scanKeys('usage:*');

    // 6. Recent events
    const recentEvents = await prisma.rawEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // 7. Last 7 days usage
    const last7Days = await getLast7DaysUsage();

    return NextResponse.json({
      stats: {
        totalCustomers,
        totalUsageRecords,
        totalEvents,
        totalUsage: Number(usageSum._sum.totalValue || 0),
        activeCounters: redisKeys.length,
      },
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        customerId: e.customerId,
        metricName: e.metricName,
        value: Number(e.value),
        createdAt: e.createdAt.toISOString(),
      })),
      chartData: last7Days,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: (err as Error).message },
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

async function getLast7DaysUsage() {
  const days: { date: string; usage: number; events: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const events = await prisma.rawEvent.findMany({
      where: {
        createdAt: {
          gte: day,
          lt: nextDay,
        },
      },
    });

    const usage = events.reduce((sum, e) => sum + Number(e.value), 0);

    days.push({
      date: day.toISOString().split('T')[0],
      usage,
      events: events.length,
    });
  }

  return days;
}