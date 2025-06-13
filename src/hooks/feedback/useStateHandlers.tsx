// hooks/useSubmissionHandlers.ts

import { useNavigate, useLocation } from 'react-router-dom';
import { updateSubmission } from '@/features/submissions/submissionThunks';
import { 
  setOperationLoading,
  stopEditing,
  commitTempChanges,
  setTempFeedback,
  discardTempChanges,
} from '@/features/submissions/submissionsSlice';
import { useToast } from "@/components/ui/use-toast";
import { EditingState, SectionFeedback, AverageScores } from '@/types/feedback';
import { Submission, QuestionFeedbackEntry } from '@/features/submissions/types';
import { UpdateSubmissionDto } from '@/features/submissions/types';
import { AppDispatch } from '@/app/store';

interface UseSubmissionHandlersProps {
  selectedSubmission: Submission | null;
  tempScores: AverageScores | null;
  tempFeedback: SectionFeedback | null;
  teacherComment: string;
  currentFeedback: SectionFeedback | null;
  selectedQuestionIndex: number;
  dispatch: AppDispatch;
}

export const useSubmissionHandlers = ({
  selectedSubmission,
  tempScores,
  tempFeedback,
  teacherComment,
  currentFeedback,
  selectedQuestionIndex,
  dispatch,
}: UseSubmissionHandlersProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleBack = () => {
    if (location.state?.fromClassDetail) {
      navigate(-1);
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleSubmitAndSend = async () => {
    if (!selectedSubmission?.id) {
      toast({
        title: "Error",
        description: "No submission found to update.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      // If we have temp scores that are different from the current scores, save them first
      if (tempScores && selectedSubmission.overall_assignment_score !== tempScores) {
        const updates: Omit<UpdateSubmissionDto, 'id'> = { 
          overall_assignment_score: tempScores,
          status: 'graded'
        };
        if (tempScores.overall_grade !== undefined && tempScores.overall_grade !== null) {
          updates.grade = tempScores.overall_grade;
        }

        const resultAction = await dispatch(updateSubmission({
          id: selectedSubmission.id,
          updates
        }));

        if (!updateSubmission.fulfilled.match(resultAction)) {
          throw new Error('Failed to update scores');
        }
      } else {
        // If no score changes, just update the status
        const resultAction = await dispatch(updateSubmission({
          id: selectedSubmission.id,
          updates: { status: 'graded' }
        }));

        if (!updateSubmission.fulfilled.match(resultAction)) {
          throw new Error('Update submission failed');
        }
      }

      toast({
        title: "Success!",
        description: `Feedback has been sent to ${selectedSubmission.student_name || 'student'}`,
        duration: 5000,
      });

      if (location.state?.fromClassDetail) {
        navigate(-1);
      } else {
        navigate('/teacher/classes');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ Enhanced with Redux operation tracking
  const handleSaveOverallScores = () => {
    if (!tempScores) {
      toast({
        title: "Error",
        description: "No scores found to update.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Just commit the changes to Redux state
    dispatch(commitTempChanges({ section: 'scores' }));
    dispatch(stopEditing('overall'));
    
    toast({
      title: "Success",
      description: "Scores updated in form. Click 'Submit and Send' to save changes.",
      duration: 3000,
    });
  };

  // ✅ Enhanced teacher comment handler
  const handleSaveTeacherComment = async () => {
    if (!selectedSubmission?.id || !tempFeedback) {
      toast({
        title: "Error",
        description: "No feedback data found to update.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    dispatch(setOperationLoading({ operation: 'savingComment', loading: true }));

    try {
      const updatedFeedback = { ...tempFeedback, feedback: teacherComment };
      
      // Create updated section feedback array
      const updatedSectionFeedback: QuestionFeedbackEntry[] = selectedSubmission.section_feedback
        ? [...selectedSubmission.section_feedback]
        : [];
      
      if (updatedSectionFeedback[selectedQuestionIndex]) {
        updatedSectionFeedback[selectedQuestionIndex] = {
          ...updatedSectionFeedback[selectedQuestionIndex],
          section_feedback: updatedFeedback
        };
      }

      const resultAction = await dispatch(updateSubmission({
        id: selectedSubmission.id,
        updates: { section_feedback: updatedSectionFeedback }
      }));

      if (updateSubmission.fulfilled.match(resultAction)) {
        // ✅ Update temp feedback and stop editing via Redux
        dispatch(setTempFeedback(updatedFeedback));
        dispatch(stopEditing('teacherComment'));
        
        toast({
          title: "Success",
          description: "Teacher comment updated successfully.",
          duration: 3000,
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating teacher comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      dispatch(setOperationLoading({ operation: 'savingComment', loading: false }));
    }
  };

  // ✅ Enhanced section feedback handler
  const handleSaveSectionFeedback = async (section: keyof EditingState) => {
    if (!selectedSubmission?.id || !tempFeedback) {
      toast({
        title: "Error",
        description: "No feedback data found to update.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    dispatch(setOperationLoading({ operation: 'savingFeedback', loading: true }));

    try {
      // Create updated section feedback array
      const updatedSectionFeedback: QuestionFeedbackEntry[] = selectedSubmission.section_feedback
        ? [...selectedSubmission.section_feedback]
        : [];
      
      if (updatedSectionFeedback[selectedQuestionIndex]) {
        updatedSectionFeedback[selectedQuestionIndex] = {
          ...updatedSectionFeedback[selectedQuestionIndex],
          section_feedback: tempFeedback
        };
      }

      const resultAction = await dispatch(updateSubmission({
        id: selectedSubmission.id,
        updates: { section_feedback: updatedSectionFeedback }
      }));

      if (updateSubmission.fulfilled.match(resultAction)) {
        // ✅ Stop editing via Redux
        dispatch(stopEditing(section));
        
        toast({
          title: "Success",
          description: `${section.charAt(0).toUpperCase() + section.slice(1)} feedback updated successfully.`,
          duration: 3000,
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error(`Error updating ${section} section:`, error);
      
      // ✅ Revert to current feedback via Redux
      if (currentFeedback) {
        dispatch(setTempFeedback(currentFeedback));
      }
      
      toast({
        title: "Error",
        description: `Failed to update ${section} feedback. Please try again.`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      dispatch(setOperationLoading({ operation: 'savingFeedback', loading: false }));
    }
  };

  // ✅ Enhanced issue deletion - now only updates Redux state, doesn't persist
  const handleDeleteIssue = (section: 'pronunciation' | 'grammar' | 'lexical', index: number) => {
    if (!tempFeedback) {
      toast({
        title: "Error",
        description: "No feedback data found to update.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      // Create a deep copy of the feedback
      const updatedFeedback = JSON.parse(JSON.stringify(tempFeedback)) as SectionFeedback;
      
      // Remove the specific issue based on section
      if (section === 'pronunciation' && updatedFeedback.pronunciation?.word_details) {
        const updatedWordDetails = updatedFeedback.pronunciation.word_details.filter((_, i) => i !== index);
        updatedFeedback.pronunciation = {
          ...updatedFeedback.pronunciation,
          word_details: updatedWordDetails
        };
      } else if (section === 'grammar' && updatedFeedback.grammar?.issues) {
        const updatedIssues = [...updatedFeedback.grammar.issues];
        updatedIssues.splice(index, 1);
        updatedFeedback.grammar = {
          ...updatedFeedback.grammar,
          issues: updatedIssues
        };
      } else if (section === 'lexical' && updatedFeedback.lexical?.issues) {
        const updatedIssues = [...updatedFeedback.lexical.issues];
        updatedIssues.splice(index, 1);
        updatedFeedback.lexical = {
          ...updatedFeedback.lexical,
          issues: updatedIssues
        };
      }

      // ✅ Update via Redux - this will mark as dirty automatically
      dispatch(setTempFeedback(updatedFeedback));
      
      console.log(`Successfully removed ${section} issue at index ${index}`);
    } catch (error) {
      console.error('Error updating temporary state:', error);
      toast({
        title: "Error",
        description: "Failed to remove issue. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ NEW: Save all pending changes
  const handleSaveAllChanges = async () => {
    const savePromises = [];
    
    // Save scores if dirty and editing
    if (tempScores && selectedSubmission?.overall_assignment_score !== tempScores) {
      savePromises.push(handleSaveOverallScores());
    }
    
    // Save feedback if dirty and editing
    if (tempFeedback && currentFeedback !== tempFeedback) {
      savePromises.push(handleSaveSectionFeedback('fluency')); // or determine which section
    }
    
    try {
      await Promise.all(savePromises);
      toast({
        title: "Success",
        description: "All changes saved successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Some changes failed to save. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ NEW: Cancel all changes
  const handleCancelAllChanges = () => {
    dispatch(discardTempChanges({ section: 'all' }));
    toast({
      title: "Changes Discarded",
      description: "All unsaved changes have been discarded.",
      duration: 3000,
    });
  };

  return {
    handleBack,
    handleSubmitAndSend,
    handleSaveOverallScores,
    handleSaveTeacherComment,
    handleSaveSectionFeedback,
    handleDeleteIssue,
    
    // ✅ NEW: Batch operations
    handleSaveAllChanges,
    handleCancelAllChanges,
  };
};