import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Assignment } from '@/features/assignments/types';

interface AssignmentQuestionsProps {
  assignment: Assignment;
  selectedQuestionIndex: number;
}

const AssignmentQuestions: React.FC<AssignmentQuestionsProps> = ({ assignment, selectedQuestionIndex }) => {
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
          <p className="text-slate-900 font-medium leading-relaxed">
            {currentQuestion.question || 'No question text available'}
          </p>
          
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