/**
 * Pricing Configuration
 * Hardcoded pricing structure matching your backend Stripe products
 */

import type { PricingStructure } from './types';

export const PRICING: PricingStructure = {
  '30min': {
    monthly: {
      price: 3.0,
      label: '$3/student/month',
    },
    quarterly: {
      price: 8.1,
      label: '$8.10/student/quarter (10% off)',
    },
  },
  '60min': {
    monthly: {
      price: 6.0,
      label: '$6/student/month',
    },
    quarterly: {
      price: 16.2,
      label: '$16.20/student/quarter (10% off)',
    },
  },
};

/**
 * Calculate total price for a subscription
 */
export function calculateTotal(
  planType: '30min' | '60min',
  billingCycle: 'monthly' | 'quarterly',
  studentCount: number
): number {
  const pricePerStudent = PRICING[planType][billingCycle].price;
  return pricePerStudent * studentCount;
}

/**
 * Calculate credits hours for a plan
 * Formula: (plan_minutes × student_count) / 60
 */
export function calculateCredits(
  planType: '30min' | '60min',
  studentCount: number
): number {
  const minutes = planType === '30min' ? 30 : 60;
  return (minutes * studentCount) / 60;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(planType: '30min' | '60min' | null): string {
  if (!planType) return 'Free';
  return planType === '30min' ? '30 Minutes/Student' : '60 Minutes/Student';
}

/**
 * Get billing cycle display name
 */
export function getBillingCycleDisplayName(
  billingCycle: 'monthly' | 'quarterly' | null
): string {
  if (!billingCycle) return '';
  return billingCycle === 'monthly' ? 'Monthly' : 'Quarterly';
}
