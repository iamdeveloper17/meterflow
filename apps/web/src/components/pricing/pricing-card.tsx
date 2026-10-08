'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PricingTier } from '@meterflow/shared';

interface PricingPlan {
  id: string;
  name: string;
  currency: string;
  billingPeriod: string;
  model: string;
  baseFee: number;
  tiers: PricingTier[] | null;
  customer: { id: string; name: string } | null;
  prices: Array<{
    metricName: string;
    pricePerUnit: number | null;
    includedUnits: number | null;
  }>;
}

export function PricingCard({ plan }: { plan: PricingPlan }) {
  const tiers = plan.tiers || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{plan.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {plan.customer ? `For: ${plan.customer.name}` : 'Default plan'}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {plan.billingPeriod}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Base fee</span>
          <span className="font-medium">
            {plan.currency} {plan.baseFee.toFixed(2)}
          </span>
        </div>

        <Separator />

        {/* Tiers */}
        {tiers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tiers
            </p>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    T{i + 1}
                  </Badge>
                  <span className="text-muted-foreground">
                    {i === 0 ? '0' : tiers[i - 1].upTo?.toLocaleString()} –{' '}
                    {tier.upTo === null
                      ? '∞'
                      : tier.upTo.toLocaleString()}
                  </span>
                </div>
                <span className="font-medium">
                  {plan.currency} {tier.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No tiers defined</p>
        )}

        {/* Metric prices */}
        {plan.prices.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Metrics
              </p>
              {plan.prices.map((price, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {price.metricName}
                  </code>
                  <span className="text-muted-foreground">
                    {price.includedUnits
                      ? `${price.includedUnits} free`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}