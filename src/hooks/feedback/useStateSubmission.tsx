// hooks/useSubmissionState.ts

import { useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { 
  setTempScores,
  setTempFeedback,
  setTeacherComment,
  startEditing,
  stopEditing,
  setSelectedQuestionIndex,
  syncFeedbackForCurrentQuestion,
  setActiveTab,
  setOpenPopover,
  togglePopover,
  setGrammarOpen,
  setVocabularyOpen,
  discardTempChanges,
  commitTempChanges,
} from '@/features/submissions/submissionsSlice';
import { clearTTSAudio, selectTTSAudio, selectTTSLoading } from '@/features/tts/ttsSlice';
import { RootState } from '@/app/store';
import { QuestionFeedback, AverageScores, SectionFeedback, EditingState } from '@/types/feedback';

export const useSubmissionState = (submissionId: string | undefined) => {
  const dispatch = useAppDispatch();
  
  // ✅ All state comes from Redux now - no local state needed!
  const {
    selectedSubmission,
    loading,
    error,
    operations,
    editing,
    ui,
  } = useAppSelector((state: RootState) => state.submissions);

  const { role } = useAppSelector((state: RootState) => state.auth);
  
  // Assignment state
  const { assignments } = useAppSelector((state: RootState) => state.assignments);
  
  // TTS selectors
  const ttsAudioCache = useAppSelector(selectTTSAudio);
  const ttsLoading = useAppSelector(selectTTSLoading);

  // ✅ Memoized current question computation
  const currentQuestion = useMemo((): QuestionFeedback | null => {
    if (!selectedSubmission) {
      return null;
    }

    // If section_feedback is not yet loaded, return null
    if (!selectedSubmission.section_feedback) {
      console.log('Section feedback not yet loaded');
      return null;
    }

    // Log version information
    console.log('Submission version info:', {
      report_version: selectedSubmission.report_version,
      section_feedback_length: selectedSubmission.section_feedback.length
    });

    // Ensure section_feedback is an array
    const sectionFeedback = Array.isArray(selectedSubmission.section_feedback) 
      ? selectedSubmission.section_feedback 
      : [];

    // Sort feedback by question_id
    const sortedFeedback = [...sectionFeedback].sort((a, b) => 
      (a.question_id || 0) - (b.question_id || 0)
    );
    
    const question = sortedFeedback[ui.selectedQuestionIndex];
    if (!question) {
      console.log('No question found at index:', ui.selectedQuestionIndex);
      return null;
    }

    console.log('Current question:', {
      question_id: question.question_id,
      recordings: selectedSubmission.recordings,
      selectedIndex: ui.selectedQuestionIndex
    });

    // Get audio URL from section feedback
    let audioUrl = '';
    if (Array.isArray(selectedSubmission.section_feedback)) {
      // Log the full structure of the data
      console.log('Raw submission data:', {
        submission_id: selectedSubmission.id,
        recordings: selectedSubmission.recordings,
        section_feedback: selectedSubmission.section_feedback,
        report_version: selectedSubmission.report_version
      });

      // Find the current question's feedback
      const currentFeedback = selectedSubmission.section_feedback.find(
        feedback => feedback.question_id === question.question_id
      );

      console.log('Question matching:', {
        currentQuestionId: question.question_id,
        foundFeedback: currentFeedback ? {
          question_id: currentFeedback.question_id,
          audio_url: currentFeedback.audio_url
        } : null
      });

      // Use the audio_url from the section feedback
      audioUrl = currentFeedback?.audio_url || '';
      
      console.log('Found recording:', {
        question_id: question.question_id,
        audioUrl
      });
    }

    console.log('Final audio URL:', audioUrl);

    return {
      question_id: question.question_id,
      audio_url: audioUrl,
      transcript: question.transcript || '',
      clean_transcript: question.clean_transcript || '',
      section_feedback: question.section_feedback,
      duration_feedback: question.duration_feedback
    };
  }, [selectedSubmission, ui.selectedQuestionIndex]);

  // ✅ Current feedback is just derived from current question
  const currentFeedback = useMemo((): SectionFeedback | null => {
    return currentQuestion?.section_feedback || null;
  }, [currentQuestion]);

  // ✅ Computed values
  const isGraded = selectedSubmission?.status === 'graded';
  const isAwaitingReview = selectedSubmission?.status === 'awaiting_review';
  const canEdit = role === 'teacher';
  
  // Get current assignment
  const currentAssignment = useMemo(() => {
    if (!selectedSubmission?.assignment_id) return null;
    return assignments.find(a => a.id === selectedSubmission.assignment_id) || null;
  }, [selectedSubmission?.assignment_id, assignments]);

  // ✅ Simple effect - just fetch data when needed
  useEffect(() => {
    if (submissionId) {
      console.log('Fetching submission:', submissionId);
      // Clear TTS audio cache when switching submissions to prevent stale audio from previous recordings
      dispatch(clearTTSAudio());
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  // Fetch assignment data when submission is loaded
  useEffect(() => {
    if (selectedSubmission?.assignment_id) {
      const assignmentExists = assignments.find(a => a.id === selectedSubmission.assignment_id);
      if (!assignmentExists) {
        console.log('Fetching assignment:', selectedSubmission.assignment_id);
        dispatch(fetchAssignmentById(selectedSubmission.assignment_id));
      }
    }
  }, [selectedSubmission?.assignment_id, assignments, dispatch]);

  // ✅ Cleanup TTS on unmount only (don't clear on tab switching)
  useEffect(() => {
    return () => {
      console.log('Cleaning up TTS audio resources on component unmount');
      dispatch(clearTTSAudio());
    };
  }, [dispatch]);

  // ✅ Simple action dispatchers (no complex logic here)
  const actions = useMemo(() => ({
    // Form state actions
    setTempScores: (scores: AverageScores) => dispatch(setTempScores(scores)),
    setTempFeedback: (feedback: SectionFeedback | null) => dispatch(setTempFeedback(feedback)),
    setTeacherComment: (comment: string) => dispatch(setTeacherComment(comment)),
    
    // Editing actions
    startEditing: (section: keyof EditingState, preserveData?: boolean) => 
      dispatch(startEditing({ section, preserveData })),
    stopEditing: (section: keyof EditingState) => dispatch(stopEditing(section)),
    discardChanges: (section: 'scores' | 'feedback' | 'comment' | 'all') => 
      dispatch(discardTempChanges({ section })),
    commitChanges: (section: 'scores' | 'feedback' | 'comment') => 
      dispatch(commitTempChanges({ section })),
    
    // UI actions
    setSelectedQuestionIndex: (index: number) => dispatch(setSelectedQuestionIndex(index)),
    syncFeedbackForCurrentQuestion: () => dispatch(syncFeedbackForCurrentQuestion()),
    setActiveTab: (tab: string) => dispatch(setActiveTab(tab)),
    setOpenPopover: (popover: string | null) => dispatch(setOpenPopover(popover)),
    togglePopover: (popover: string) => dispatch(togglePopover(popover)),
    setGrammarOpen: (state: Record<string, boolean>) => dispatch(setGrammarOpen(state)),
    setVocabularyOpen: (state: Record<string, boolean>) => dispatch(setVocabularyOpen(state)),
  }), [dispatch]);

  return {
    // ✅ Data from Redux
    selectedSubmission,
    currentAssignment,
    loading,
    error,
    currentQuestion,
    currentFeedback,
    
    // ✅ Form state from Redux
    tempScores: editing.tempScores,
    tempFeedback: editing.tempFeedback,
    teacherComment: editing.teacherComment,
    isEditing: editing.isEditing,
    isDirty: editing.isDirty,
    
    // ✅ UI state from Redux
    selectedQuestionIndex: ui.selectedQuestionIndex,
    activeTab: ui.activeTab,
    openPopover: Object.keys(ui.openPopovers).find(key => ui.openPopovers[key]) || null,
    grammarOpen: ui.grammarOpen,
    vocabularyOpen: ui.vocabularyOpen,
    
    // ✅ Operation states
    operations: {
      updating: operations.updating,
      savingScores: editing.operations.savingScores,
      savingFeedback: editing.operations.savingFeedback,
      savingComment: editing.operations.savingComment,
    },
    
    // ✅ Computed values
    isGraded,
    isAwaitingReview,
    canEdit,
    role,
    
    // ✅ TTS state
    ttsAudioCache,
    ttsLoading,
    
    // ✅ Actions (simple dispatchers)
    ...actions,
    
    // ✅ Direct dispatch for complex operations
    dispatch,
  };
};