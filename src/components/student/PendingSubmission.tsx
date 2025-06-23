import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Submission } from '@/features/submissions/types';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { createInProgressSubmission } from '@/features/submissions/submissionThunks';
import { useToast } from "@/hooks/use-toast";
import AnalysisStatus from './feedback/AnalysisStatus';

interface PendingSubmissionProps {
  submission: Submission;
  onBack: () => void;
}

const PendingSubmission: React.FC<PendingSubmissionProps> = ({ submission, onBack }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const [isPolling, setIsPolling] = useState(true);
  const [currentSubmission, setCurrentSubmission] = useState(submission);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNewAttempt, setIsCreatingNewAttempt] = useState(false);

  // Poll for status updates
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollSubmissionStatus = async () => {
      if (!isPolling) return;

      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submission.id)
          .single();

        if (error) {
          console.error('Error polling submission:', error);
          setError('Failed to update submission status');
          return;
        }

        if (data) {
          // Only update if status has changed
          if (data.status !== currentSubmission.status) {
            setCurrentSubmission(data);
            setError(null);
          }
          
          // Stop polling if the submission is no longer pending
          if (!['pending', 'awaiting_review'].includes(data.status)) {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error in pollSubmissionStatus:', error);
        setError('Failed to update submission status');
      }
    };

    // Poll every 5 seconds
    pollInterval = setInterval(pollSubmissionStatus, 5000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [submission.id, isPolling, currentSubmission.status]);

  const getStatusMessage = () => {
    switch (currentSubmission.status) {
      case 'pending':
        return {
          title: 'Processing Your Submission',
          description: 'We are analyzing your recordings. This may take a few moments.'
        };
      case 'awaiting_review':
        return {
          title: 'Awaiting Teacher Review',
          description: 'Your submission has been processed and is waiting for teacher review.'
        };
      default:
        return {
          title: 'Processing Your Submission',
          description: 'Please wait while we process your submission.'
        };
    }
  };

  const statusInfo = getStatusMessage();

  // Helper function to get audio URL from recording
  const getAudioUrl = (recording: any): string => {
    if (typeof recording === 'string') {
      return recording;
    }
    if (recording && typeof recording === 'object' && 'audioUrl' in recording) {
      return recording.audioUrl;
    }
    return '';
  };

  const handleRedoAssignment = async () => {
    if (!submission.student_id || !submission.assignment_id || isCreatingNewAttempt) {
      return;
    }

    setIsCreatingNewAttempt(true);

    try {
      await dispatch(createInProgressSubmission({ 
        userId: submission.student_id, 
        assignmentId: submission.assignment_id,
        sourceSubmissionId: submission.id
      })).unwrap();

      toast({
        title: "New Attempt Started",
        description: "You can now start recording your new submission",
      });

      // Navigate to assignment practice page
      navigate(`/student/assignment/${submission.assignment_id}/practice`);
    } catch (error) {
      console.error('Error creating new attempt:', error);
      toast({
        title: "Error",
        description: "Failed to create new attempt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingNewAttempt(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRedoAssignment}
            disabled={isCreatingNewAttempt}
          >
            <RefreshCw className={`h-4 w-4 ${isCreatingNewAttempt ? 'animate-spin' : ''}`} />
            {isCreatingNewAttempt ? 'Starting New Attempt...' : 'Redo Assignment'}
          </Button>
        </div>

        <Card className="shadow-sm border-0 bg-white p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {submission.assignment_title || 'Assignment Submission'}
          </h2>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Submitted on: {new Date(submission.submitted_at).toLocaleString()}
            </p>
          </div>

          {/* Status Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  {statusInfo.title}
                </h3>
                <p className="text-blue-700">
                  {statusInfo.description}
                </p>
                {error && (
                  <p className="text-sm text-red-600 mt-2">
                    {error}
                  </p>
                )}
              </div>
              {currentSubmission.status === 'pending' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
              )}
            </div>
          </div>

          {/* Analysis Status Section */}
          {currentSubmission.status === 'pending' && (
            <div className="mb-6">
              <AnalysisStatus submissionUrl={currentSubmission.id} />
            </div>
          )}

          {/* Recordings Section */}
          {currentSubmission.recordings && currentSubmission.recordings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recordings</h3>
              <div className="space-y-4">
                {currentSubmission.recordings.map((recording, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Question {index + 1}</h4>
                    <audio
                      controls
                      className="w-full"
                      src={getAudioUrl(recording)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PendingSubmission; 