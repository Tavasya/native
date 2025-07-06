import { supabase } from '@/integrations/supabase/client';

interface MarkAssignmentCompleteRequest {
  userId: string;
  assignmentId: string;
  assignmentType: 'conversation' | 'pronunciation';
  scenarioName?: string;
}

interface MarkAssignmentCompleteResponse {
  success: boolean;
  error?: string;
}

export const completionService = {
  async markAssignmentComplete(request: MarkAssignmentCompleteRequest): Promise<MarkAssignmentCompleteResponse> {
    try {
      console.log(`📝 Marking assignment complete:`, {
        assignmentId: request.assignmentId,
        type: request.assignmentType,
        user: request.userId
      });

      // First, find the curriculum assignment for this user and assignment
      const { data: curriculum, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('id')
        .eq('user_id', request.userId)
        .single();

      if (curriculumError || !curriculum) {
        return {
          success: false,
          error: 'No curriculum found for user'
        };
      }

      // Update the curriculum assignment completion status
      const { error: updateError } = await supabase
        .from('curriculum_assignments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('curriculum_id', curriculum.id)
        .eq('assignment_id', request.assignmentId);

      if (updateError) {
        console.error('Error updating assignment completion:', updateError);
        return {
          success: false,
          error: `Failed to mark assignment complete: ${updateError.message}`
        };
      }

      console.log(`✅ Assignment marked complete: ${request.scenarioName || request.assignmentId}`);
      
      // Also save to localStorage for backward compatibility
      const completedAssignments = JSON.parse(localStorage.getItem('completedAssignments') || '[]');
      const newCompletion = {
        scenarioId: request.assignmentId,
        scenarioName: request.scenarioName,
        completedAt: new Date().toISOString(),
        type: request.assignmentType
      };
      
      // Avoid duplicates
      if (!completedAssignments.find((c: any) => c.scenarioId === request.assignmentId)) {
        completedAssignments.push(newCompletion);
        localStorage.setItem('completedAssignments', JSON.stringify(completedAssignments));
      }

      return { success: true };
      
    } catch (error) {
      console.error('Error in markAssignmentComplete:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async getCompletedAssignments(userId: string): Promise<string[]> {
    try {
      const { data: curriculum, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (curriculumError || !curriculum) {
        return [];
      }

      const { data: completedAssignments, error: assignmentsError } = await supabase
        .from('curriculum_assignments')
        .select('assignment_id')
        .eq('curriculum_id', curriculum.id)
        .eq('is_completed', true);

      if (assignmentsError) {
        console.error('Error fetching completed assignments:', assignmentsError);
        return [];
      }

      return completedAssignments.map(ca => ca.assignment_id);
    } catch (error) {
      console.error('Error getting completed assignments:', error);
      return [];
    }
  }
};