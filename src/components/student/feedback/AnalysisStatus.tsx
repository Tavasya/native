import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import SubmissionFeedback from '@/pages/student/SubmissionFeedback';

interface AnalysisStatusProps {
  submissionUrl: string;
}

interface StatusResponse {
  status_logs: {
    questions: {
      [key: string]: {
        fluency: 'not_started' | 'in_progress' | 'completed';
        grammar: 'not_started' | 'in_progress' | 'completed';
        pronunciation: 'not_started' | 'in_progress' | 'completed';
        vocabulary: 'not_started' | 'in_progress' | 'completed';
        started_at: string;
      };
    };
    submission_started: string;
    total_questions: number;
  };
}

// Wrapper component that accepts submissionId as prop
const SubmissionFeedbackWrapper: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  // Mock the useParams hook by creating a context or using a different approach
  // For now, let's use a simple approach by modifying the URL temporarily
  React.useEffect(() => {
    // Store the current URL
    const currentUrl = window.location.pathname;
    // Update the URL to include the submission ID
    window.history.replaceState(null, '', `/student/submission/${submissionId}/feedback`);
    
    // Cleanup function to restore the original URL when component unmounts
    return () => {
      window.history.replaceState(null, '', currentUrl);
    };
  }, [submissionId]);

  return <SubmissionFeedback />;
};

const AnalysisStatus: React.FC<AnalysisStatusProps> = ({ submissionUrl }) => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('status_logs')
        .eq('id', submissionUrl)
        .single();

      if (error) {
        throw new Error(`Failed to fetch status: ${error.message}`);
      }

      setStatus({ status_logs: data.status_logs });
      setError(null);
      return data.status_logs;
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      return null;
    }
  }, [submissionUrl]);

  // Memoize the status update handler to prevent recreating on every render
  const handleStatusUpdate = useCallback((payload: any) => {
    console.log('=== Status Update Received ===');
    console.log('New Status from Payload:', JSON.stringify(payload.new.status_logs, null, 2));

    setStatus(prevStatus => {
      if (prevStatus?.status_logs?.questions) {
        // Preserve completed statuses
        const newStatusLogs = { ...payload.new.status_logs };
        
        // Log changes before preservation
        console.log('=== Status Changes Before Preservation ===');
        Object.entries(prevStatus.status_logs.questions).forEach(([questionId, oldQuestion]) => {
          if (newStatusLogs.questions?.[questionId]) {
            Object.entries(oldQuestion).forEach(([aspect, oldStatus]) => {
              if (aspect !== 'started_at') {
                const newStatus = newStatusLogs.questions[questionId][aspect as keyof typeof oldQuestion];
                if (oldStatus !== newStatus) {
                  console.log(`Question ${questionId} - ${aspect}: ${oldStatus} -> ${newStatus}`);
                }
              }
            });
          }
        });

        Object.entries(prevStatus.status_logs.questions).forEach(([questionId, oldQuestion]) => {
          if (newStatusLogs.questions?.[questionId]) {
            Object.entries(oldQuestion).forEach(([aspect, oldStatus]) => {
              if (oldStatus === 'completed' && aspect !== 'started_at') {
                const before = newStatusLogs.questions[questionId][aspect as keyof typeof oldQuestion];
                newStatusLogs.questions[questionId][aspect as keyof typeof oldQuestion] = 'completed';
                const after = newStatusLogs.questions[questionId][aspect as keyof typeof oldQuestion];
                if (before !== after) {
                  console.log(`Preserved completed status for Question ${questionId} - ${aspect}: ${before} -> ${after}`);
                }
              }
            });
          }
        });

        console.log('Final Status After Preservation:', JSON.stringify(newStatusLogs, null, 2));
        return { status_logs: newStatusLogs };
      } else {
        console.log('No previous status, setting initial status');
        return { status_logs: payload.new.status_logs };
      }
    });
  }, []);

  const calculateProgress = (question: {
    fluency: 'not_started' | 'in_progress' | 'completed';
    grammar: 'not_started' | 'in_progress' | 'completed';
    pronunciation: 'not_started' | 'in_progress' | 'completed';
    vocabulary: 'not_started' | 'in_progress' | 'completed';
  }) => {
    const aspects = ['fluency', 'grammar', 'pronunciation', 'vocabulary'] as const;
    const completed = aspects.filter(aspect => question[aspect] === 'completed').length;
    return (completed / aspects.length) * 100;
  };

  const calculateTotalProgress = () => {
    // Add comprehensive null checks
    if (!status || !status.status_logs || !status.status_logs.questions) {
      return 0;
    }
    
    const questions = Object.values(status.status_logs.questions);
    if (questions.length === 0) {
      return 0;
    }
    
    const totalProgress = questions.reduce((sum, question) => {
      // Add null check for question
      if (!question) return sum;
      return sum + calculateProgress(question);
    }, 0);
    
    return totalProgress / questions.length;
  };

  useEffect(() => {
    if (!submissionUrl) {
      setError('No submission URL provided');
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up realtime subscription specifically for status_logs
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
        handleStatusUpdate
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionUrl, handleStatusUpdate, fetchStatus]);

  // Effect to handle refresh when progress reaches 100%
  useEffect(() => {
    const totalProgress = calculateTotalProgress();
    console.log('Current Progress:', totalProgress, 'Is Refreshing:', isRefreshing);
    
    if (totalProgress === 100 && !isRefreshing) {
      console.log('Progress reached 100%, showing feedback component...');
      const showFeedback = async () => {
        setIsRefreshing(true);
        try {
          console.log('Waiting 2 seconds before showing feedback...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('Setting analysis complete, showing feedback component...');
          
          // Set analysis complete to show feedback component
          setAnalysisComplete(true);
        } catch (error) {
          console.error('Error during feedback transition:', error);
          setIsRefreshing(false);
        }
      };
      
      showFeedback();
    }
  }, [status?.status_logs, isRefreshing]);

  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

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

  // Show feedback component when analysis is complete
  if (analysisComplete) {
    return <SubmissionFeedbackWrapper submissionId={submissionUrl} />;
  }

  if (!status) {
    return (
      <Card className="shadow-sm border-0 bg-white">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <p>Loading status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
            <div className="flex items-center gap-4">
              <Progress value={calculateTotalProgress()} className="flex-1" />
              <span className="text-sm font-medium text-gray-600">
                {Math.round(calculateTotalProgress())}%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Question Analysis</h3>
            {status.status_logs?.questions && Object.entries(status.status_logs.questions).map(([questionId, question]) => (
              <div key={questionId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Question {questionId}</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateProgress(question)} className="w-32" />
                    <span className="text-sm text-gray-600">
                      {Math.round(calculateProgress(question))}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(['fluency', 'grammar', 'pronunciation', 'vocabulary'] as const).map((aspect) => (
                    <div key={aspect} className="flex items-center gap-2">
                      {getStatusIcon(question[aspect])}
                      <span className="text-sm capitalize">{aspect}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!status.status_logs?.questions && (
              <div className="text-center text-gray-500 py-4">
                <p>No question analysis data available yet.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisStatus;