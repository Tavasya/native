import React from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrepTimeTimerProps {
  isPrepTimeActive: boolean;
  isRecordingPhaseActive: boolean;
  prepTimeRemaining: number;
  recordingTimeRemaining: number;
  formatTime: (time: number) => string;
  onStartPrepTime: () => void;
  onStartRecording: () => void;
  canStartRecording: boolean;
  isTestMode: boolean;
}

const PrepTimeTimer: React.FC<PrepTimeTimerProps> = ({
  isPrepTimeActive,
  isRecordingPhaseActive,
  prepTimeRemaining,
  recordingTimeRemaining,
  formatTime,
  onStartPrepTime,
  onStartRecording,
  canStartRecording,
  isTestMode,
}) => {
  if (!isTestMode) return null;

  const currentPhase = isPrepTimeActive ? 'prep' : isRecordingPhaseActive ? 'recording' : 'ready';
  const currentTime = isPrepTimeActive ? prepTimeRemaining : recordingTimeRemaining;

  return (
    <div className={cn(
      "bg-white rounded-lg p-4 border-2 transition-all duration-300",
      currentPhase === 'prep' && "border-orange-400 bg-orange-50",
      currentPhase === 'recording' && "border-red-400 bg-red-50",
      currentPhase === 'ready' && "border-gray-300"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            currentPhase === 'prep' && "bg-orange-100",
            currentPhase === 'recording' && "bg-red-100",
            currentPhase === 'ready' && "bg-gray-100"
          )}>
            <Clock className={cn(
              "h-5 w-5",
              currentPhase === 'prep' && "text-orange-600",
              currentPhase === 'recording' && "text-red-600",
              currentPhase === 'ready' && "text-gray-600"
            )} />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {currentPhase === 'prep' && 'Preparation Time'}
              {currentPhase === 'recording' && 'Recording Time'}
              {currentPhase === 'ready' && 'Test Mode - Preparation Ready'}
            </h3>
            <p className="text-sm text-gray-500">
              {currentPhase === 'prep' && 'Review the question and prepare your answer'}
              {currentPhase === 'recording' && 'Recording your response'}
              {currentPhase === 'ready' && 'Click to start preparation phase'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(isPrepTimeActive || isRecordingPhaseActive) && (
            <div className={cn(
              "text-3xl font-bold",
              currentPhase === 'prep' && "text-orange-600",
              currentPhase === 'recording' && "text-red-600"
            )}>
              {formatTime(currentTime)}
            </div>
          )}

          <div className="flex gap-2">
            {currentPhase === 'ready' && (
              <Button
                onClick={onStartPrepTime}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Prep Time
              </Button>
            )}

            {currentPhase === 'prep' && (
              <Button
                onClick={onStartRecording}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Skip to Recording
              </Button>
            )}

            {currentPhase === 'recording' && canStartRecording && (
              <Button
                onClick={onStartRecording}
                className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Recording
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepTimeTimer; 