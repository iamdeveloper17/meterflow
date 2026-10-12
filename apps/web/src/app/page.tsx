import { Users, Activity, TrendingUp, Zap } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@meterflow/database';
import { redisConnection } from '@meterflow/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData() {
  try {
    const totalCustomers = await prisma.customer.count();
    const totalEvents = await prisma.rawEvent.count();
    const totalMetrics = await prisma.metric.count();

    const usageSum = await prisma.usageRecord.aggregate({
      _sum: { totalValue: true },
    });

    const recentEvents = await prisma.rawEvent.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Last 7 days usage
    const last7Days: { date: string; usage: number; events: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const events = await prisma.rawEvent.findMany({
        where: { createdAt: { gte: day, lt: nextDay } },
      });

      last7Days.push({
        date: day.toISOString().split('T')[0],
        usage: events.reduce((sum, e) => sum + Number(e.value), 0),
        events: events.length,
      });
    }

    return {
      stats: {
        totalCustomers,
        totalEvents,
        totalMetrics,
        totalUsage: Number(usageSum._sum.totalValue || 0),
      },
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        customerId: e.customerId,
        metricName: e.metricName,
        value: Number(e.value),
        createdAt: e.createdAt.toISOString(),
      })),
      chartData: last7Days,
    };
  } catch (err) {
    console.error('Dashboard data error:', err);
    return {
      stats: { totalCustomers: 0, totalEvents: 0, totalMetrics: 0, totalUsage: 0 },
      recentEvents: [],
      chartData: [],
    };
  }
}

export default async function HomePage() {
  const { stats, recentEvents, chartData } = await getDashboardData();

  return (
    <DashboardShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning, Amit 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your usage today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            change="+2 this week"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Events Tracked"
            value={stats.totalEvents.toLocaleString()}
            change="+12%"
            changeType="positive"
            icon={Activity}
          />
          <StatCard
            title="Total Usage"
            value={stats.totalUsage.toLocaleString()}
            change="units consumed"
            changeType="neutral"
            icon={TrendingUp}
          />
          <StatCard
            title="Metrics"
            value={stats.totalMetrics.toLocaleString()}
            change="tracked"
            changeType="neutral"
            icon={Zap}
          />
        </div>

        <div className="mt-8">
          <UsageChart data={chartData} />
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No events yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{event.customerId}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.metricName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">+{event.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toISOString().slice(11, 19)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}