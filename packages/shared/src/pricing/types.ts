/**
 * Pricing Tier — graduated (Stripe/AWS style)
 * Example:
 *   { upTo: 1000, price: 0 }          // First 1000 units: FREE
 *   { upTo: 5000, price: 0.10 }       // 1000-5000: ₹0.10 each
 *   { upTo: null, price: 0.05 }       // Beyond 5000: ₹0.05 each
 */
export interface PricingTier {
  upTo: number | null;
  price: number;
}

export interface PricingBreakdown {
  tier: PricingTier;
  units: number;
  amount: number;
}

export interface PricingResult {
  totalUnits: number;
  totalAmount: number;
  breakdown: PricingBreakdown[];
  currency: string;
}