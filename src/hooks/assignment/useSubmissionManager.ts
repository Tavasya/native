import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { submissionService } from '@/features/submissions/submissionsService';
import { Assignment } from '@/features/assignments/types';
import { useToast } from "@/hooks/use-toast";

interface UseSubmissionManagerProps {
  assignment: Assignment | null;
  assignmentId: string;
  userId: string | null;
  sessionRecordings: Record<string, { uploadedUrl: string }>;
  recordingsData: Record<string, { uploadedUrl: string }>;
}

export const useSubmissionManager = ({
  assignment,
  assignmentId,
  userId,
  sessionRecordings,
  recordingsData
}: UseSubmissionManagerProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFinalSubmit = useCallback(async () => {
    if (!assignment || !assignmentId || !userId || isSubmitting) {
      if (!userId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your assignment",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSubmitting(true);

    // Check if this is a practice assignment
    const isPracticeAssignment = assignment.metadata?.isPractice === true;

    if (isPracticeAssignment) {
      // Handle practice assignment with new practice_sessions workflow
      const { dismiss } = toast({
        title: "Processing practice session...",
        description: "Setting up your practice feedback session.",
      });

      try {
        // Get the first (and likely only) recording for practice
        const firstRecording = assignment.questions.map((_, index) => {
          const recordingData = recordingsData?.[index.toString()];
          const sessionRecording = sessionRecordings[index];
          return recordingData?.uploadedUrl || sessionRecording?.uploadedUrl;
        }).find(url => url);

        if (!firstRecording) {
          throw new Error('No recording found for practice session');
        }

        // Check if a practice session already exists for this audio URL to prevent duplicates
        const { data: existingSessions, error: searchError } = await supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('original_audio_url', firstRecording)
          .order('created_at', { ascending: false })
          .limit(1);

        let sessionId: string;

        if (!searchError && existingSessions && existingSessions.length > 0) {
          // Use existing session
          sessionId = existingSessions[0].id;
          console.log('Using existing practice session:', sessionId);
        } else {
          // Create practice session
          const { data: sessionData, error: createError } = await supabase
            .from('practice_sessions')
            .insert({
              user_id: userId,
              original_audio_url: firstRecording,
              status: 'transcript_ready'
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create practice session:', createError);
            throw new Error(`Database error: ${createError.message}`);
          }
          sessionId = sessionData.id;
          console.log('Created new practice session:', sessionId);
        }

        // Call backend API to improve transcript
        const response = await fetch(`https://classconnect-staging-107872842385.us-west2.run.app/api/v1/practice/sessions/${sessionId}/improve-transcript`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Backend request failed: ${response.status}`);
        }

        dismiss();
        toast({
          title: "Practice Session Started!",
          description: "Your practice session is being processed. You'll see results shortly.",
          duration: 3000,
        });

        // Navigate to practice feedback page to show transcript improvement
        navigate(`/student/practice-feedback?session=${sessionId}`);

      } catch (error) {
        console.error('Practice session creation error:', error);
        dismiss();
        toast({
          title: "Practice Session Failed",
          description: error instanceof Error ? error.message : 'Failed to start practice session. Please try again.',
          variant: "destructive",
          duration: 8000,
        });
      }
      setIsSubmitting(false);
      return;
    }

    // Regular assignment submission workflow
    const { dismiss } = toast({
      title: "Processing submission...",
      description: "Please wait while we analyze your recording.",
    });

    try {
      // Get existing submission
      const { data: existingSubmissions, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      // Prepare recordings
      const currentRecordings = assignment.questions.map((question, index) => {
        const recordingData = recordingsData?.[index.toString()];
        const sessionRecording = sessionRecordings[index];
        const recordingUrl = recordingData?.uploadedUrl || sessionRecording?.uploadedUrl;
        
        if (!recordingUrl) {
          throw new Error(`Missing recording for question ${index + 1}`);
        }

        return {
          questionId: question.id,
          audioUrl: recordingUrl
        };
      });

      const existingSubmission = existingSubmissions?.[0];
      let submissionId: string;

      if (existingSubmission?.status === 'in_progress') {
        // Update existing submission
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ 
            status: 'pending',
            recordings: currentRecordings,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);

        if (updateError) throw updateError;
        submissionId = existingSubmission.id;
      } else {
        // Create new submission
        const { data: newSubmission, error: createError } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: userId,
            status: 'pending',
            recordings: currentRecordings,
            submitted_at: new Date().toISOString(),
            attempt: (existingSubmission?.attempt || 0) + 1
          })
          .select()
          .single();

        if (createError) throw createError;
        submissionId = newSubmission.id;
      }

      // Navigate to submission page
      navigate(`/student/submission/${submissionId}/feedback`);

      // Analyze audio
      try {
        await submissionService.analyzeAudio(
          currentRecordings.map(r => r.audioUrl),
          submissionId
        );
        
        dismiss();
        toast({
          title: "Assignment Completed!",
          description: `You have completed "${assignment.title}" and analysis is complete.`,
          duration: 5000,
        });
      } catch (analysisError) {
        console.warn('Analysis error (submission still succeeded):', analysisError);
        dismiss();
        toast({
          title: "Assignment Submitted",
          description: `"${assignment.title}" was submitted but analysis may still be processing.`,
          duration: 5000,
        });
      }

    } catch (error) {
      dismiss();
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : 'Failed to submit assignment. Please try again.',
        variant: "destructive",
        duration: 8000,
      });
    }
    setIsSubmitting(false);
  }, [assignment, assignmentId, userId, isSubmitting, sessionRecordings, recordingsData, navigate, toast]);

  return {
    isSubmitting,
    handleFinalSubmit
  };
};