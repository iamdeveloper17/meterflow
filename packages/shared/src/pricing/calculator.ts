import type { PricingTier, PricingResult, PricingBreakdown } from './types';

/**
 * Calculate price using tiered (graduated) pricing
 *
 * Example tiers:
 *   [
 *     { upTo: 1000, price: 0 },
 *     { upTo: 5000, price: 0.10 },
 *     { upTo: null, price: 0.05 }
 *   ]
 *
 * Usage:
 *   500 units  → 500 × ₹0          = ₹0
 *   1000 units → 1000 × ₹0         = ₹0
 *   2000 units → 1000 × ₹0 + 1000 × ₹0.10 = ₹100
 *   5000 units → 1000 × ₹0 + 4000 × ₹0.10 = ₹400
 *   10000 units → 1000 × ₹0 + 4000 × ₹0.10 + 5000 × ₹0.05 = ₹650
 */
export function calculateTieredPrice(
  totalUnits: number,
  tiers: PricingTier[],
  currency: string = 'INR'
): PricingResult {
  if (totalUnits < 0) {
    throw new Error('Total units cannot be negative');
  }

  if (!tiers || tiers.length === 0) {
    return {
      totalUnits,
      totalAmount: 0,
      breakdown: [],
      currency,
    };
  }

  // Sort tiers by upTo (null = Infinity at end)
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });

  const breakdown: PricingBreakdown[] = [];
  let remainingUnits = totalUnits;
  let previousLimit = 0;
  let totalAmount = 0;

  for (const tier of sortedTiers) {
    if (remainingUnits <= 0) break;

    const tierCapacity = tier.upTo === null ? Infinity : tier.upTo - previousLimit;
    const unitsInThisTier = Math.min(remainingUnits, tierCapacity);
    const amountForTier = unitsInThisTier * tier.price;

    if (unitsInThisTier > 0) {
      breakdown.push({
        tier,
        units: unitsInThisTier,
        amount: roundTo2(amountForTier),
      });

      totalAmount += amountForTier;
      remainingUnits -= unitsInThisTier;
    }

    if (tier.upTo !== null) {
      previousLimit = tier.upTo;
    }
  }

  return {
    totalUnits,
    totalAmount: roundTo2(totalAmount),
    breakdown,
    currency,
  };
}

/**
 * Round to 2 decimal places (avoid floating point errors)
 */
function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}