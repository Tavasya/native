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
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  hasRecorded,
  isPlaying,
  isProcessing,
  showRecordButton,
  isPreviewMode,
  onToggleRecording,
  onRetryRecording
}) => {
  return (
    <div className="flex flex-col gap-4">
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
      {hasRecorded && !isRecording && (
        <div className="flex justify-center pb-4">
          <div className="flex space-x-3">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRetryRecording}
                  variant="outline"
                  className="text-gray-700"
                  disabled={isProcessing || isPlaying}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="relative translate-x-[-17%]">
                <p>Retry</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
