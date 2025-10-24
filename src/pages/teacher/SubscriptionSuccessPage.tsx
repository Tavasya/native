/**
 * SubscriptionSuccessPage
 * Displayed after successful Stripe checkout
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTeacherSubscription } from '@/features/subscriptions/subscriptionThunks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const { subscription, loading } = useAppSelector((state) => state.subscriptions);

  const [pollCount, setPollCount] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!sessionId) {
      navigate('/teacher/subscriptions');
      return;
    }

    // Start polling for subscription status
    const pollSubscription = async () => {
      try {
        await dispatch(fetchTeacherSubscription(user.id)).unwrap();
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    // Poll immediately
    pollSubscription();

    let count = 0;
    // Poll every 2 seconds for up to 30 seconds
    const interval = setInterval(() => {
      count++;
      if (count >= 15) {
        // Stop polling after 30 seconds (15 * 2s)
        clearInterval(interval);
        setPollCount(count);
        return;
      }
      pollSubscription();
      setPollCount(count);
    }, 2000);

    return () => clearInterval(interval);
  }, [user, sessionId, dispatch, navigate]);

  // Check if subscription is active
  const isSubscriptionActive = subscription?.status === 'active';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            {isSubscriptionActive ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-3xl">Payment Successful!</CardTitle>
                <CardDescription className="text-lg">
                  Your subscription has been activated
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <CardTitle className="text-3xl">Processing Payment...</CardTitle>
                <CardDescription className="text-lg">
                  Please wait while we activate your subscription
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {isSubscriptionActive ? (
              <>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  <div className="text-sm text-gray-600">Your Plan</div>
                  <div className="text-2xl font-semibold">
                    {subscription.plan_type === '30min' ? '30 Minutes' : '60 Minutes'} /{' '}
                    {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Quarterly'}
                  </div>
                  <div className="text-gray-700">
                    {subscription.student_count} students
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {subscription.credits?.toFixed(1)} hours of credits available
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="w-full"
                    size="lg"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate('/teacher/subscriptions')}
                    variant="outline"
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                {pollCount >= 14 ? (
                  <>
                    <p className="mb-4">
                      This is taking longer than expected. Your payment was successful, but the
                      subscription activation is still processing.
                    </p>
                    <Button onClick={() => navigate('/teacher/subscriptions')} variant="outline">
                      Check Subscription Status
                    </Button>
                  </>
                ) : (
                  <p>Your subscription will be ready in just a moment...</p>
                )}
              </div>
            )}

            {/* Session ID for debugging */}
            {sessionId && (
              <div className="text-xs text-gray-400 border-t pt-4">
                Session: {sessionId.substring(0, 20)}...
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
