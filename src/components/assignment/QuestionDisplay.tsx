// 📁 src/components/assignment/QuestionDisplay.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { generateTTSAudio } from "@/features/tts/ttsService";
import { useAppDispatch } from "@/app/hooks";
import { setTTSAudio, setLoading } from "@/features/tts/ttsSlice";

interface QuestionDisplayProps {
  currentQuestion: QuestionCard & { isCompleted?: boolean };
  isTestMode?: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion,
  isTestMode = false
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const isGeneratingAudio = useRef(false);

  const handlePlayQuestion = useCallback(async () => {
    // Prevent duplicate audio generation
    if (isGeneratingAudio.current) {
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
      
      // Play the audio
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing question audio:', error);
    } finally {
      isGeneratingAudio.current = false;
      setIsLoading(false);
      dispatch(setLoading({ key: `question_${currentQuestion.id}`, loading: false }));
    }
  }, [currentQuestion.id, currentQuestion.question, currentQuestion.bulletPoints, dispatch]);

  // Helper function to determine if question text should be hidden
  const shouldHideQuestionText = isTestMode && currentQuestion.type === 'normal';

  // Auto-play audio for Part 1/3 questions in test mode
  useEffect(() => {
    const shouldAutoPlay = isTestMode && currentQuestion.type === 'normal';
    
    if (shouldAutoPlay && !hasAutoPlayed) {
      setHasAutoPlayed(true);
      // Call handlePlayQuestion directly without dependency
      handlePlayQuestion();
    }
  }, [currentQuestion.id, isTestMode, hasAutoPlayed]); // Removed handlePlayQuestion from dependencies

  // Reset auto-play flag when question changes
  useEffect(() => {
    setHasAutoPlayed(false);
  }, [currentQuestion.id]);

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
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Question</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handlePlayQuestion}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
          {shouldHideQuestionText ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p className="text-lg font-medium">Audio Only Question</p>
                <p className="text-sm">
                  {isLoading ? "Playing question audio..." : "Click the play button above to replay the question"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-800">{currentQuestion.question}</p>
          )}
        </div>
      )}
    </ScrollArea>
  );
};

export default QuestionDisplay;
