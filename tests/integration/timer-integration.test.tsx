import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useQuestionTimer } from '../../src/hooks/assignment/useQuestionTimer';
import QuestionTimer from '../../src/components/assignment/QuestionTimer';

// Mock timers for integration tests
jest.useFakeTimers();

describe('Timer Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Timer Hook + Display Component Integration', () => {
    // Integration component that combines hook + component
    const TimerIntegration = ({ timeLimit = 60, initialRecording = false }) => {
      const [isRecording, setIsRecording] = useState(initialRecording);
      const [timeUpCalled, setTimeUpCalled] = useState(false);

      const { timeRemaining, formatTime } = useQuestionTimer({
        timeLimit,
        isRecording,
        onTimeUp: () => setTimeUpCalled(true),
        questionId: 'integration-test-1',
      });

      return (
        <div>
          <QuestionTimer timeRemaining={timeRemaining} formatTime={formatTime} />
          <button onClick={() => setIsRecording(!isRecording)}>
            {isRecording ? 'Stop' : 'Start'} Recording
          </button>
          {timeUpCalled && <div data-testid="time-up">Time's Up!</div>}
          <div data-testid="recording-status">
            {isRecording ? 'Recording' : 'Not Recording'}
          </div>
        </div>
      );
    };

    it('should display time from hook and respond to recording state changes', () => {
      render(<TimerIntegration timeLimit={30} />);

      // Check initial state
      expect(screen.getByText('0:30')).toBeInTheDocument();
      expect(screen.getByText('Not Recording')).toBeInTheDocument();

      // Time shouldn't change when not recording
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(screen.getByText('0:30')).toBeInTheDocument();

      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      expect(screen.getByText('Recording')).toBeInTheDocument();

      // Now time should count down
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(screen.getByText('0:25')).toBeInTheDocument();

      // Stop recording
      fireEvent.click(screen.getByText('Stop Recording'));
      expect(screen.getByText('Not Recording')).toBeInTheDocument();

      // Time should stop counting
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(screen.getByText('0:25')).toBeInTheDocument(); // Should stay the same
    });

    it('should show visual state changes when time gets low', () => {
      render(<TimerIntegration timeLimit={20} initialRecording={true} />);

      // Initial state - normal colors
      expect(screen.getByText('0:20')).toHaveClass('text-gray-600');

      // Count down to warning threshold
      act(() => {
        jest.advanceTimersByTime(6000); // 6 seconds, now at 14 seconds
      });

      // Should show warning state
      expect(screen.getByText('0:14')).toHaveClass('text-red-500');
    });

    it('should handle time-up callback and negative time display', () => {
      render(<TimerIntegration timeLimit={5} initialRecording={true} />);

      // Count down past zero to trigger time-up
      act(() => {
        jest.advanceTimersByTime(19000); // 19 seconds, should reach -14 and trigger callback
      });

      // Check time-up callback was triggered
      expect(screen.getByTestId('time-up')).toBeInTheDocument();

      // Check negative time display with critical styling
      expect(screen.getByText('-0:14')).toBeInTheDocument();
      expect(screen.getByText('-0:14')).toHaveClass('bg-red-500', 'text-white');
    });
  });

  describe('Timer with Recording Controls Integration', () => {
    // More realistic integration with recording controls
    const RecordingTimerIntegration = () => {
      const [isRecording, setIsRecording] = useState(false);
      const [hasRecorded, setHasRecorded] = useState(false);

      const { timeRemaining, formatTime, resetTimer } = useQuestionTimer({
        timeLimit: 30,
        isRecording,
        onTimeUp: () => {
          if (isRecording) {
            setIsRecording(false); // Auto-stop recording when time's up
            setHasRecorded(true);
          }
        },
        questionId: 'recording-test-1',
      });

      const toggleRecording = () => {
        if (!isRecording && !hasRecorded) {
          setIsRecording(true);
        } else if (isRecording) {
          setIsRecording(false);
          setHasRecorded(true);
        }
      };

      const retryRecording = () => {
        setIsRecording(false);
        setHasRecorded(false);
        resetTimer();
      };

      return (
        <div>
          <QuestionTimer timeRemaining={timeRemaining} formatTime={formatTime} />
          
          <div data-testid="controls">
            {!hasRecorded && !isRecording && (
              <button onClick={toggleRecording}>Start Recording</button>
            )}
            {isRecording && (
              <button onClick={toggleRecording}>Stop Recording</button>
            )}
            {hasRecorded && (
              <button onClick={retryRecording}>Retry Recording</button>
            )}
          </div>

          <div data-testid="status">
            {isRecording && 'Recording in progress...'}
            {hasRecorded && !isRecording && 'Recording completed'}
            {!isRecording && !hasRecorded && 'Ready to record'}
          </div>
        </div>
      );
    };

    it('should handle full recording workflow with timer', () => {
      render(<RecordingTimerIntegration />);

      // Initial state
      expect(screen.getByText('0:30')).toBeInTheDocument();
      expect(screen.getByText('Ready to record')).toBeInTheDocument();
      expect(screen.getByText('Start Recording')).toBeInTheDocument();

      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument();
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();

      // Let some time pass
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });
      expect(screen.getByText('0:20')).toBeInTheDocument();

      // Stop recording manually
      fireEvent.click(screen.getByText('Stop Recording'));
      expect(screen.getByText('Recording completed')).toBeInTheDocument();
      expect(screen.getByText('Retry Recording')).toBeInTheDocument();

      // Timer should stop counting
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(screen.getByText('0:20')).toBeInTheDocument(); // Should stay the same

      // Retry should reset everything
      fireEvent.click(screen.getByText('Retry Recording'));
      expect(screen.getByText('0:30')).toBeInTheDocument(); // Timer reset
      expect(screen.getByText('Ready to record')).toBeInTheDocument();
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });

    it('should auto-stop recording when time runs out', () => {
      render(<RecordingTimerIntegration />);

      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument();

      // Let timer run to completion
      act(() => {
        jest.advanceTimersByTime(44000); // 44 seconds, should trigger auto-stop at -14
      });

      // Should auto-stop and show completed state
      expect(screen.getByText('Recording completed')).toBeInTheDocument();
      expect(screen.getByText('Retry Recording')).toBeInTheDocument();
      expect(screen.getByText('-0:14')).toBeInTheDocument();
    });
  });

  describe('Multiple Question Timer Integration', () => {
    // Test question switching with timer resets
    const MultiQuestionIntegration = () => {
      const [currentQuestion, setCurrentQuestion] = useState(0);
      const [isRecording, setIsRecording] = useState(false);
      
      const questions = [
        { id: 'q1', timeLimit: 20, title: 'Question 1' },
        { id: 'q2', timeLimit: 30, title: 'Question 2' },
      ];

      const { timeRemaining, formatTime } = useQuestionTimer({
        timeLimit: questions[currentQuestion].timeLimit,
        isRecording,
        onTimeUp: () => setIsRecording(false),
        questionId: questions[currentQuestion].id,
      });

      const goToNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setIsRecording(false);
        }
      };

      return (
        <div>
          <h2 data-testid="question-title">{questions[currentQuestion].title}</h2>
          <QuestionTimer timeRemaining={timeRemaining} formatTime={formatTime} />
          
          <button onClick={() => setIsRecording(!isRecording)}>
            {isRecording ? 'Stop' : 'Start'} Recording
          </button>
          
          {currentQuestion < questions.length - 1 && (
            <button onClick={goToNextQuestion}>Next Question</button>
          )}

          <div data-testid="question-info">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
      );
    };

    it('should reset timer when switching between questions', () => {
      render(<MultiQuestionIntegration />);

      // Start on question 1 (20 second limit)
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('0:20')).toBeInTheDocument();

      // Start recording and let some time pass
      fireEvent.click(screen.getByText('Start Recording'));
      act(() => {
        jest.advanceTimersByTime(8000); // 8 seconds
      });
      expect(screen.getByText('0:12')).toBeInTheDocument();

      // Go to next question
      fireEvent.click(screen.getByText('Next Question'));

      // Should be on question 2 with fresh timer (30 second limit)
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.getByText('0:30')).toBeInTheDocument(); // Fresh timer
      expect(screen.getByText('Start Recording')).toBeInTheDocument(); // Recording stopped
    });
  });
}); 