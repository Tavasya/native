import { renderHook, act } from '@testing-library/react';
import { useQuestionTimer } from '../../src/hooks/assignment/useQuestionTimer';

// Mock timers
jest.useFakeTimers();

describe('useQuestionTimer', () => {
  const defaultProps = {
    timeLimit: 60, // 1 minute
    isRecording: false,
    onTimeUp: jest.fn(),
    questionId: 'question-1',
    resetTrigger: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Timer Initialization', () => {
    it('should initialize with the correct time limit', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));
      
      expect(result.current.timeRemaining).toBe(60);
    });

    it('should reset timer when timeLimit changes', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: defaultProps }
      );

      // Start countdown
      rerender({ ...defaultProps, isRecording: true });
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.timeRemaining).toBe(50);

      // Change time limit
      rerender({ ...defaultProps, timeLimit: 120, isRecording: true });
      
      expect(result.current.timeRemaining).toBe(120);
    });

    it('should reset timer when questionId changes', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: { ...defaultProps, isRecording: true } }
      );

      // Let timer count down
      act(() => {
        jest.advanceTimersByTime(15000); // 15 seconds
      });

      expect(result.current.timeRemaining).toBe(45);

      // Change question
      rerender({ ...defaultProps, questionId: 'question-2', isRecording: true });
      
      expect(result.current.timeRemaining).toBe(60);
    });

    it('should reset timer when resetTrigger changes', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: { ...defaultProps, isRecording: true } }
      );

      // Let timer count down
      act(() => {
        jest.advanceTimersByTime(20000); // 20 seconds
      });

      expect(result.current.timeRemaining).toBe(40);

      // Trigger reset
      rerender({ ...defaultProps, resetTrigger: 1, isRecording: true });
      
      expect(result.current.timeRemaining).toBe(60);
    });
  });

  describe('Timer Countdown', () => {
    it('should not start countdown when not recording', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));

      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });

      expect(result.current.timeRemaining).toBe(60);
    });

    it('should countdown when recording is active', () => {
      const { result } = renderHook(() => 
        useQuestionTimer({ ...defaultProps, isRecording: true })
      );

      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.timeRemaining).toBe(50);
    });

    it('should stop countdown when recording stops', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: { ...defaultProps, isRecording: true } }
      );

      // Let timer count down
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.timeRemaining).toBe(50);

      // Stop recording
      rerender({ ...defaultProps, isRecording: false });

      // Timer should not continue
      act(() => {
        jest.advanceTimersByTime(5000); // 5 more seconds
      });

      expect(result.current.timeRemaining).toBe(50);
    });

    it('should continue into negative time', () => {
      const { result } = renderHook(() => 
        useQuestionTimer({ ...defaultProps, timeLimit: 5, isRecording: true })
      );

      // Let timer go past zero
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.timeRemaining).toBe(-5);
    });

    it('should call onTimeUp when reaching -14 seconds', () => {
      const onTimeUp = jest.fn();
      const { result } = renderHook(() => 
        useQuestionTimer({ 
          ...defaultProps, 
          timeLimit: 5, 
          isRecording: true, 
          onTimeUp 
        })
      );

      // Advance to -14 seconds (5 + 14 = 19 seconds total)
      act(() => {
        jest.advanceTimersByTime(19000);
      });

      expect(result.current.timeRemaining).toBe(-14);
      expect(onTimeUp).toHaveBeenCalledTimes(1);
    });

    it('should stop countdown at -15 seconds', () => {
      const { result } = renderHook(() => 
        useQuestionTimer({ 
          ...defaultProps, 
          timeLimit: 5, 
          isRecording: true 
        })
      );

      // Advance to exactly -15 seconds (5 + 15 = 20 seconds total)
      act(() => {
        jest.advanceTimersByTime(20000); // 20 seconds to reach -15
      });

      expect(result.current.timeRemaining).toBe(-15);

      // Continue further - timer should stop and not go below -15
      act(() => {
        jest.advanceTimersByTime(5000); // 5 more seconds
      });

      expect(result.current.timeRemaining).toBe(-15); // Should stay at -15
    });
  });

  describe('Time Formatting', () => {
    it('should format positive time correctly', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));
      
      expect(result.current.formatTime(125)).toBe('2:05'); // 2 minutes 5 seconds
      expect(result.current.formatTime(60)).toBe('1:00');  // 1 minute
      expect(result.current.formatTime(30)).toBe('0:30');  // 30 seconds
      expect(result.current.formatTime(5)).toBe('0:05');   // 5 seconds
    });

    it('should format negative time correctly', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));
      
      expect(result.current.formatTime(-30)).toBe('-0:30'); // -30 seconds
      expect(result.current.formatTime(-125)).toBe('-2:05'); // -2 minutes 5 seconds
    });

    it('should pad seconds with zero', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));
      
      expect(result.current.formatTime(65)).toBe('1:05');  // Should pad 5 to 05
      expect(result.current.formatTime(1)).toBe('0:01');   // Should pad 1 to 01
    });
  });

  describe('Timer Reset Function', () => {
    it('should provide a resetTimer function', () => {
      const { result } = renderHook(() => useQuestionTimer(defaultProps));
      
      expect(typeof result.current.resetTimer).toBe('function');
    });

    it('should reset timer to original time limit when called', () => {
      const { result } = renderHook(() => 
        useQuestionTimer({ ...defaultProps, isRecording: true })
      );

      // Let timer count down
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      expect(result.current.timeRemaining).toBe(30);

      // Reset timer
      act(() => {
        result.current.resetTimer();
      });

      expect(result.current.timeRemaining).toBe(60);
    });
  });

  describe('Test Mode Scenarios', () => {
    it('should handle rapid question changes in test mode', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: { ...defaultProps, isRecording: true } }
      );

      // Start first question
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });
      expect(result.current.timeRemaining).toBe(50);

      // Quickly change to next question (simulating test mode auto-advance)
      rerender({ ...defaultProps, questionId: 'question-2', isRecording: true });
      expect(result.current.timeRemaining).toBe(60);

      // Continue countdown on new question
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(result.current.timeRemaining).toBe(55);
    });

    it('should handle timer reset during recording', () => {
      const { result, rerender } = renderHook(
        (props) => useQuestionTimer(props),
        { initialProps: { ...defaultProps, isRecording: true } }
      );

      // Start recording and count down
      act(() => {
        jest.advanceTimersByTime(15000); // 15 seconds
      });
      expect(result.current.timeRemaining).toBe(45);

      // Reset while still recording (test mode retry scenario)
      rerender({ ...defaultProps, resetTrigger: 1, isRecording: true });
      expect(result.current.timeRemaining).toBe(60);

      // Should continue counting down
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(result.current.timeRemaining).toBe(55);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero time limit', () => {
      const { result } = renderHook(() => 
        useQuestionTimer({ ...defaultProps, timeLimit: 0, isRecording: true })
      );

      expect(result.current.timeRemaining).toBe(0);

      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });

      expect(result.current.timeRemaining).toBe(-5);
    });

    it('should handle very large time limits', () => {
      const largeTimeLimit = 3600; // 1 hour
      const { result } = renderHook(() => 
        useQuestionTimer({ ...defaultProps, timeLimit: largeTimeLimit })
      );

      expect(result.current.timeRemaining).toBe(largeTimeLimit);
      expect(result.current.formatTime(largeTimeLimit)).toBe('60:00');
    });

    it('should handle multiple onTimeUp calls', () => {
      const onTimeUp = jest.fn();
      renderHook(() => 
        useQuestionTimer({ 
          ...defaultProps, 
          timeLimit: 5, 
          isRecording: true, 
          onTimeUp 
        })
      );

      // Go to -14 (triggers onTimeUp)
      act(() => {
        jest.advanceTimersByTime(19000);
      });

      expect(onTimeUp).toHaveBeenCalledTimes(1);

      // Continue past -14 (should not trigger again since timer stops at -15)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onTimeUp).toHaveBeenCalledTimes(1); // Still only called once
    });
  });
}); 