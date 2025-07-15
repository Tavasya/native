import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Assignment, QuestionCard } from '@/features/assignments/types';
import { useAppSelector } from '@/app/hooks';


import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';


interface AssignmentQuestionsProps {
  assignment: Assignment;
  selectedQuestionIndex: number;
}

const AssignmentQuestions: React.FC<AssignmentQuestionsProps> = ({ assignment, selectedQuestionIndex }) => {
  const navigate = useNavigate();
  
  // Get the current submission data to pass transcript info
  const selectedSubmission = useAppSelector(state => state.submissions.selectedSubmission);

  // Parse questions if they're stored as a string
  const questions: QuestionCard[] = (() => {
    if (!assignment?.questions) return [];
    
    if (typeof assignment.questions === 'string') {
      try {
        return JSON.parse(assignment.questions);
      } catch (error) {
        console.error('Error parsing assignment questions:', error);
        return [];
      }
    }
    
    return assignment.questions;
  })();

  const currentQuestion = questions[selectedQuestionIndex];

  if (!currentQuestion) {
    return (
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardContent className="p-4">
          <p className="text-gray-500">No question available</p>
        </CardContent>
      </Card>
    );
  }



  const handlePracticeQuestion = async () => {
    // Get the current question's feedback data
    const currentQuestionFeedback = selectedSubmission?.section_feedback?.[selectedQuestionIndex];

    
    if (!currentQuestionFeedback) {
      console.error('No feedback data available for practice');
      return;
    }


    // 🔧 CREATE DATABASE RECORD WHEN PRACTICE BUTTON IS CLICKED
    try {
      // Get current user ID
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession?.user?.id) {
        console.error('User not authenticated');
        return;
      }

      const submissionId = selectedSubmission?.id;
      const enhancedTranscript = currentQuestionFeedback.section_feedback?.paragraph_restructuring?.improved_transcript;
      
      if (!enhancedTranscript) {
        console.error('No enhanced transcript available for practice');
        return;
      }

      // Check if a practice session already exists for this submission and question
      const { data: existingSessions, error: searchError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userSession.user.id)
        .eq('submission_id', submissionId)
        .eq('question_index', selectedQuestionIndex)
        .order('created_at', { ascending: false })
        .limit(1);

      let practiceSessionId = null;
      let isAlreadyCompleted = false;

      if (!searchError && existingSessions && existingSessions.length > 0) {
        // Found existing session
        const existingSession = existingSessions[0];
        practiceSessionId = existingSession.id;
        isAlreadyCompleted = existingSession.status === 'completed';
        console.log('🔄 Found existing practice session:', {
          sessionId: practiceSessionId,
          status: existingSession.status,
          isCompleted: isAlreadyCompleted
        });
      } else {
        // No existing session found, create a new one
        console.log('🆕 Creating new practice session...');
        const { data: newSession, error: createError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: userSession.user.id,
            assignment_id: selectedSubmission?.assignment_id,
            submission_id: submissionId,
            question_index: selectedQuestionIndex,
            improved_transcript: enhancedTranscript,
            status: 'transcript_ready',
            practice_phase: 'ready',
            practice_mode: 'full-transcript',
            has_tried_full_transcript: false,
            is_returning_to_full_transcript: false,
            current_sentence_index: 0,
            current_word_index: 0,
            problematic_word_index: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating practice session:', createError);
          // Continue with navigation even if session creation fails
        } else {
          practiceSessionId = newSession.id;
          console.log('✅ Created new practice session:', practiceSessionId);
        }
      }

      // Navigate to practice feedback page with session info
      navigate('/student/practice-feedback', {
        state: {
          transcriptData: {
            original: currentQuestionFeedback.transcript || 'No original transcript available',
            enhanced: enhancedTranscript,
            audioUrl: currentQuestionFeedback.audio_url || '',
            submissionId: submissionId || '',
            questionIndex: selectedQuestionIndex,
            practiceSessionId: practiceSessionId,
            isAlreadyCompleted: isAlreadyCompleted
          }
        }
      });

    } catch (error) {
      console.error('Error in practice session handling:', error);
      // Continue with navigation even if session creation fails
      navigate('/student/practice-feedback', {
        state: {
          transcriptData: {
            original: currentQuestionFeedback.transcript || 'No original transcript available',
            enhanced: currentQuestionFeedback.section_feedback?.paragraph_restructuring?.improved_transcript || 'No enhanced transcript available', 
            audioUrl: currentQuestionFeedback.audio_url || '',
            submissionId: selectedSubmission?.id || '',
            questionIndex: selectedQuestionIndex
          }
        }
      });
    }
  };

  
  console.log('Displaying question:', { 
    selectedQuestionIndex, 
    question: currentQuestion.question,
    bulletPoints: currentQuestion.bulletPoints 
  });

  return (
    <Card className="shadow-sm border border-slate-200 bg-white">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-900 font-medium leading-relaxed">
                  {(currentQuestion.question || 'No question text available').replace(/^[•\-\*]\s*/, '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              { <Button
                variant="default"
                size="sm"
                className="bg-[#272A69] text-white hover:bg-[#272A69]/90"
                onClick={handlePracticeQuestion}
              >
                Practice
              </Button> }
            </div>
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
          
          {currentQuestion.speakAloud && (
            <div className="flex gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <span className="flex items-center gap-1 text-slate-600">
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                Speak Aloud
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentQuestions; 