import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, FileText, Users, Coins, ArrowLeft } from 'lucide-react';
import { getTeacherUsageMetrics } from '@/features/metrics/metricsService';
import { supabase } from '@/integrations/supabase/client';

interface UsageMetrics {
  totalMinutes: number;
  analysisCosts: number;
  totalSubmissions: number;
  totalRecordings: number;
  activeStudents: number;
  avgRecordingLength: number;
  costPerMinute: number;
  costPerSubmission: number;
  remainingHours: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  credits: number | null;
}

interface Subscription {
  current_period_start: string;
  current_period_end: string;
}

const TeacherUsagePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      navigate('/dev');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch teacher info
        const { data: teacherData, error: teacherError } = await supabase
          .from('users')
          .select('id, name, email, credits')
          .eq('id', teacherId)
          .single();

        if (teacherError) throw teacherError;
        setTeacher(teacherData);

        // Fetch subscription info
        const { data: subscriptionData } = await supabase
          .from('teacher_subscriptions')
          .select('current_period_start, current_period_end')
          .eq('teacher_id', teacherId)
          .single();

        setSubscription(subscriptionData);

        // Fetch usage metrics
        const metricsData = await getTeacherUsageMetrics(teacherId);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Error fetching teacher usage:', err);
        setError('Failed to load teacher usage data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId, navigate]);

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

  if (error || !metrics || !teacher) {
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

  const hoursUsed = metrics.totalMinutes / 60;
  const creditAllocation = teacher.credits || 0;
  const usagePercent = creditAllocation > 0 ? (hoursUsed / creditAllocation) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => window.close()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Close
        </button>

        {/* Teacher Info Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {teacher.name}'s Usage Metrics
          </h1>
          <p className="text-gray-600">{teacher.email}</p>
          {subscription && (
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

        {/* Credit Summary Card */}
        <Card className="mb-8 border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">Credit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Allocated</p>
                <p className="text-2xl font-bold text-gray-900">{formatHours(creditAllocation)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Used</p>
                <p className="text-2xl font-bold text-orange-600">{formatHours(hoursUsed)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${metrics.remainingHours < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatHours(metrics.remainingHours)}
                  {metrics.remainingHours < 0 && <span className="text-sm ml-2">(OVER LIMIT)</span>}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Usage: {usagePercent.toFixed(1)}%</span>
                <span className={usagePercent > 90 ? 'text-red-600 font-semibold' : usagePercent > 75 ? 'text-orange-600' : ''}>
                  {usagePercent > 90 ? '⚠️ Critical' : usagePercent > 75 ? '⚠️ High' : '✓ Normal'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usagePercent > 90 ? 'bg-red-500' :
                    usagePercent > 75 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
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
              <p className={`text-xs mt-1 ${metrics.remainingHours < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {metrics.remainingHours < 0 ? 'Over limit' : 'Available hours'}
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

          {/* Active Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-[#272A69]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeStudents}</div>
              <p className="text-xs text-gray-500 mt-1">
                Enrolled students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Breakdown</CardTitle>
            <CardDescription>
              {subscription
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

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">Average Recording Length</p>
                  <p className="text-sm text-gray-500">Average duration per recording</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatMinutes(metrics.avgRecordingLength)}
                </p>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">Estimated Costs</p>
                  <p className="text-sm text-gray-500">Total processing costs (Deepgram + OpenAI)</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  ${metrics.analysisCosts.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Cost Per Minute</p>
                  <p className="text-sm text-gray-500">Average cost per audio minute</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  ${metrics.costPerMinute.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Admin Dashboard. All rights reserved.
      </footer>
    </div>
  );
};

export default TeacherUsagePage;
