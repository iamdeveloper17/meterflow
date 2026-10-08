import { Users, Activity, TrendingUp, Zap } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getDashboardData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/dashboard/stats`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return {
      stats: { totalCustomers: 0, totalEvents: 0, totalUsage: 0, activeCounters: 0 },
      recentEvents: [],
      chartData: [],
    };
  }
}

export default async function HomePage() {
  const data = await getDashboardData();
  const { stats, recentEvents, chartData } = data;

  return (
    <DashboardShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning, Amit 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your usage today.
          </p>
        </div>

        {/* Stat Cards */}
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
            title="Active Counters"
            value={stats.activeCounters.toLocaleString()}
            change="in Redis"
            changeType="neutral"
            icon={Zap}
          />
        </div>

        {/* Chart */}
        <div className="mt-8">
          <UsageChart data={chartData} />
        </div>

        {/* Recent Events */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No events yet. Send some to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">POST /v1/events</code>
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {event.customerId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.metricName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">+{event.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toISOString().split('T')[1].slice(0, 8)}
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