// 📁 src/components/assignment/RecordingControls.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import MicIcon from "@/lib/images/mic.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecordingControlsProps {
  isRecording: boolean;
  isPlaying: boolean;
  showRecordButton: boolean;
  isPreviewMode: boolean;
  onToggleRecording: () => void;
  onPlayRecording: () => void;
  isPrepTimeActive?: boolean;
  isProcessing?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPlaying,
  showRecordButton,
  isPreviewMode,
  onToggleRecording,
  isPrepTimeActive = false,
  isProcessing = false
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Prep Time Message */}
      {isPrepTimeActive && (
        <div className="flex justify-center">
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-orange-800 font-medium">Preparation Time</p>
            <p className="text-orange-600 text-sm">You can start recording anytime or wait for prep time to end</p>
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
                  disabled={isPlaying || isProcessing}
                >
                  <img 
                    src={MicIcon} 
                    alt="Microphone" 
                    className={`w-6 h-6 transition-all duration-200 ${
                      isRecording || isPlaying || isProcessing ? 'hidden' : 'opacity-100'
                    }`}
                  />
                  {(isPlaying || isRecording) && (
                    <div className="w-8 h-8 bg-white border-2 border-[#272A69] rounded-[7px]" />
                  )}
                  {isProcessing && (
                    <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p>
                  {isPreviewMode 
                    ? "Recording disabled in preview mode" 
                    : isProcessing 
                      ? "Processing recording..."
                      : isRecording 
                        ? "Stop recording" 
                        : "Start recording"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>


    </div>
  );
};

export default RecordingControls;
