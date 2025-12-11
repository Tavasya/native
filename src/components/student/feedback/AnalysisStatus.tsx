import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import SubmissionFeedback from '@/pages/student/SubmissionFeedback';

interface AnalysisStatusProps {
  submissionUrl: string;
}

// Wrapper component to handle the submission ID parameter
const SubmissionFeedbackWrapper: React.FC<{ submissionId: string }> = ({  }) => {
  return <SubmissionFeedback />;
};

const AnalysisStatus: React.FC<AnalysisStatusProps> = ({ submissionUrl }) => {
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showReprocessButton, setShowReprocessButton] = useState(false);

  // Progress bar simulation - 2 minutes (120 seconds)
  useEffect(() => {
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const targetDuration = 120000; // 2 minutes in milliseconds
      const calculatedProgress = Math.min((elapsed / targetDuration) * 100, 99);

      // If status is graded, jump to 100%
      if (currentStatus === 'graded') {
        setProgress(100);
        setShowReprocessButton(false);
        clearInterval(progressInterval);
      } else {
        setProgress(calculatedProgress);
        // Show reprocess button if stuck at 99%
        if (calculatedProgress >= 99) {
          setShowReprocessButton(true);
        }
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(progressInterval);
  }, [startTime, currentStatus]);

  // Reprocess submission
  const handleReprocess = async () => {
    try {
      setIsReprocessing(true);
      setShowReprocessButton(false);

      const response = await fetch("https://audio-analysis-api-tplvyztxfa-uc.a.run.app/api/v1/submissions/process-by-uid", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submission_uid: submissionUrl
        })
      });

      if (response.ok) {
        // Reset the timer and progress
        setStartTime(Date.now());
        setProgress(0);
      } else {
        const errorText = await response.text();
        console.error('Reprocess error:', errorText);
        setShowReprocessButton(true);
      }
    } catch (error) {
      console.error('Reprocess failed:', error);
      setShowReprocessButton(true);
    } finally {
      setIsReprocessing(false);
    }
  };

  // Poll for status changes
  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('status')
        .eq('id', submissionUrl)
        .single();

      if (error) {
        throw new Error(`Failed to fetch status: ${error.message}`);
      }

      if (data && data.status) {
        setCurrentStatus(data.status);

        // If status is graded, show feedback after brief delay
        if (data.status === 'graded') {
          setProgress(100);
          setTimeout(() => {
            setShowFeedback(true);
          }, 500);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    }
  }, [submissionUrl]);

  useEffect(() => {
    if (!submissionUrl) {
      setError('No submission URL provided');
      return;
    }

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    const pollInterval = setInterval(fetchStatus, 5000);

    // Set up realtime subscription for status changes
    const channel = supabase
      .channel(`submission-status-${submissionUrl}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionUrl}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            setCurrentStatus(payload.new.status);
            if (payload.new.status === 'graded') {
              setProgress(100);
              setTimeout(() => {
                setShowFeedback(true);
              }, 500);
            }
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [submissionUrl, fetchStatus]);

  // Show feedback component when status is graded
  if (showFeedback) {
    return <SubmissionFeedbackWrapper submissionId={submissionUrl} />;
  }

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-white">
        <CardContent className="p-4">
          <div className="text-red-600">
            <h3 className="font-semibold mb-2">Error Loading Status</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isReprocessing ? 'Reprocessing Your Submission' : 'Analyzing Your Submission'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isReprocessing ? 'Reprocessing your responses...' : 'Please wait while we process your responses...'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-2">
              <Progress value={progress} className="flex-1 h-3" />
              <span className="text-lg font-bold text-gray-900 min-w-[60px] text-right">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              {currentStatus === 'graded' ? 'Analysis complete! Loading your results...' : 'Processing in progress...'}
            </p>
          </div>

          {showReprocessButton && !isReprocessing && (
            <div className="text-center">
              <button
                onClick={handleReprocess}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reprocess Submission
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Taking longer than expected? Click to retry processing.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisStatus;