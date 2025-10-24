/**
 * PricingCard Component
 * Displays a pricing plan option with student count selector
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check } from 'lucide-react';
import { PRICING, calculateTotal, calculateCredits, formatPrice } from '@/features/subscriptions/pricingConfig';
import type { PlanType, BillingCycle } from '@/features/subscriptions/types';

interface PricingCardProps {
  planType: PlanType;
  onSubscribe: (planType: PlanType, billingCycle: BillingCycle, studentCount: number) => void;
  loading?: boolean;
  isCurrentPlan?: boolean;
  currentStudentCount?: number;
  currentBillingCycle?: BillingCycle;
}

const PLAN_FEATURES: Record<PlanType, string[]> = {
  '30min': [
    '30 minutes per student per month',
    'Unlimited assignments',
    'Real-time feedback',
    'Progress tracking',
  ],
  '60min': [
    '60 minutes per student per month',
    'Unlimited assignments',
    'Real-time feedback',
    'Progress tracking',
    'Priority support',
  ],
};

export function PricingCard({ planType, onSubscribe, loading, isCurrentPlan, currentStudentCount, currentBillingCycle }: PricingCardProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(isCurrentPlan && currentBillingCycle ? currentBillingCycle : 'monthly');
  const [studentCount, setStudentCount] = useState<number>(isCurrentPlan && currentStudentCount ? currentStudentCount : 25);

  const total = calculateTotal(planType, billingCycle, studentCount);
  const credits = calculateCredits(planType, studentCount);

  const handleSubscribe = () => {
    if (studentCount > 0) {
      onSubscribe(planType, billingCycle, studentCount);
    }
  };

  return (
    <Card className={`relative ${isCurrentPlan ? 'border-blue-500 border-2' : ''}`}>
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
          Current Plan
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">
          {planType === '30min' ? '30 Minutes' : '60 Minutes'}
        </CardTitle>
        <CardDescription>
          {planType === '30min'
            ? 'Perfect for smaller classes'
            : 'Ideal for larger classes or intensive practice'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Billing Cycle Selection */}
        <div className="space-y-3">
          <Label>Billing Cycle</Label>
          <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as BillingCycle)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id={`${planType}-monthly`} />
              <Label htmlFor={`${planType}-monthly`} className="font-normal cursor-pointer">
                Monthly - {PRICING[planType].monthly.label}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quarterly" id={`${planType}-quarterly`} />
              <Label htmlFor={`${planType}-quarterly`} className="font-normal cursor-pointer flex items-center gap-2">
                Quarterly - {PRICING[planType].quarterly.label}
                <Badge variant="secondary" className="text-xs">Save 10%</Badge>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Student Count Input */}
        <div className="space-y-2">
          <Label htmlFor={`${planType}-students`}>Number of Students</Label>
          <Input
            id={`${planType}-students`}
            type="number"
            min="1"
            value={studentCount}
            onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="text-lg"
          />
          <p className="text-sm text-gray-500">
            = {credits.toFixed(1)} hours of audio per {billingCycle === 'monthly' ? 'month' : 'quarter'}
          </p>
        </div>

        {/* Total Price */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(total)}
            <span className="text-base font-normal text-gray-500">
              /{billingCycle === 'monthly' ? 'month' : 'quarter'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 pt-4 border-t">
          {PLAN_FEATURES[planType].map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan || studentCount < 1}
          size="lg"
        >
          {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}
