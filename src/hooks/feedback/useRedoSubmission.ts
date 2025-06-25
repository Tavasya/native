import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRedoSubmission = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createNewSubmission = async (assignmentId: string, studentId: string) => {
    setIsProcessing(true);
    
    try {
      // Get the highest attempt number for this assignment and student
      const { data: existingSubmissions, error: fetchError } = await supabase
        .from('submissions')
        .select('attempt')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('attempt', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Failed to fetch existing submissions: ${fetchError.message}`);
      }

      const nextAttempt = existingSubmissions && existingSubmissions.length > 0 
        ? existingSubmissions[0].attempt + 1 
        : 1;

      // Create new submission with 'in_progress' status
      const { data: newSubmission, error: createError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          status: 'in_progress',
          attempt: nextAttempt,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create new submission: ${createError.message}`);
      }

      return newSubmission;
    } catch (error) {
      console.error('Error creating new submission:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedo = async (assignmentId: string, studentId: string) => {
    try {
      const newSubmission = await createNewSubmission(assignmentId, studentId);
      
      toast({
        title: "New Attempt Started",
        description: "You can now re-record your assignment. Your previous attempts are still saved.",
      });

      // Navigate to assignment practice page
      navigate(`/student/assignment/${assignmentId}/practice`);
      
    } catch (error) {
      toast({
        title: "Failed to Start New Attempt",
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: "destructive",
      });
    }
  };

  return {
    isProcessing,
    handleRedo
  };
};