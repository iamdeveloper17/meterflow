'use client';

import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { PricingTier } from '@meterflow/shared';

interface PricingResult {
  totalUnits: number;
  totalAmount: number;
  currency: string;
  breakdown: Array<{
    tier: PricingTier;
    units: number;
    amount: number;
  }>;
}

export function PriceCalculator() {
  const [units, setUnits] = useState(5000);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Default tiers (Stripe-style graduated)
  const defaultTiers: PricingTier[] = [
    { upTo: 1000, price: 0 },
    { upTo: 5000, price: 0.1 },
    { upTo: null, price: 0.05 },
  ];

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ units, tiers: defaultTiers, currency: 'INR' }),
        });
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error('Calculate failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [units]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          Live Price Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="units">Enter usage units</Label>
          <Input
            id="units"
            type="number"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value) || 0)}
            min={0}
          />
          <p className="text-xs text-muted-foreground">
            Default tiers: 1000 free, 1000-5000 @ ₹0.10, 5000+ @ ₹0.05
          </p>
        </div>

        {result && (
          <>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">Total price</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {result.currency} {result.totalAmount.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                for {result.totalUnits.toLocaleString()} units
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Breakdown
              </p>
              {result.breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No charges — within free tier
                </p>
              ) : (
                result.breakdown.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        T{i + 1}
                      </Badge>
                      <span className="text-muted-foreground">
                        {item.units.toLocaleString()} × {result.currency}{' '}
                        {item.tier.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-medium">
                      {result.currency} {item.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}