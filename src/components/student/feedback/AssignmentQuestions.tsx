import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Assignment } from '@/features/assignments/types';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { generateTTSAudio } from "@/features/tts/ttsService";
import { useAppDispatch } from "@/app/hooks";
import { setTTSAudio, setLoading } from "@/features/tts/ttsSlice";

interface AssignmentQuestionsProps {
  assignment: Assignment;
  selectedQuestionIndex: number;
}

const AssignmentQuestions: React.FC<AssignmentQuestionsProps> = ({ assignment, selectedQuestionIndex }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Parse questions if they're stored as a string
  let questions = assignment.questions;
  if (typeof questions === 'string') {
    try {
      questions = JSON.parse(questions);
    } catch (e) {
      console.error('Failed to parse questions JSON:', e);
      return null;
    }
  }
  
  // Ensure questions is an array
  if (!Array.isArray(questions) || questions.length === 0) {
    console.log('No valid questions found:', { questions, type: typeof questions });
    return null;
  }
  
  const currentQuestion = questions[selectedQuestionIndex];
  
  if (!currentQuestion) {
    console.log('No question at index:', { selectedQuestionIndex, totalQuestions: questions.length });
    return null;
  }

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
  
  console.log('Displaying question:', { 
    selectedQuestionIndex, 
    question: currentQuestion.question,
    timeLimit: currentQuestion.timeLimit,
    bulletPoints: currentQuestion.bulletPoints 
  });

  return (
    <Card className="shadow-sm border border-slate-200 bg-white">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-900 font-medium leading-relaxed">
              {currentQuestion.question || 'No question text available'}
            </p>
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
          
          {currentQuestion.bulletPoints && currentQuestion.bulletPoints.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3">
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                {currentQuestion.bulletPoints.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="text-sm leading-relaxed">{bullet || 'Empty bullet point'}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Time Limit: {currentQuestion.timeLimit || 'N/A'} minutes
            </span>
            {currentQuestion.speakAloud && (
              <span className="flex items-center gap-1 text-slate-600">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                Speak Aloud
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentQuestions; 