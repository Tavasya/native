import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, FileText, Users, Coins } from 'lucide-react';
import { getTeacherUsageMetrics } from '@/features/metrics/metricsService';
import { fetchTeacherSubscription } from '@/features/subscriptions/subscriptionThunks';
import { SubscriptionStatus } from '@/components/subscriptions/SubscriptionStatus';

interface UsageMetrics {
  totalMinutes: number;
  totalSubmissions: number;
  totalRecordings: number;
  totalStudents: number;
  activeStudents: number;
  avgRecordingLength: number;
  remainingHours: number;
}

const UsagePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { subscription } = useAppSelector((s) => s.subscriptions);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both metrics and subscription
        const [metricsData] = await Promise.all([
          getTeacherUsageMetrics(user.id),
          dispatch(fetchTeacherSubscription(user.id)),
        ]);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Error fetching usage metrics:', err);
        setError('Failed to load usage metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, dispatch]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#272A69]" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">{error || 'No data available'}</p>
          </div>
        </main>
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    return `${minutes.toFixed(1)} min`;
  };

  const formatHours = (hours: number) => {
    const isNegative = hours < 0;
    const absHours = Math.abs(hours);
    const totalMinutes = Math.round(absHours * 60);
    const wholeHours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const prefix = isNegative ? '-' : '';
    if (wholeHours === 0) {
      return `${prefix}${mins}m`;
    }
    return `${prefix}${wholeHours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Metrics</h1>
          <p className="text-gray-600">Track your platform usage and costs</p>
          {subscription && subscription.current_period_start && subscription.current_period_end && (
            <p className="text-sm text-gray-500 mt-2">
              Billing Period: {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
          {!subscription && (
            <p className="text-sm text-gray-500 mt-2">
              No active subscription (showing last 30 days)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Remaining Hours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Hours</CardTitle>
              <Coins className="h-4 w-4 text-[#272A69]" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.remainingHours < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatHours(metrics.remainingHours)}
              </div>
              <p className={`text-xs mt-1 ${metrics.remainingHours < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {metrics.remainingHours < 0 ? '⚠️ Over limit - please top up' : 'Available hours'}
              </p>
            </CardContent>
          </Card>

          {/* Total Minutes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audio Minutes</CardTitle>
              <Clock className="h-4 w-4 text-[#272A69]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(metrics.totalMinutes)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Total recorded audio
              </p>
            </CardContent>
          </Card>

          {/* Total Submissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <FileText className="h-4 w-4 text-[#272A69]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSubmissions}</div>
              <p className="text-xs text-gray-500 mt-1">
                Student submissions graded
              </p>
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-[#272A69]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeStudents}</div>
              <p className="text-xs text-gray-500 mt-1">
                Active this month
              </p>
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">{metrics.totalStudents}</span> total enrolled
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <SubscriptionStatus
            subscription={subscription}
            onManageBilling={() => navigate('/teacher/subscriptions')}
            onUpgrade={() => navigate('/teacher/subscriptions')}
          />
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Breakdown</CardTitle>
            <CardDescription>
              {subscription && subscription.current_period_start
                ? `Detailed view for current billing period (since ${new Date(subscription.current_period_start).toLocaleDateString()})`
                : 'Detailed view for last 30 days'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">Total Recordings</p>
                  <p className="text-sm text-gray-500">Number of audio recordings processed</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">{metrics.totalRecordings}</p>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Average Recording Length</p>
                  <p className="text-sm text-gray-500">Average duration per recording</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatMinutes(metrics.avgRecordingLength)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Teacher Dashboard. All rights reserved.
      </footer>
    </div>
  );
};

export default UsagePage;
