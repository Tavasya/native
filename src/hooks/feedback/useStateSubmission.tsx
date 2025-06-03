// hooks/useSubmissionState.ts

import { useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { 
  setTempScores,
  setTempFeedback,
  setTeacherComment,
  startEditing,
  stopEditing,
  setSelectedQuestionIndex,
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
  
  // TTS selectors
  const ttsAudioCache = useAppSelector(selectTTSAudio);
  const ttsLoading = useAppSelector(selectTTSLoading);

  // ✅ Memoized current question computation
  const currentQuestion = useMemo((): QuestionFeedback | null => {
    if (!selectedSubmission?.section_feedback || !Array.isArray(selectedSubmission.section_feedback)) {
      return null;
    }
    
    const sortedFeedback = [...selectedSubmission.section_feedback].sort((a, b) => 
      (a.question_id || 0) - (b.question_id || 0)
    );
    
    const question = sortedFeedback[ui.selectedQuestionIndex];
    if (!question) return null;

    // Get audio URL from recordings
    const audioUrl = Array.isArray(selectedSubmission.recordings) && selectedSubmission.recordings[ui.selectedQuestionIndex]
      ? (typeof selectedSubmission.recordings[ui.selectedQuestionIndex] === 'string' 
          ? selectedSubmission.recordings[ui.selectedQuestionIndex] 
          : (selectedSubmission.recordings[ui.selectedQuestionIndex] as any)?.audioUrl || '')
      : '';

    return {
      question_id: question.question_id,
      audio_url: audioUrl,
      transcript: question.transcript || '',
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
  const canEdit = isAwaitingReview && role === 'teacher';

  // ✅ Simple effect - just fetch data when needed
  useEffect(() => {
    if (submissionId) {
      console.log('Fetching submission:', submissionId);
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  // ✅ Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up TTS audio resources');
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
    setActiveTab: (tab: string) => dispatch(setActiveTab(tab)),
    setOpenPopover: (popover: string | null) => dispatch(setOpenPopover(popover)),
    togglePopover: (popover: string) => dispatch(togglePopover(popover)),
    setGrammarOpen: (state: Record<string, boolean>) => dispatch(setGrammarOpen(state)),
    setVocabularyOpen: (state: Record<string, boolean>) => dispatch(setVocabularyOpen(state)),
  }), [dispatch]);

  return {
    // ✅ Data from Redux
    selectedSubmission,
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