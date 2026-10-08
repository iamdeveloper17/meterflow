import { Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CustomerTable } from '@/components/customers/customer-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getCustomers() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/customers`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return { customers: [], billingPeriod: '' };
  }
}

export default async function CustomersPage() {
  const data = await getCustomers();

  return (
    <DashboardShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your customers and view their live usage.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.customers.length}
                </p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Billing Period</p>
              <p className="mt-1 text-2xl font-semibold">
                {data.billingPeriod || '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Live Usage</p>
              <p className="mt-1 text-2xl font-semibold">
                {data.customers
                  .reduce((sum: number, c: any) => sum + c.liveUsage, 0)
                  .toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerTable customers={data.customers} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}