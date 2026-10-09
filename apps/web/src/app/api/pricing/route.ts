import { NextResponse } from 'next/server';
import { prisma } from '@meterflow/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        prices: {
          include: { metric: true },
        },
      },
    });

    const formatted = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      model: plan.model,
      baseFee: Number(plan.baseFee),
      tiers: plan.tiers,
      customer: plan.customer
        ? { id: plan.customer.id, name: plan.customer.name }
        : null,
      prices: plan.prices.map((p: any) => ({
        metricName: p.metric.name,
        pricePerUnit: p.pricePerUnit ? Number(p.pricePerUnit) : null,
        includedUnits: p.includedUnits ? Number(p.includedUnits) : null,
      })),
      createdAt: plan.createdAt.toISOString(),
    }));

    return NextResponse.json({ plans: formatted });
  } catch (err) {
    console.error('Pricing fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch plans', message: (err as Error).message },
      { status: 500 }
    );
  }
}