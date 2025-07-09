// 📁 src/components/assignment/QuestionDisplay.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Lightbulb } from "lucide-react";
import { generateTTSAudio } from "@/features/tts/ttsService";
import { useAppDispatch } from "@/app/hooks";
import { setTTSAudio, setLoading } from "@/features/tts/ttsSlice";

interface QuestionDisplayProps {
  currentQuestion: QuestionCard & { isCompleted?: boolean };
  isTestMode?: boolean;
  isAudioOnlyMode?: boolean; // Enable audio-only for normal mode
  isRecording?: boolean; // For hiding hints during recording
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion,
  isTestMode = false,
  isAudioOnlyMode = false,
  isRecording = false
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const isGeneratingAudio = useRef(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const handlePlayQuestion = useCallback(async () => {
    // Prevent duplicate audio generation or playing while already playing
    if (isGeneratingAudio.current || isPlaying) {
      return;
    }
    
    try {
      isGeneratingAudio.current = true;
      setIsLoading(true);
      const cacheKey = `question_${currentQuestion.id}`;
      
      // Set loading state in Redux
      dispatch(setLoading({ key: cacheKey, loading: true }));
      
      // Prepare the text to be read
      let textToRead = currentQuestion.question;
      
      // Add bullet points if they exist
      if (currentQuestion.bulletPoints && currentQuestion.bulletPoints.length > 0) {
        textToRead += ". You should say: " + currentQuestion.bulletPoints.join(". ");
      }
      
      // Generate audio for the question and bullet points
      const audioUrl = await generateTTSAudio(textToRead);
      
      // Store in Redux
      dispatch(setTTSAudio({ key: cacheKey, url: audioUrl }));
      
      // Create and play the audio
      const audio = new Audio(audioUrl);
      currentAudio.current = audio;
      
      // Set up event listeners
      audio.addEventListener('loadstart', () => setIsPlaying(true));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        currentAudio.current = null;
      });
      audio.addEventListener('error', () => {
        setIsPlaying(false);
        currentAudio.current = null;
      });
      
      await audio.play();
    } catch (error) {
      console.error('Error playing question audio:', error);
      setIsPlaying(false);
      currentAudio.current = null;
    } finally {
      isGeneratingAudio.current = false;
      setIsLoading(false);
      dispatch(setLoading({ key: `question_${currentQuestion.id}`, loading: false }));
    }
  }, [currentQuestion.id, currentQuestion.question, currentQuestion.bulletPoints, dispatch, isPlaying]);

  // Helper function to determine if question text should be hidden
  const shouldHideQuestionText = (isTestMode || isAudioOnlyMode) && currentQuestion.type === 'normal';

  // Auto-play audio for Part 1/3 questions in test mode only
  useEffect(() => {
    const shouldAutoPlay = isTestMode && currentQuestion.type === 'normal';
    
    if (shouldAutoPlay && !hasAutoPlayed) {
      setHasAutoPlayed(true);
      // Call handlePlayQuestion directly without dependency
      handlePlayQuestion();
    }
  }, [currentQuestion.id, isTestMode, hasAutoPlayed]);

  // Reset auto-play flag when question changes
  useEffect(() => {
    setHasAutoPlayed(false);
  }, [currentQuestion.id]);

  // Cleanup audio when question changes or component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
        setIsPlaying(false);
      }
    };
  }, [currentQuestion.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
    };
  }, []);

  return (
    <ScrollArea className="bg-white rounded-xl p-4 sm:p-6 mb-4 flex-grow overflow-auto" style={{ maxHeight: "420px" }}>
      {currentQuestion.type === 'bulletPoints' ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Question</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handlePlayQuestion}
              disabled={isLoading || isPlaying}
            >
              {isLoading || isPlaying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
          <p className="text-gray-800 mb-3">{currentQuestion.question}</p>
          <p className="text-gray-700 mb-2">You should say:</p>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {currentQuestion.bulletPoints?.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          {shouldHideQuestionText ? (
            // Audio-only layout with centered play button
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 w-16 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground mb-4"
                  onClick={handlePlayQuestion}
                  disabled={isLoading || isPlaying}
                >
                  {isLoading || isPlaying ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <p className="text-lg font-medium">Audio Only Question</p>
                <p className="text-sm">
                  {isLoading ? "Loading question audio..." : 
                   isPlaying ? "Playing question audio..." : 
                   "Click the play button to hear the question"}
                </p>
              </div>
            </div>
          ) : (
            // Normal layout with header and text
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Question</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={handlePlayQuestion}
                  disabled={isLoading || isPlaying}
                >
                  {isLoading || isPlaying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="text-gray-800">{currentQuestion.question}</p>
              
              {/* Hints - Show for Part 1 & Part 3 questions, hide when recording, test mode, or audio-only mode */}
              {currentQuestion.hasHint && 
               currentQuestion.hintText && 
               currentQuestion.type === 'normal' && 
               !isTestMode && 
               !isAudioOnlyMode && 
               !isRecording && (
                <div className="mt-3 p-3 border-l-2 border-gray-300 bg-gray-50">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hint</span>
                      <p className="text-sm text-gray-700 mt-1">{currentQuestion.hintText}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  );
};

export default QuestionDisplay;
