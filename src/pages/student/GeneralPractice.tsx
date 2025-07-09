import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionCard } from '@/features/assignments/types';
import { supabase } from '@/integrations/supabase/client';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { setSession } from '@/features/practice/practiceSlice';
import LoadingSpinner from '@/components/LoadingSpinner';

const GeneralPractice: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentSession } = useAppSelector(state => state.practice);
  const [practiceAssignmentId, setPracticeAssignmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setupInProgress = useRef(false);

  // Hardcoded practice assignment questions
  const practiceQuestions: QuestionCard[] = React.useMemo(() => [
    {
      id: 'q1',
      type: 'normal',
      question: 'Tell me about yourself and your hometown. What do you like most about living there?',
      speakAloud: true,
      timeLimit: '2',
      prepTime: '1'
    }
  ], []);

  useEffect(() => {
    const setupPracticeAssignment = async () => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Check if we already have a session in Redux state
      if (currentSession) {
        console.log('Found existing session in Redux state:', currentSession.status);
        // Navigate based on existing session status - all states go to practice feedback page
        switch (currentSession.status) {
          case 'completed':
          case 'transcript_processing':
          case 'transcript_ready':
          case 'practicing_sentences':
          case 'practicing_words':
          case 'practicing_full_transcript':
          case 'failed':
          case 'abandoned':
            navigate(`/student/practice-feedback?session=${currentSession.id}`);
            return;
          default:
            break;
        }
      }

      // Prevent duplicate execution (especially in React Strict Mode)
      if (setupInProgress.current) {
        return;
      }
      setupInProgress.current = true;

      try {
        // Check if practice assignment already exists for this user
        // Use a more robust query that doesn't rely on JSON operators
        const { data: existingAssignments, error: fetchError } = await supabase
          .from('assignments')
          .select('id, metadata')
          .eq('title', 'IELTS Speaking Practice')
          .eq('created_by', user.id);

        if (fetchError) {
          throw fetchError;
        }

        // Filter for practice assignments in JavaScript since JSON queries can be unreliable
        const practiceAssignment = existingAssignments?.find(assignment => 
          assignment.metadata && assignment.metadata.isPractice === true
        );

        if (practiceAssignment) {
          console.log('Found existing practice assignment:', practiceAssignment.id);
          
          // Check if there's a completed submission for this practice assignment
          const { data: submissions, error: submissionError } = await supabase
            .from('submissions')
            .select('id, status')
            .eq('assignment_id', practiceAssignment.id)
            .eq('student_id', user.id)
            .in('status', ['completed', 'pending', 'graded', 'awaiting_review'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (submissionError) {
            console.error('Error checking submissions:', submissionError);
            // Continue with normal flow if we can't check submissions
          } else if (submissions && submissions.length > 0) {
            // There's a completed submission, redirect to feedback
            console.log('Found completed submission, redirecting to feedback:', submissions[0].id);
            navigate(`/student/submission/${submissions[0].id}/feedback`);
            return;
          }

          // Check for existing practice sessions and redirect based on status
          console.log('Checking for existing practice sessions for user:', user.id);
          
          const { data: practiceSessions, error: practiceSessionError } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['transcript_processing', 'transcript_ready', 'practicing_sentences', 'practicing_words', 'practicing_full_transcript', 'completed', 'failed', 'abandoned', 'start_practice'])
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('Active practice sessions query result:', { practiceSessions, practiceSessionError });

          if (practiceSessionError) {
            console.error('Error checking practice sessions:', practiceSessionError);
            // Continue with normal flow if we can't check practice sessions
          } else if (practiceSessions && practiceSessions.length > 0) {
            const session = practiceSessions[0];
            console.log('Found active practice session with status:', session.status);
            
            // Load session into Redux state
            dispatch(setSession(session));
            
            // Navigate based on session status - all states go to practice feedback page
            switch (session.status) {
              case 'completed':
                console.log('Session completed, showing on feedback page');
                navigate(`/student/practice-feedback?session=${session.id}`);
                break;
              case 'transcript_processing':
              case 'transcript_ready':
              case 'practicing_sentences':
              case 'practicing_words':
              case 'practicing_full_transcript':
              case 'failed':
              case 'abandoned':
                console.log('Session in progress or needs attention, redirecting to feedback page');
                navigate(`/student/practice-feedback?session=${session.id}`);
                break;
              default:
                console.log('Unknown session status, continuing with normal flow');
                break;
            }
            return;
          } else {
            console.log('No active practice sessions found, continuing with normal flow');
          }
          
          // No completed submission, continue with practice
          setPracticeAssignmentId(practiceAssignment.id);
          setLoading(false);
          setupInProgress.current = false;
          return;
        }

        console.log('No existing practice assignment found, creating new one');

        // Create practice class first (if it doesn't exist)
        let practiceClassId: string;
        
        const { data: existingClass, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('name', 'Practice Class')
          .eq('teacher_id', user.id)
          .maybeSingle();

        if (classError && classError.code !== 'PGRST116') {
          throw classError;
        }

        if (existingClass) {
          practiceClassId = existingClass.id;
        } else {
          // Create practice class
          const { data: newClass, error: createClassError } = await supabase
            .from('classes')
            .insert({
              name: 'Practice Class',
              class_code: 'PRACTICE-' + Math.random().toString(36).substr(2, 9),
              teacher_id: user.id
            })
            .select('id')
            .single();

          if (createClassError) throw createClassError;
          practiceClassId = newClass.id;
        }

        // Create practice assignment
        const { data: newAssignment, error: createError } = await supabase
          .from('assignments')
          .insert({
            class_id: practiceClassId,
            created_by: user.id,
            title: 'IELTS Speaking Practice',
            topic: 'Speaking Practice',
            due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            questions: practiceQuestions,
            metadata: {
              autoGrade: true,
              isTest: false,
              audioOnlyMode: false,
              isPractice: true
            },
            status: 'not_started'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        
        console.log('Created new practice assignment:', newAssignment.id);
        setPracticeAssignmentId(newAssignment.id);

      } catch (err) {
        console.error('Error setting up practice assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup practice assignment');
      } finally {
        setLoading(false);
        setupInProgress.current = false;
      }
    };

    setupPracticeAssignment();
  }, [user, dispatch, currentSession, navigate, practiceQuestions]);

  // Handle session state changes from Redux
  useEffect(() => {
    if (currentSession && !setupInProgress.current) {
      console.log('Redux session state changed:', currentSession.status);
      
      // Navigate based on current session status - all states go to practice feedback page
      switch (currentSession.status) {
        case 'completed':
          console.log('Session completed via Redux, showing on feedback page');
          navigate(`/student/practice-feedback?session=${currentSession.id}`);
          break;
        case 'transcript_processing':
        case 'transcript_ready':
        case 'practicing_sentences':
        case 'practicing_words':
        case 'practicing_full_transcript':
        case 'failed':
        case 'abandoned':
          console.log('Session in progress via Redux, redirecting to feedback page');
          navigate(`/student/practice-feedback?session=${currentSession.id}`);
          break;
        default:
          console.log('Unknown session status from Redux');
          break;
      }
    }
  }, [currentSession, navigate]);

  // Navigate to the real assignment once it's created
  useEffect(() => {
    if (practiceAssignmentId) {
      navigate(`/student/assignment/${practiceAssignmentId}/practice`);
    }
  }, [practiceAssignmentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!practiceAssignmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Practice assignment not available</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // This component just handles the setup, then redirects
  return null;
};

export default GeneralPractice; 