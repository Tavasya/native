// 📁 src/components/assignment/RecordingControls.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import MicIcon from "@/lib/images/mic.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecordingControlsProps {
  isRecording: boolean;
  hasRecorded: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  showRecordButton: boolean;
  isPreviewMode: boolean;
  onToggleRecording: () => void;
  onPlayRecording: () => void;
  onRetryRecording: () => void;
  isPrepTimeActive?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  hasRecorded,
  isPlaying,
  isProcessing,
  showRecordButton,
  isPreviewMode,
  onToggleRecording,
  onRetryRecording,
  isPrepTimeActive = false
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Prep Time Message */}
      {isPrepTimeActive && (
        <div className="flex justify-center">
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-orange-800 font-medium">Preparation Time</p>
            <p className="text-orange-600 text-sm">Recording will start automatically when prep time ends</p>
          </div>
        </div>
      )}
      
      {/* Main Record Button */}
      <div className="flex justify-center">
        <div className="flex space-x-4 items-center">
          {showRecordButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onToggleRecording}
                  className="rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-[#272A69] hover:bg-[#272A69]/90"
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  disabled={isPlaying}
                >
                  <img 
                    src={MicIcon} 
                    alt="Microphone" 
                    className={`w-6 h-6 transition-all duration-200 ${
                      isRecording || isPlaying ? 'hidden' : 'opacity-100'
                    }`}
                  />
                  {(isPlaying || isRecording) && (
                    <div className="w-8 h-8 bg-white border-2 border-[#272A69] rounded-[7px]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p>{isPreviewMode ? "Recording disabled in preview mode" : (isRecording ? "Stop recording" : "Start recording")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Retry Button */}
      {hasRecorded && !isRecording && !isPrepTimeActive && (
        <div className="flex justify-center pb-4">
          <div className="flex space-x-3">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRetryRecording}
                  variant="outline"
                  className="text-gray-700 hover:bg-gray-50"
                  disabled={isProcessing || isPlaying}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="relative translate-x-[-17%]">
                <p>Reset and try again</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
