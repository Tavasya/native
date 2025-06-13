import { useState, useEffect, useCallback } from 'react';

interface UseQuestionTimerProps {
  timeLimit: number; // in seconds
  isRecording: boolean;
  onTimeUp: () => void;
  questionId: string; // Add questionId to track question changes
  resetTrigger?: number; // Add reset trigger for external resets
}

export const useQuestionTimer = ({ timeLimit, isRecording, onTimeUp, questionId, resetTrigger }: UseQuestionTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  // Reset timer when timeLimit, questionId, or resetTrigger changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit, questionId, resetTrigger]);

  useEffect(() => {
    if (timeRemaining > -15 && isRecording) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime === -14) {
            onTimeUp();
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isRecording, onTimeUp]);

  const formatTime = (time: number) => {
    const isNegative = time < 0;
    const absTime = Math.abs(time);
    const minutes = Math.floor(absTime / 60);
    const seconds = Math.floor(absTime % 60);
    return `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  return {
    timeRemaining,
    formatTime,
    resetTimer
  };
};