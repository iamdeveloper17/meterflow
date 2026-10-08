import { DollarSign } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PricingCard } from '@/components/pricing/pricing-card';
import { PriceCalculator } from '@/components/pricing/price-calculator';
import { Card, CardContent } from '@/components/ui/card';

async function getPlans() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pricing`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { plans: [] };
  }
}

export default async function PricingPage() {
  const data = await getPlans();

  return (
    <DashboardShell>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define your pricing tiers and calculate revenue.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">Active Plans</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.plans.length}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Plans list */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Active Plans</h2>
            {data.plans.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium">No pricing plans yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add plans via Prisma Studio or API.
                  </p>
                </CardContent>
              </Card>
            ) : (
              data.plans.map((plan: any) => (
                <PricingCard key={plan.id} plan={plan} />
              ))
            )}
          </div>

          {/* Calculator */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Try It Out</h2>
            <PriceCalculator />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}