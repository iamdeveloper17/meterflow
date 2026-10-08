import { Activity, BarChart3, TrendingUp } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MetricTable } from '@/components/metrics/metric-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getMetrics() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/metrics`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return { metrics: [], billingPeriod: '' };
  }
}

export default async function MetricsPage() {
  const data = await getMetrics();
  const totalUsage = data.metrics.reduce(
    (sum: number, m: any) => sum + m.liveUsage,
    0
  );

  return (
    <DashboardShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Metrics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All tracked usage metrics across your organization.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Metrics</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.metrics.length}
                </p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="mt-1 text-2xl font-semibold">
                  {totalUsage.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Billing Period</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.billingPeriod || '—'}
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricTable metrics={data.metrics} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}