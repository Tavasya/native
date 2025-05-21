import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { updatePracticeProgress } from '@/features/assignments/assignmentSlice';
import { Assignment, QuestionCard } from '@/features/assignments/types';
import QuestionContent from '@/components/assignment/QuestionContent';
import QuestionNavigation from '@/components/assignment/QuestionNavigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ExtendedQuestionCard extends QuestionCard {
  isCompleted?: boolean;
}

interface ExtendedAssignment extends Omit<Assignment, 'questions'> {
  questions: ExtendedQuestionCard[];
}

const AssignmentPractice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const practiceProgress = useAppSelector(state => 
    id ? state.assignments.practiceProgress[id] : undefined
  );

  useEffect(() => {
    const loadAssignment = async () => {
      if (id) {
        try {
          const result = await dispatch(fetchAssignmentById(id)).unwrap();
          console.log('Assignment data:', result);
          console.log('Questions data:', result.questions);
          const extendedAssignment: ExtendedAssignment = {
            ...result,
            questions: result.questions.map((q: QuestionCard) => ({ 
              ...q, 
              isCompleted: practiceProgress?.completedQuestions?.includes(q.id) || false 
            }))
          };
          setAssignment(extendedAssignment);
          
          if (practiceProgress) {
            setCurrentQuestionIndex(practiceProgress.currentQuestionIndex);
          }
        } catch (error) {
          console.error('Failed to load assignment:', error);
        }
      }
    };

    loadAssignment();
  }, [id, dispatch]);

  useEffect(() => {
    if (assignment && id && !isCompleted) {
      dispatch(updatePracticeProgress({
        assignmentId: id,
        currentQuestionIndex,
        completedQuestions: assignment.questions
          .filter(q => q.isCompleted)
          .map(q => q.id)
      }));
    }
  }, [assignment, currentQuestionIndex, id, dispatch, isCompleted]);

  useEffect(() => {
    if (assignment) {
      const currentQuestion = assignment.questions[currentQuestionIndex];
      setTimeRemaining(Number(currentQuestion.timeLimit) * 60 || 0);
      setHasRecorded(false);
      setIsRecording(false);
      setIsPlaying(false);
    }
  }, [currentQuestionIndex, assignment]);

  useEffect(() => {
    if (timeRemaining > 0 && isRecording) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
    } else {
      setIsRecording(true);
      setHasRecorded(false);
    }
  };

  const playRecording = () => {
    setIsPlaying(true);
    // Implement actual recording playback logic here
    setTimeout(() => setIsPlaying(false), 2000); // Placeholder for actual playback duration
  };

  const completeQuestion = () => {
    if (!assignment) return;

    setAssignment(prev => {
      if (!prev) return null;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        isCompleted: true
      };
      return { ...prev, questions: updatedQuestions };
    });

    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!assignment) {
    return <div>Loading...</div>;
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Assignment Completed!</h1>
          <p className="text-gray-600 mb-6">You have completed all questions in this assignment.</p>
          <Button onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div>
            <QuestionContent
              currentQuestion={currentQuestion}
              totalQuestions={assignment.questions.length}
              timeRemaining={timeRemaining}
              isRecording={isRecording}
              hasRecorded={hasRecorded}
              isPlaying={isPlaying}
              isLastQuestion={currentQuestionIndex === assignment.questions.length - 1}
              toggleRecording={toggleRecording}
              playRecording={playRecording}
              completeQuestion={completeQuestion}
              formatTime={formatTime}
              assignmentTitle={assignment.title}
              dueDate={new Date(assignment.due_date).toLocaleDateString()}
              currentQuestionIndex={currentQuestionIndex}
            />
          </div>
          <div className="mt-4">
            <QuestionNavigation
              questions={assignment.questions}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionSelect={setCurrentQuestionIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPractice;
