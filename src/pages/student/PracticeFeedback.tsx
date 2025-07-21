import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, Lightbulb, Play } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  loadPracticeFeedbackFromSubmission, 
  clearPracticeFeedbackData, 
  setPracticeFeedbackData,
  selectPracticeFeedbackData,
  selectPracticeFeedbackError,
  createPracticeSessionFromFeedback,
  openPracticeSessionModal,
  selectPracticeSessionModal,
  selectIsTranscriptCompleted,
  selectIsPracticePart2Completed,
  addHighlight,
  removeHighlight,
  setHighlights,
  loadPracticeSessionHighlights,
  openPracticePart2Modal,
  setAssignmentContext
} from '@/features/practice/practiceSlice';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { Assignment } from '@/features/assignments/types';
import { supabase } from '@/integrations/supabase/client';

const PracticeFeedback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  // Local state for assignment data and question index
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  // Removed showOriginalTranscript state (now always side-by-side)
  
  const feedbackData = useAppSelector(selectPracticeFeedbackData);
  const feedbackError = useAppSelector(selectPracticeFeedbackError);
  const { error: sessionError } = useAppSelector(selectPracticeSessionModal);
  const { sessionLoading: practiceSessionLoading, highlights } = useAppSelector(state => state.practice);
  const isTranscriptCompleted = useAppSelector(selectIsTranscriptCompleted);
  const isPart2Completed = useAppSelector(selectIsPracticePart2Completed);

  // Debug logging
  console.log('🔍 PracticeFeedback Debug:', {
    feedbackData,
    submissionId: feedbackData?.submissionId,
    isTranscriptCompleted,
    completedSessionId: feedbackData?.completedSessionId,
    hasAssignment: !!assignment,
    loadingAssignment,
    originalQuestion: assignment?.questions[questionIndex]?.question
  });

  useEffect(() => {
    // Clear any existing feedback data when component mounts
    dispatch(clearPracticeFeedbackData());
    
    // Try to get data from navigation state first (for backward compatibility)
    const stateData = location.state?.transcriptData;
    
    if (stateData) {
      // Set the feedback data from navigation state
      dispatch(setPracticeFeedbackData({
        original: stateData.original,
        enhanced: stateData.enhanced,
        audioUrl: stateData.audioUrl,
        submissionId: stateData.submissionId
      }));
      
      // Set the question index if it exists in the state data
      if (stateData.questionIndex !== undefined) {
        setQuestionIndex(stateData.questionIndex);
      }
      
      // 🔧 FIX: Always call createPracticeSessionFromFeedback to check DB for completion status
      if (stateData.enhanced && stateData.submissionId) {
        dispatch(createPracticeSessionFromFeedback({
          enhancedTranscript: stateData.enhanced,
          submissionId: stateData.submissionId,
          questionIndex: stateData.questionIndex
        }));
      }
    } else {
      // Try to get data from URL params (new flow)
      const submissionId = searchParams.get('submissionId');
      const questionIndexParam = searchParams.get('questionIndex');
      
      if (submissionId && questionIndexParam !== null) {
        const parsedQuestionIndex = parseInt(questionIndexParam, 10);
        setQuestionIndex(parsedQuestionIndex);
        
        // Load feedback data and then check for existing practice sessions
        dispatch(loadPracticeFeedbackFromSubmission({
          submissionId,
          questionIndex: parsedQuestionIndex
        })).unwrap().then((feedbackResult) => {
          // Also check for existing practice sessions to get completion status
          dispatch(createPracticeSessionFromFeedback({
            enhancedTranscript: feedbackResult.enhanced,
            submissionId: feedbackResult.submissionId,
            questionIndex: parsedQuestionIndex
          }));
        }).catch((error) => {
          console.error('Error loading practice feedback:', error);
        });
      } else {
        // No data available
        dispatch(clearPracticeFeedbackData());
      }
    }
  }, [location.state, searchParams, dispatch]);

  // Load assignment data when feedback data is available
  useEffect(() => {
    const loadAssignmentData = async () => {
      console.log('🔍 Assignment Loading Check:', {
        hasSubmissionId: !!feedbackData?.submissionId,
        submissionId: feedbackData?.submissionId,
        hasAssignment: !!assignment,
        loadingAssignment,
        shouldLoad: !!(feedbackData?.submissionId && !assignment && !loadingAssignment)
      });
      
      if (feedbackData?.submissionId && !assignment && !loadingAssignment) {
        console.log('🔍 Starting assignment load for submissionId:', feedbackData.submissionId);
        setLoadingAssignment(true);
        
        try {
          // Get submission data to find assignment_id
          const { data: submission, error } = await supabase
            .from('submissions')
            .select('assignment_id')
            .eq('id', feedbackData.submissionId)
            .single();
          
          console.log('🔍 Submission query result:', { submission, error });
          
          if (error) {
            console.error('Error loading submission:', error);
            return;
          }
          
          // Fetch assignment data
          console.log('🔍 Fetching assignment with ID:', submission.assignment_id);
          const result = await dispatch(fetchAssignmentById(submission.assignment_id)).unwrap();
          console.log('🔍 Assignment loaded:', result);
          setAssignment(result);
          
        } catch (error) {
          console.error('Error loading assignment:', error);
        } finally {
          setLoadingAssignment(false);
        }
      }
    };
    
    loadAssignmentData();
  }, [feedbackData?.submissionId, assignment, loadingAssignment, dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearPracticeFeedbackData());
      dispatch(setHighlights([])); // Clear highlights when leaving page
    };
  }, [dispatch]);

  // Load highlights for completed sessions or clear for new practice
  useEffect(() => {
    if (feedbackData && isTranscriptCompleted && feedbackData.completedSessionId) {
      // Load existing highlights from completed session
      dispatch(loadPracticeSessionHighlights(feedbackData.completedSessionId));
    } else if (feedbackData && !isTranscriptCompleted) {
      // Reset highlights for new practice
      dispatch(setHighlights([]));
    }
  }, [feedbackData, isTranscriptCompleted, dispatch]);

  const handleBack = () => {
    if (feedbackData?.submissionId) {
      navigate(`/student/submission/${feedbackData.submissionId}/feedback`);
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleWordClick = (word: string, position: number) => {
    const existingHighlight = highlights.find(h => h.position === position);
    if (existingHighlight) {
      dispatch(removeHighlight(position));
    } else {
      dispatch(addHighlight({ word, position }));
    }
  };

  const handleWordDoubleClick = (word: string, event: React.MouseEvent) => {
    // Prevent the single-click handler from firing
    event.preventDefault();
    event.stopPropagation();
    
    // Let the browser's default double-click behavior work for dictionary extensions
    // This allows extensions like "Dictionary" or "Google Dictionary" to work
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(event.currentTarget);
      selection.addRange(range);
    }
  };

  const renderClickableTranscript = (text: string) => {
    if (!text) return null;
    
    // First, get all words with their exact positions for consistent calculation
    const allSegments = text.split(/(\s+)/); // Split on whitespace but keep separators
    const wordSegments = allSegments.map((segment, segmentIndex) => {
      if (segment.match(/^\s+$/)) {
        return { type: 'whitespace', segment, segmentIndex };
      } else {
        return { type: 'word', segment, segmentIndex };
      }
    });
    
    // Calculate word positions only for actual words
    let wordPosition = 0;
    const wordsWithPositions = wordSegments.map((item) => {
      if (item.type === 'word') {
        return { ...item, wordPosition: wordPosition++ };
      }
      return item;
    });
    
    return (
      <p className="text-lg leading-relaxed whitespace-pre-wrap">
        {wordsWithPositions.map((item) => {
          if (item.type === 'whitespace') {
            // This is whitespace, return as-is
            return <span key={item.segmentIndex}>{item.segment}</span>;
          } else {
            // This is a word
            const currentPosition = 'wordPosition' in item ? item.wordPosition : 0;
            const isHighlighted = highlights.some(h => h.position === currentPosition);
            
                          return (
                <span
                  key={item.segmentIndex}
                  onClick={!isTranscriptCompleted ? () => handleWordClick(item.segment.trim(), currentPosition) : undefined}
                  onDoubleClick={!isTranscriptCompleted ? (e) => handleWordDoubleClick(item.segment.trim(), e) : undefined}
                  className={`transition-all duration-200 inline-block ${
                    isHighlighted 
                      ? 'bg-yellow-300 border-2 border-yellow-500 rounded-md px-1 py-0.5 font-medium' 
                      : isTranscriptCompleted 
                        ? ''
                        : 'cursor-pointer hover:bg-yellow-100 hover:border hover:border-yellow-300 hover:rounded-md hover:px-1 hover:py-0.5'
                  }`}
                  title={isTranscriptCompleted ? "Previously highlighted word" : "Click to highlight for practice focus, double-click for dictionary"}
                >
                  {item.segment}
                </span>
              );
          }
        })}
      </p>
    );
  };

  const handleStartPronunciationPractice = async () => {
    if (!feedbackData?.enhanced) {
      console.error('No enhanced transcript available for practice');
      return;
    }

    console.log('Starting pronunciation practice...');

    try {
      // Create practice session with enhanced transcript and highlights
      const action = await dispatch(createPracticeSessionFromFeedback({
        enhancedTranscript: feedbackData.enhanced,
        submissionId: feedbackData.submissionId, // Pass submissionId to get assignment_id
        questionIndex: questionIndex // Pass questionIndex to distinguish between questions
      }));

      if (createPracticeSessionFromFeedback.fulfilled.match(action)) {
        const session = action.payload;
        console.log('Session created/found successfully:', session.id);
        
        // Check if the session is already completed
        if (session.isAlreadyCompleted) {
          console.log('🎉 Session already completed, showing Part 2 option');
          // The Redux state should now be updated with completion status
          // The component will re-render and show the "Practice Completed" button
          return;
        }
        
        // Set assignment context with correct question index if we have assignment data
        if (assignment) {
          dispatch(setAssignmentContext({
            assignmentId: assignment.id,
            questionIndex: questionIndex,
            questionData: {
              id: assignment.questions[questionIndex]?.id || '',
              type: assignment.questions[questionIndex]?.type || '',
              question: assignment.questions[questionIndex]?.question || '',
              speakAloud: assignment.questions[questionIndex]?.speakAloud || false,
              timeLimit: assignment.questions[questionIndex]?.timeLimit || '',
              prepTime: assignment.questions[questionIndex]?.prepTime,
              bulletPoints: assignment.questions[questionIndex]?.bulletPoints
            }
          }));
        }
        
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

  const handleStartPart2 = () => {
    if (!feedbackData?.completedSessionId || !feedbackData?.enhanced) {
      console.error('No completed session or enhanced transcript available for Part 2');
      return;
    }

    // Debug logging
    console.log('🔍 Part 2 Debug:', {
      assignment,
      questionIndex,
      loadingAssignment,
      originalQuestion: assignment?.questions[questionIndex]?.question,
      questions: assignment?.questions,
      highlights: highlights,
      highlightsCount: highlights.length
    });

    // Open Part 2 modal - the Redux action will handle loading highlights if needed
    dispatch(openPracticePart2Modal({
      sessionId: feedbackData.completedSessionId!,
      improvedTranscript: feedbackData.enhanced,
      highlights: highlights, // Pass current highlights, action will fall back to global state if empty
      originalQuestion: assignment?.questions[questionIndex]?.question
    }));
  };

  const renderWizardStep = () => {
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
          <Button onClick={handleBack} className="bg-[#272A69] hover:bg-[#272A69]/90" size="lg">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#272A69]"></div>
          </div>
        </div>
      );
    }

    // Step 1: Show enhanced transcript and guide user to highlight words
    if (!isTranscriptCompleted) {
      return (
        <>
          <div className="w-full flex flex-col items-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                {/* You can use a different icon for Step 1 if desired */}
                <span className="text-orange-600 text-2xl font-bold">1</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#272A69] mb-2 text-center">Step 1: Highlight Key Words</h2>
            <p className="text-gray-600 text-center max-w-2xl mb-2">
              Click on words that you have trouble with and want to remember. You will be able to write notes about these words later.
            </p>
            {/* Progress Bar */}
            {feedbackData?.completedSessionId && (
              <div className="mt-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Practice Progress</span>
                  <span className="text-sm text-gray-500">1/2</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-300 bg-[#272A69]" style={{ width: '50%' }}></div>
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Part 1: Pronunciation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-gray-400">Part 2: Highlight & Practice</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="w-full px-0 py-6 flex flex-col gap-6">
            <div className="practice-feedback-flex">
              <div className="practice-feedback-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {assignment?.questions[questionIndex]?.question || 'Question not available'}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Enhanced Response</span>
                  </div>
                  {highlights.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">
                      {highlights.length} word{highlights.length !== 1 ? 's' : ''} highlighted
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  {renderClickableTranscript(feedbackData.enhanced)}
                </div>
              </div>
              {feedbackData.original && (
                <div className="practice-feedback-col">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original Response</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">
                    {feedbackData.original}
                  </p>
                </div>
              )}
            </div>
            <div className="text-center">
              <Button
                onClick={handleStartPronunciationPractice}
                disabled={practiceSessionLoading || !feedbackData?.enhanced}
                className="px-8 py-3 text-lg font-medium bg-[#272A69] hover:bg-[#272A69]/90 text-white"
                size="lg"
              >
                {practiceSessionLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Starting Practice...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Pronunciation Practice
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      );
    }

    // Step 2: Show completion status and Part 2 option
    return (
      <>
        <div className="w-full flex flex-col items-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Practice Completed!</h2>
          <p className="text-gray-600 text-center max-w-2xl">
            Great job! You've completed the pronunciation practice. 
            {feedbackData?.completedSessionId && !isPart2Completed && (
              <span> Ready for the next step?</span>
            )}
          </p>
          {/* Progress Bar */}
          {feedbackData?.completedSessionId && (
            <div className="mt-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Practice Progress</span>
                <span className="text-sm text-gray-500">
                  {isPart2Completed ? '2/2' : '1/2'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isPart2Completed ? 'bg-green-500' : 'bg-[#272A69]'
                  }`}
                  style={{ width: isPart2Completed ? '100%' : '50%' }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Part 1: Pronunciation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isPart2Completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-xs ${
                    isPart2Completed ? 'text-gray-600' : 'text-gray-400'
                  }`}>Part 2: Highlight & Practice</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Side-by-side layout always visible */}
        <div className="w-full px-0 py-6 flex flex-col gap-6">
          <div className="practice-feedback-flex">
            <div className="practice-feedback-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {assignment?.questions[questionIndex]?.question || 'Question not available'}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Enhanced Response</span>
                </div>
                {highlights.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {highlights.length} word{highlights.length !== 1 ? 's' : ''} highlighted
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                {renderClickableTranscript(feedbackData.enhanced)}
              </div>
            </div>
            {feedbackData.original && (
              <div className="practice-feedback-col">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Original Response</h4>
                <p className="text-lg text-gray-900 whitespace-pre-wrap mb-4">
                  {feedbackData.original}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Part 2 recording and next step button remain below, unchanged */}
        
        {feedbackData.audioUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Original Recording</h3>
            <audio controls className="w-full">
              <source src={feedbackData.audioUrl} type="audio/webm" />
              <source src={feedbackData.audioUrl} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        
        {isPart2Completed && feedbackData.part2RecordingUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Part 2 Practice Recording</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Part 2 Practice Completed</span>
              </div>
              <audio controls className="w-full">
                <source src={feedbackData.part2RecordingUrl} type="audio/webm" />
                <source src={feedbackData.part2RecordingUrl} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {feedbackData?.completedSessionId && !isPart2Completed && (
          <div className="text-center">
            <Button
              onClick={handleStartPart2}
              disabled={loadingAssignment || !assignment}
              className="px-8 py-3 text-lg font-medium bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {loadingAssignment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : !assignment ? (
                <>
                  Loading Assignment...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Start Part 2: Highlight & Practice
                </>
              )}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-8 py-8 flex flex-col gap-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-[#272A69] hover:text-[#272A69]/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#272A69]">Practice</h1>
          </div>
        </div>

        {/* Progress and wizard step */}
        <div className="w-full flex-1">
          {renderWizardStep()}
        </div>

        {sessionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{sessionError}</p>
          </div>
        )}
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .practice-feedback-flex {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            width: 100%;
          }
          .practice-feedback-col {
            flex: 1 1 40%;
            min-width: 0;
            background: white;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            padding: 2rem;
            box-sizing: border-box;
          }
        }
        @media (max-width: 1023px) {
          .practice-feedback-flex {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            width: 100%;
          }
          .practice-feedback-col {
            width: 100%;
            background: white;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            padding: 1.25rem;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};

export default PracticeFeedback;