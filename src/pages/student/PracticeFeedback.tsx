import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  loadPracticeFeedbackFromSubmission, 
  clearPracticeFeedbackData, 
  setPracticeFeedbackData,
  selectPracticeFeedbackData,
  selectPracticeFeedbackError,
  createPracticeSessionFromFeedback,
  openPracticeSessionModal,
  selectPracticeSessionModal
} from '@/features/practice/practiceSlice';

const PracticeFeedback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  const feedbackData = useAppSelector(selectPracticeFeedbackData);
  const feedbackError = useAppSelector(selectPracticeFeedbackError);
  const { error: sessionError } = useAppSelector(selectPracticeSessionModal);
  const { sessionLoading: practiceSessionLoading } = useAppSelector(state => state.practice);

  useEffect(() => {
    // Clear any existing feedback data when component mounts
    dispatch(clearPracticeFeedbackData());
    
    // Try to get data from navigation state first (for backward compatibility)
    const stateData = location.state?.transcriptData;
    
    if (stateData) {
      // Set the feedback data directly from navigation state
      dispatch(setPracticeFeedbackData(stateData));
    } else {
      // Try to get data from URL params (new flow)
      const submissionId = searchParams.get('submissionId');
      const questionIndex = searchParams.get('questionIndex');
      
      if (submissionId && questionIndex !== null) {
        dispatch(loadPracticeFeedbackFromSubmission({
          submissionId,
          questionIndex: parseInt(questionIndex, 10)
        }));
      } else {
        // No data available
        dispatch(clearPracticeFeedbackData());
      }
    }
  }, [location.state, searchParams, dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearPracticeFeedbackData());
    };
  }, [dispatch]);

  const handleBack = () => {
    if (feedbackData?.submissionId) {
      navigate(`/student/submission/${feedbackData.submissionId}/feedback`);
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleStartPronunciationPractice = async () => {
    if (!feedbackData?.enhanced) {
      console.error('No enhanced transcript available for practice');
      return;
    }

    console.log('Starting pronunciation practice...');

    try {
      // Create practice session with enhanced transcript
      const action = await dispatch(createPracticeSessionFromFeedback({
        enhancedTranscript: feedbackData.enhanced
      }));

      if (createPracticeSessionFromFeedback.fulfilled.match(action)) {
        const session = action.payload;
        console.log('Session created successfully:', session.id);
        
        // Open the modal - PracticeSessionModal will handle starting the backend processing
        dispatch(openPracticeSessionModal(session.id));
        
      } else if (createPracticeSessionFromFeedback.rejected.match(action)) {
        console.error('Session creation failed:', action.error.message);
        throw new Error(action.error.message || 'Failed to create practice session');
      }
    } catch (error) {
      console.error('Failed to start pronunciation practice:', error);
      // The error should be handled by the Redux error state
    }
  };

  const renderContent = () => {
    if (feedbackError) {
      return (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Practice Data Not Available</h3>
          </div>
          <p className="text-gray-600 mb-6">{feedbackError}</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700" size="lg">
            Go Back
          </Button>
        </div>
      );
    }

    if (!feedbackData) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-4">Loading Practice Data...</h3>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Practice Transcripts</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Your Original Response</h4>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm whitespace-pre-wrap">
                {feedbackData.original}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-green-700">Enhanced Version</h4>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm whitespace-pre-wrap">
                {feedbackData.enhanced}
              </p>
            </div>
          </div>
        </div>

        {feedbackData.audioUrl && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Your Recording</h4>
            <audio controls className="w-full">
              <source src={feedbackData.audioUrl} type="audio/webm" />
              <source src={feedbackData.audioUrl} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-4">
            The enhanced version shows improved vocabulary, better grammar, and more sophisticated language patterns based on your original response.
          </p>
          
          <div className="flex justify-center">
            <Button
              onClick={handleStartPronunciationPractice}
              disabled={practiceSessionLoading || !feedbackData?.enhanced}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-medium"
              size="lg"
            >
              {practiceSessionLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Starting Practice...
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  Start Pronunciation Practice
                </>
              )}
            </Button>
          </div>
          
          {sessionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{sessionError}</p>
            </div>
          )}
          
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice Feedback</h1>
            <p className="text-gray-600">Compare your original response with the enhanced version</p>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default PracticeFeedback;