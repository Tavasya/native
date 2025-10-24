/**
 * SubscriptionsPage
 * Main subscription management page for teachers
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchTeacherSubscription,
  createCheckoutSession,
  openCustomerPortal,
  updateStudentCount,
  cancelSubscription,
} from '@/features/subscriptions/subscriptionThunks';
import { PricingCard } from '@/components/subscriptions/PricingCard';
import { SubscriptionStatus } from '@/components/subscriptions/SubscriptionStatus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { PlanType, BillingCycle } from '@/features/subscriptions/types';

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { subscription, loading, updateLoading, cancelLoading } = useAppSelector(
    (state) => state.subscriptions
  );

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStudentCount, setNewStudentCount] = useState(subscription?.student_count || 25);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch subscription on mount
    dispatch(fetchTeacherSubscription(user.id));
  }, [user, dispatch, navigate]);

  useEffect(() => {
    if (subscription?.student_count) {
      setNewStudentCount(subscription.student_count);
    }
  }, [subscription?.student_count]);

  const handleSubscribe = async (
    planType: PlanType,
    billingCycle: BillingCycle,
    studentCount: number
  ) => {
    if (!user) return;

    try {
      await dispatch(
        createCheckoutSession({
          plan_type: planType,
          billing_cycle: billingCycle,
          student_count: studentCount,
          teacher_id: user.id,
          success_url: `${window.location.origin}/teacher/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/teacher/subscriptions`,
        })
      ).unwrap();

      // User will be redirected to Stripe checkout
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to create checkout session',
        variant: 'destructive',
      });
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    try {
      await dispatch(
        openCustomerPortal({
          teacher_id: user.id,
          return_url: `${window.location.origin}/teacher/subscriptions`,
        })
      ).unwrap();

      // User will be redirected to Stripe customer portal
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to open billing portal',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStudentCount = async () => {
    if (!user || !newStudentCount || newStudentCount < 1) return;

    try {
      const result = await dispatch(
        updateStudentCount({
          teacher_id: user.id,
          new_student_count: newStudentCount,
        })
      ).unwrap();

      toast({
        title: 'Success',
        description: result.message,
      });

      setShowUpdateDialog(false);

      // Refresh subscription
      dispatch(fetchTeacherSubscription(user.id));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to update student count',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    try {
      const result = await dispatch(
        cancelSubscription({
          teacher_id: user.id,
          cancel_at_period_end: true,
        })
      ).unwrap();

      toast({
        title: 'Success',
        description: result.message,
      });

      setShowCancelDialog(false);

      // Refresh subscription
      dispatch(fetchTeacherSubscription(user.id));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const hasActiveSubscription = subscription?.status === 'active';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/teacher/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-600 mt-2">
            Manage your subscription plan and billing information
          </p>
        </div>

        {loading && !subscription ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plans">Available Plans</TabsTrigger>
              {hasActiveSubscription && (
                <TabsTrigger value="manage">Manage</TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <SubscriptionStatus
                subscription={subscription}
                onManageBilling={hasActiveSubscription ? handleManageBilling : undefined}
                onUpgrade={
                  !hasActiveSubscription
                    ? () => setActiveTab('plans')
                    : undefined
                }
                loading={loading}
              />
            </TabsContent>

            {/* Available Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <PricingCard
                  planType="30min"
                  onSubscribe={handleSubscribe}
                  loading={loading}
                  isCurrentPlan={subscription?.plan_type === '30min' && hasActiveSubscription}
                />
                <PricingCard
                  planType="60min"
                  onSubscribe={handleSubscribe}
                  loading={loading}
                  isCurrentPlan={subscription?.plan_type === '60min' && hasActiveSubscription}
                />
              </div>
            </TabsContent>

            {/* Manage Tab */}
            {hasActiveSubscription && (
              <TabsContent value="manage" className="space-y-6">
                <div className="grid gap-6 max-w-2xl">
                  {/* Update Student Count */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-2">Update Student Count</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Adjust the number of students in your subscription. You'll be charged or
                      credited prorated amounts.
                    </p>
                    <Button onClick={() => setShowUpdateDialog(true)} variant="outline">
                      Update Student Count
                    </Button>
                  </div>

                  {/* Cancel Subscription */}
                  <div className="bg-white rounded-lg border border-red-200 p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Cancel Subscription
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your subscription will remain active until the end of the current billing
                      period.
                    </p>
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="destructive"
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Update Student Count Dialog */}
        <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Student Count</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the new number of students. Your billing will be adjusted prorated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="student-count">Number of Students</Label>
              <Input
                id="student-count"
                type="number"
                min="1"
                value={newStudentCount}
                onChange={(e) => setNewStudentCount(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateStudentCount} disabled={updateLoading}>
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until{' '}
                {subscription?.current_period_end &&
                  new Date(subscription.current_period_end).toLocaleDateString()}
                . After that, you'll be moved to the free tier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
