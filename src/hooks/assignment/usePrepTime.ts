import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  initializePrepTime,
  startPrepTime,
  tickPrepTime,
  endPrepTime,
  startRecordingPhase,
  tickRecordingTime,
  endRecordingPhase,
  resetTimers,
  clearPrepTime,
} from '@/features/assignments/prepTimeSlice';

interface UsePrepTimeProps {
  assignmentId: string;
  questionIndex: number;
  prepTimeDuration: number; // in seconds
  recordingTimeDuration: number; // in seconds
  isTestMode: boolean;
  onPrepTimeEnd?: () => void;
  onRecordingTimeEnd?: () => void;
}

// Helper function to convert time string to seconds
const timeStringToSeconds = (timeString: string): number => {
  if (!timeString) return 15; // default 15 seconds
  
  // Handle M:SS format
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    const minutes = Math.min(parseInt(parts[0]) || 0, 9); // max 9 minutes
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  // Handle old format (just minutes as decimal)
  const minutes = Math.min(parseFloat(timeString) || 1, 9); // max 9 minutes
  return minutes * 60;
};

export const usePrepTime = ({
  assignmentId,
  questionIndex,
  prepTimeDuration,
  recordingTimeDuration,
  isTestMode,
  onPrepTimeEnd,
  onRecordingTimeEnd,
}: UsePrepTimeProps) => {
  const dispatch = useAppDispatch();
  const prepTimeState = useAppSelector(state => state.prepTime);

  // Initialize prep time when question changes
  useEffect(() => {
    if (isTestMode) {
      dispatch(initializePrepTime({
        assignmentId,
        questionIndex,
        prepTimeDuration,
        recordingTimeDuration,
      }));
    } else {
      dispatch(clearPrepTime());
    }
  }, [dispatch, assignmentId, questionIndex, prepTimeDuration, recordingTimeDuration, isTestMode]);

  // Handle prep time countdown
  useEffect(() => {
    if (!isTestMode || !prepTimeState.isPrepTimeActive) return;

    const timer = setInterval(() => {
      dispatch(tickPrepTime());
      
      // Check if prep time is up
      if (prepTimeState.prepTimeRemaining <= 1) {
        dispatch(endPrepTime());
        onPrepTimeEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, isTestMode, prepTimeState.isPrepTimeActive, prepTimeState.prepTimeRemaining, onPrepTimeEnd]);

  // Handle recording time countdown
  useEffect(() => {
    if (!isTestMode || !prepTimeState.isRecordingPhaseActive) return;

    const timer = setInterval(() => {
      dispatch(tickRecordingTime());
      
      // Check if recording time is up
      if (prepTimeState.recordingTimeRemaining <= 1) {
        dispatch(endRecordingPhase());
        onRecordingTimeEnd?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, isTestMode, prepTimeState.isRecordingPhaseActive, prepTimeState.recordingTimeRemaining, onRecordingTimeEnd]);

  // Action functions
  const startPrepTimePhase = useCallback(() => {
    if (isTestMode) {
      dispatch(startPrepTime());
    }
  }, [dispatch, isTestMode]);

  const startRecordingTimePhase = useCallback(() => {
    if (isTestMode) {
      dispatch(startRecordingPhase());
    }
  }, [dispatch, isTestMode]);

  const resetAllTimers = useCallback(() => {
    if (isTestMode) {
      dispatch(resetTimers());
    }
  }, [dispatch, isTestMode]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isPrepTimeActive: isTestMode ? prepTimeState.isPrepTimeActive : false,
    isRecordingPhaseActive: isTestMode ? prepTimeState.isRecordingPhaseActive : false,
    prepTimeRemaining: isTestMode ? prepTimeState.prepTimeRemaining : 0,
    recordingTimeRemaining: isTestMode ? prepTimeState.recordingTimeRemaining : 0,
    
    // Actions
    startPrepTimePhase,
    startRecordingTimePhase,
    resetAllTimers,
    formatTime,
    
    // Computed values
    isPrepTimeComplete: isTestMode ? (prepTimeState.prepTimeRemaining === 0 && !prepTimeState.isPrepTimeActive) : true,
    canStartRecording: isTestMode ? 
      (prepTimeState.prepTimeRemaining === 0 || prepTimeState.isRecordingPhaseActive) : 
      true,
  };
};
 