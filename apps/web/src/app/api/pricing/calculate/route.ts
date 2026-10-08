import { NextResponse } from 'next/server';
import { calculateTieredPrice } from '@meterflow/shared';
import type { PricingTier } from '@meterflow/shared';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { units, tiers, currency } = body as {
      units: number;
      tiers: PricingTier[];
      currency?: string;
    };

    if (typeof units !== 'number' || units < 0) {
      return NextResponse.json(
        { error: 'Invalid units. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json(
        { error: 'Tiers must be a non-empty array.' },
        { status: 400 }
      );
    }

    const result = calculateTieredPrice(units, tiers, currency || 'INR');
    return NextResponse.json(result);
  } catch (err) {
    console.error('Calculate error:', err);
    return NextResponse.json(
      { error: 'Calculation failed', message: (err as Error).message },
      { status: 500 }
    );
  }
}