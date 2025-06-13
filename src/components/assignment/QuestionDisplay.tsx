// 📁 src/components/assignment/QuestionDisplay.tsx
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { generateTTSAudio } from "@/features/tts/ttsService";
import { useAppDispatch } from "@/app/hooks";
import { setTTSAudio, setLoading } from "@/features/tts/ttsSlice";

interface QuestionDisplayProps {
  currentQuestion: QuestionCard & { isCompleted?: boolean };
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayQuestion = async () => {
    try {
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
      setIsLoading(false);
      dispatch(setLoading({ key: `question_${currentQuestion.id}`, loading: false }));
    }
  };

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
          <p className="text-gray-800">{currentQuestion.question}</p>
        </div>
      )}
    </ScrollArea>
  );
};

export default QuestionDisplay;
