// 📁 src/hooks/useQuestionNavigation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { updatePracticeProgress } from '@/features/assignments/assignmentSlice';

interface UseQuestionNavigationProps {
  assignmentId: string;
  totalQuestions: number;
  initialQuestionIndex?: number;
  isCompleted: boolean;
  completedQuestions: string[];
  // ADD (optional to maintain backward compatibility):
  isTestMode?: boolean;
  hasTestStarted?: boolean;
}

export const useQuestionNavigation = ({
  assignmentId,
  totalQuestions,
  initialQuestionIndex = 0,
  isCompleted,
  completedQuestions,
  isTestMode = false,
  hasTestStarted = false
}: UseQuestionNavigationProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const dispatch = useAppDispatch();
  const prevCompletedQuestions = useRef<string[]>([]);

  useEffect(() => {
    // Only dispatch if something actually changed
    const hasChanged = 
      prevCompletedQuestions.current.length !== completedQuestions.length ||
      prevCompletedQuestions.current.some((id, index) => id !== completedQuestions[index]);
      
    if (!isCompleted && hasChanged) {
      dispatch(updatePracticeProgress({
        assignmentId,
        currentQuestionIndex,
        completedQuestions
      }));
      prevCompletedQuestions.current = completedQuestions;
    }
  }, [assignmentId, currentQuestionIndex, isCompleted, completedQuestions, dispatch]);

  const goToQuestion = useCallback((index: number) => {
    // SAFE: Only block in test mode when test is active
    if (isTestMode && hasTestStarted) {
      console.log('Manual navigation blocked during active test');
      return;
    }
    
    // Normal navigation logic (unchanged)
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  }, [totalQuestions, isTestMode, hasTestStarted]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return {
    currentQuestionIndex,
    isLastQuestion,
    isFirstQuestion,
    goToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    setCurrentQuestionIndex
  };
};
