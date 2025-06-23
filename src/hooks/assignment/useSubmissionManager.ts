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

    const { dismiss } = toast({
      title: "Processing submission...",
      description: "Please wait while we analyze your recording.",
    });

    try {
      // Get existing submission (order by attempt to get the latest attempt, not submitted_at)
      const { data: existingSubmissions, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
        .order('attempt', { ascending: false })
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

      console.log('📊 Submission Manager Debug:', {
        existingSubmissions: existingSubmissions?.map(s => ({
          id: s.id,
          attempt: s.attempt,
          status: s.status,
          submitted_at: s.submitted_at
        })),
        latestSubmission: existingSubmission ? {
          id: existingSubmission.id,
          attempt: existingSubmission.attempt,
          status: existingSubmission.status,
          submitted_at: existingSubmission.submitted_at
        } : null
      });

      if (existingSubmission?.status === 'in_progress') {
        // Update existing in-progress submission
        console.log('🔄 Updating in-progress submission:', {
          id: existingSubmission.id,
          attempt: existingSubmission.attempt,
          recordingsCount: currentRecordings.length
        });
        
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