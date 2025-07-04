import { useRef, useCallback, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import posthog from 'posthog-js';

// Import our new components
import FeedbackHeader from '@/components/student/feedback/FeedbackHeader';
import SubmissionInfo from '@/components/student/feedback/SubmissionInfo';
import QuestionContent from '@/components/student/feedback/QuestionContext';
import TabsContainer from '@/components/student/feedback/TabsContainer';
import PendingSubmission from '@/components/student/PendingSubmission';

// Import custom hooks
import { useSubmissionState } from '@/hooks/feedback/useStateSubmission';
import { useSubmissionHandlers } from '@/hooks/feedback/useStateHandlers';
import { useRedoSubmission } from '@/hooks/feedback/useRedoSubmission';

const SubmissionFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get all state from custom hook
  const {
    tempScores,
    tempFeedback,
    teacherComment,
    isEditing,
    selectedQuestionIndex,
    openPopover,
    activeTab,
    grammarOpen,
    vocabularyOpen,
    // Actions
    setTempScores,
    setTempFeedback,
    setTeacherComment,
    startEditing,
    stopEditing,
    setSelectedQuestionIndex,
    syncFeedbackForCurrentQuestion,
    setActiveTab,
    setOpenPopover,
    setGrammarOpen,
    setVocabularyOpen,
    discardChanges,
    selectedSubmission,
    currentAssignment,
    loading,
    error,
    ttsAudioCache,
    ttsLoading,
    currentQuestion,
    currentFeedback,
    isAwaitingReview,
    canEdit,
    role,
    dispatch,
  } = useSubmissionState(submissionId);

  // Get all handlers from custom hook
  const {
    handleBack,
    handleSubmitAndSend,
    handleSaveOverallScores,
    handleSaveTeacherComment,
    handleSaveSectionFeedback,
    handleDeleteIssue,
  } = useSubmissionHandlers({
    selectedSubmission: selectedSubmission || null,
    tempScores,
    tempFeedback,
    teacherComment,
    currentFeedback: currentFeedback || null,
    selectedQuestionIndex,
    dispatch,
  });

  // Redo submission hook
  const { isProcessing: isRedoProcessing, handleRedo } = useRedoSubmission();

  const onRedo = () => {
    if (!selectedSubmission?.assignment_id || !selectedSubmission?.student_id) {
      console.error('Missing assignment or student ID for redo');
      return;
    }
    if (!isRedoProcessing) {
      handleRedo(selectedSubmission.assignment_id, selectedSubmission.student_id);
    }
  };

  // PostHog tracking for report page visits
  useEffect(() => {
    if (selectedSubmission && currentAssignment && posthog.__loaded) {
      try {
        // Track report page visit
        posthog.capture('report_page_viewed', {
          submission_id: submissionId,
          assignment_id: selectedSubmission.assignment_id,
          assignment_title: currentAssignment.title,
          student_role: role,
          submission_status: selectedSubmission.status,
          has_feedback: selectedSubmission.overall_assignment_score !== null,
          question_count: currentAssignment.questions?.length || 0,
          visit_timestamp: new Date().toISOString(),
          is_return_visit: localStorage.getItem(`visited_${submissionId}`) ? true : false
        });

        // Mark this submission as visited for return visit tracking
        localStorage.setItem(`visited_${submissionId}`, 'true');

        // Track time spent on page
        const startTime = Date.now();
        return () => {
          const timeSpent = Date.now() - startTime;
          if (posthog.__loaded) {
            try {
              posthog.capture('report_page_time_spent', {
                submission_id: submissionId,
                time_spent_ms: timeSpent,
                time_spent_seconds: Math.round(timeSpent / 1000),
                exit_timestamp: new Date().toISOString()
              });
            } catch (error) {
              // Silently fail
            }
          }
        };
      } catch (error) {
        // Silently fail if PostHog has issues
      }
    }
  }, [selectedSubmission, currentAssignment, submissionId, role]);

  // Enhanced tab change handler with PostHog tracking
  const handleTabChange = useCallback((tabValue: string) => {
    setActiveTab(tabValue);
    
    // Track tab switching
    if (posthog.__loaded) {
      try {
        posthog.capture('report_tab_switched', {
          submission_id: submissionId,
          from_tab: activeTab,
          to_tab: tabValue,
          user_role: role,
          question_index: selectedQuestionIndex,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, [setActiveTab, submissionId, activeTab, role, selectedQuestionIndex]);

  // Toggle functions for collapsibles
  const toggleGrammarOpen = (key: string) => {
    setGrammarOpen({ ...grammarOpen, [key]: !grammarOpen[key] });
    
    // Track grammar section toggle
    if (posthog.__loaded) {
      try {
        posthog.capture('report_grammar_section_toggled', {
          submission_id: submissionId,
          section_key: key,
          is_opening: !grammarOpen[key],
          user_role: role,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail
      }
    }
  };

  const toggleVocabularyOpen = (key: string) => {
    setVocabularyOpen({ ...vocabularyOpen, [key]: !vocabularyOpen[key] });
    
    // Track vocabulary section toggle
    if (posthog.__loaded) {
      try {
        posthog.capture('report_vocabulary_section_toggled', {
          submission_id: submissionId,
          section_key: key,
          is_opening: !vocabularyOpen[key],
          user_role: role,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail
      }
    }
  };

  // Handle question navigation - only sync feedback when needed for feedback viewing
  const handleQuestionSelect = useCallback((index: number) => {
    setSelectedQuestionIndex(index);
    // Only sync feedback if we're viewing feedback content (not just navigating)
    if (canEdit || role === 'teacher') {
      syncFeedbackForCurrentQuestion();
    }
    
    // Track question navigation
    if (posthog.__loaded) {
      try {
        posthog.capture('report_question_selected', {
          submission_id: submissionId,
          question_index: index,
          question_number: index + 1,
          total_questions: currentAssignment?.questions?.length || 0,
          user_role: role,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, [setSelectedQuestionIndex, syncFeedbackForCurrentQuestion, canEdit, role, submissionId, currentAssignment]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-lg text-gray-600">Loading submission...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Submission</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No submission found
  if (!selectedSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Submission Not Found</h2>
            <p className="text-yellow-600">The requested submission could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show pending submission for students, and for teachers only when no feedback is available yet
  if (['pending', 'awaiting_review'].includes(selectedSubmission?.status || '') && 
      (role === 'student' || !currentQuestion)) {
    return (
      <PendingSubmission 
        submission={selectedSubmission}
        onBack={handleBack}
      />
    );
  }

  // Waiting for report
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <FeedbackHeader
            assignmentTitle={selectedSubmission.assignment_title || 'Assignment'}
            submittedAt={selectedSubmission.submitted_at || ''}
            studentName={selectedSubmission.student_name || 'Student'}
            isAwaitingReview={isAwaitingReview}
            onBack={handleBack}
            onSubmitAndSend={handleSubmitAndSend}
            submissionId={submissionId}
            assignmentId={selectedSubmission.assignment_id}
            studentId={selectedSubmission.student_id}
            currentSubmission={selectedSubmission}
            isStudent={role === 'student'}
            onRedo={onRedo}
            attempt={selectedSubmission.attempt}
          />
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Waiting for Report</h2>
            <p className="text-blue-600">Your submission is being processed. This may take a few moments.</p>
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <FeedbackHeader
          assignmentTitle={selectedSubmission.assignment_title || 'Assignment'}
          submittedAt={selectedSubmission.submitted_at || ''}
          studentName={selectedSubmission.student_name || 'Student'}
          isAwaitingReview={isAwaitingReview}
          onBack={handleBack}
          onSubmitAndSend={handleSubmitAndSend}
          submissionId={submissionId}
          assignmentId={selectedSubmission.assignment_id}
          studentId={selectedSubmission.student_id}
          currentSubmission={selectedSubmission}
          isStudent={role === 'student'}
          onRedo={onRedo}
          attempt={selectedSubmission.attempt}
        />

        <SubmissionInfo
          assignmentTitle={selectedSubmission.assignment_title || 'Assignment'}
          studentName={selectedSubmission.student_name || 'Student'}
          submittedAt={selectedSubmission.submitted_at || ''}
          averageScores={selectedSubmission?.overall_assignment_score || { avg_fluency_score: 0, avg_grammar_score: 0, avg_lexical_score: 0, avg_pronunciation_score: 0 }}
          tempScores={tempScores || { avg_fluency_score: 0, avg_grammar_score: 0, avg_lexical_score: 0, avg_pronunciation_score: 0 }}
          isEditingOverall={isEditing.overall}
          canEdit={canEdit}
          onEditOverall={() => startEditing('overall')}
          onSaveOverall={handleSaveOverallScores}
          onCancelOverall={() => {
            discardChanges('scores');
            stopEditing('overall');
          }}
          onScoreChange={(field, value) => setTempScores({ ...tempScores!, [field]: value })}
          teacherComment={teacherComment}
          isEditingComment={isEditing.teacherComment}
          onEditComment={() => startEditing('teacherComment')}
          onSaveComment={handleSaveTeacherComment}
          onCancelComment={() => {
            discardChanges('comment');
            stopEditing('teacherComment');
          }}
          onCommentChange={setTeacherComment}
          isAutoGradeEnabled={currentAssignment?.metadata?.autoGrade ?? true}
          isTest={currentAssignment?.metadata?.isTest ?? false}
          grade={selectedSubmission?.grade}
        />

        <QuestionContent
          questions={selectedSubmission?.section_feedback || []}
          selectedQuestionIndex={selectedQuestionIndex}
          onSelectQuestion={handleQuestionSelect}
          audioRef={audioRef}
          audioUrl={currentQuestion?.audio_url || ''}
          transcript={currentQuestion?.transcript || ''}
          cleanTranscript={currentQuestion?.clean_transcript}
          currentFeedback={currentFeedback || null}
          highlightType={activeTab === 'grammar' ? 'grammar' : activeTab === 'vocabulary' ? 'vocabulary' : 'none'}
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
          assignment={currentAssignment}
        />

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-4">
            <TabsContainer
              activeTab={activeTab}
              onTabChange={handleTabChange}
              canEdit={canEdit}
              isEditing={isEditing}
              onEditSection={(section) => startEditing(section)}
              onSaveSection={handleSaveSectionFeedback}
              onCancelSection={(section) => {
                if (currentFeedback) setTempFeedback(currentFeedback);
                stopEditing(section);
              }}
              currentFeedback={currentFeedback || null}
              tempFeedback={tempFeedback}
              currentQuestion={currentQuestion}
              averageScores={selectedSubmission?.overall_assignment_score || { avg_fluency_score: 0, avg_grammar_score: 0, avg_lexical_score: 0, avg_pronunciation_score: 0 }}
              audioRef={audioRef}
              ttsAudioCache={ttsAudioCache}
              ttsLoading={ttsLoading}
              dispatch={dispatch}
              grammarOpen={grammarOpen}
              vocabularyOpen={vocabularyOpen}
              onToggleGrammar={toggleGrammarOpen}
              onToggleVocabulary={toggleVocabularyOpen}
              onDeleteIssue={handleDeleteIssue}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionFeedback;