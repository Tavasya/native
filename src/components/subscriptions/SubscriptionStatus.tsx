/**
 * SubscriptionStatus Component
 * Displays current subscription information and management options
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Users, Calendar, AlertCircle, DollarSign } from 'lucide-react';
import { getPlanDisplayName, getBillingCycleDisplayName, calculateTotal, formatPrice } from '@/features/subscriptions/pricingConfig';
import type { TeacherSubscription } from '@/features/subscriptions/types';

interface SubscriptionStatusProps {
  subscription: TeacherSubscription | null;
  onManageBilling?: () => void;
  onUpgrade?: () => void;
  loading?: boolean;
}

export function SubscriptionStatus({
  subscription,
  onManageBilling,
  onUpgrade,
  loading,
}: SubscriptionStatusProps) {
  // Free tier (no subscription)
  if (!subscription || !subscription.status || subscription.status === 'canceled') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>You're currently on the free tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Current Plan</div>
            <div className="text-2xl font-semibold">Free</div>
            <p className="text-sm text-gray-500 mt-1">No credits included</p>
          </div>

          {onUpgrade && (
            <Button onClick={onUpgrade} className="w-full" size="lg">
              Subscribe to Get Started
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Active subscription
  const isActive = subscription.status === 'active';
  const isPastDue = subscription.status === 'past_due';
  const isCanceling = subscription.cancel_at_period_end === true;

  return (
    <Card className={isPastDue ? 'border-red-300' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : isPastDue ? 'destructive' : 'secondary'}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Issue Warning */}
        {isPastDue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">Payment Issue</p>
              <p className="text-red-700">
                There was a problem processing your payment. Please update your payment method.
              </p>
            </div>
          </div>
        )}

        {/* Plan Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-600">Plan</div>
            <div className="text-xl font-semibold">
              {getPlanDisplayName(subscription.plan_type)}
            </div>
            <div className="text-sm text-gray-500">
              {getBillingCycleDisplayName(subscription.billing_cycle)} billing
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                Students
              </div>
              <div className="text-lg font-semibold mt-0.5">
                {subscription.student_count || 0}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Credits
              </div>
              <div className="text-lg font-semibold mt-0.5">
                {subscription.credits?.toFixed(1) || 0} hours
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Price
              </div>
              <div className="text-lg font-semibold mt-0.5">
                {subscription.plan_type && subscription.billing_cycle && subscription.student_count
                  ? formatPrice(calculateTotal(subscription.plan_type, subscription.billing_cycle, subscription.student_count))
                  : '$0.00'}
                <span className="text-xs font-normal text-gray-500">
                  /{subscription.billing_cycle === 'monthly' ? 'mo' : 'qtr'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Period */}
        {subscription.current_period_end && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">{isCanceling ? 'Access ends on: ' : 'Renews on: '}</span>
              <span className="font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {isCanceling ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-900">
                  <strong>Subscription Canceled:</strong> Your subscription has been canceled and will end on {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}. You'll still have access to all features until then. After that, you'll be moved to the free tier and <strong>won't be charged again</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Next Billing Date:</p>
                  <p className="text-xs text-blue-800">
                    On {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}, you'll be charged your recurring subscription cost of <strong>
                      {subscription.plan_type && subscription.billing_cycle && subscription.student_count
                        ? formatPrice(calculateTotal(subscription.plan_type, subscription.billing_cycle, subscription.student_count))
                        : '$0.00'}
                    </strong>.
                  </p>
                </div>
                <div className="border-t border-blue-300 pt-2">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> If you recently updated your student count, your next payment may include a prorated charge for the additional students, plus your full {subscription.billing_cycle === 'monthly' ? 'monthly' : 'quarterly'} subscription. After that, you'll be charged <strong>
                      {subscription.plan_type && subscription.billing_cycle && subscription.student_count
                        ? formatPrice(calculateTotal(subscription.plan_type, subscription.billing_cycle, subscription.student_count))
                        : '$0.00'}
                    </strong> per {subscription.billing_cycle === 'monthly' ? 'month' : 'quarter'}.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          {onManageBilling && (
            <Button
              onClick={onManageBilling}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Manage Billing & Payment
            </Button>
          )}

          {onUpgrade && subscription.plan_type === '30min' && (
            <Button onClick={onUpgrade} variant="default" className="w-full" disabled={loading}>
              Upgrade to 60 Minutes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
