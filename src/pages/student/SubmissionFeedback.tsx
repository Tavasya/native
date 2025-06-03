import { useRef } from "react";
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";

// Import our new components
import FeedbackHeader from '@/components/student/feedback/FeedbackHeader';
import SubmissionInfo from '@/components/student/feedback/SubmissionInfo';
import QuestionContent from '@/components/student/feedback/QuestionContext';
import TabsContainer from '@/components/student/feedback/TabsContainer';
import PendingSubmission from '@/components/student/PendingSubmission';

// Import custom hooks
import { useSubmissionState } from '@/hooks/feedback/useStateSubmission';
import { useSubmissionHandlers } from '@/hooks/feedback/useStateHandlers';

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
    setActiveTab,
    setOpenPopover,
    setGrammarOpen,
    setVocabularyOpen,
    discardChanges,
    selectedSubmission,
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

  // Toggle functions for collapsibles
  const toggleGrammarOpen = (key: string) => {
    setGrammarOpen({ ...grammarOpen, [key]: !grammarOpen[key] });
  };

  const toggleVocabularyOpen = (key: string) => {
    setVocabularyOpen({ ...vocabularyOpen, [key]: !vocabularyOpen[key] });
  };

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

  // Show pending submission for students
  if (['pending', 'awaiting_review'].includes(selectedSubmission?.status || '') && role === 'student') {
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
        />

        <QuestionContent
          questions={selectedSubmission?.section_feedback || []}
          selectedQuestionIndex={selectedQuestionIndex}
          onSelectQuestion={setSelectedQuestionIndex}
          audioRef={audioRef}
          audioUrl={currentQuestion?.audio_url || ''}
          transcript={currentQuestion?.transcript || ''}
          currentFeedback={currentFeedback || null}
          highlightType={activeTab === 'grammar' ? 'grammar' : activeTab === 'vocabulary' ? 'vocabulary' : 'none'}
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
        />

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-4">
            <TabsContainer
              activeTab={activeTab}
              onTabChange={setActiveTab}
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