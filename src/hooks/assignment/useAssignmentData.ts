import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { Assignment, QuestionCard } from '@/features/assignments/types';

interface ExtendedQuestionCard extends QuestionCard {
  isCompleted?: boolean;
}

interface ExtendedAssignment extends Omit<Assignment, 'questions'> {
  questions: ExtendedQuestionCard[];
}

interface PreviewData {
  title: string;
  due_date: string;
  questions: QuestionCard[];
  id: string;
  class_id?: string;
  created_at?: string;
  metadata?: any;
  status?: any;
}

interface UseAssignmentDataProps {
  id?: string;
  previewMode?: boolean;
  previewData?: PreviewData;
}

export const useAssignmentData = ({ id, previewMode, previewData }: UseAssignmentDataProps) => {
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const practiceProgress = useAppSelector(state => 
    id ? state.assignments.practiceProgress[id] : undefined
  );

  useEffect(() => {
    const loadAssignment = async () => {
      setLoading(true);
      setError(null);

      try {
        if (previewMode && previewData) {
          const extendedAssignment: ExtendedAssignment = {
            ...previewData,
            class_id: previewData.class_id || 'preview',
            created_at: previewData.created_at || new Date().toISOString(),
            metadata: previewData.metadata || {},
            status: previewData.status || 'not_started',
            questions: previewData.questions.map((q: QuestionCard) => ({ 
              ...q, 
              isCompleted: false 
            }))
          };
          setAssignment(extendedAssignment);
        } else if (id) {
          const result = await dispatch(fetchAssignmentById(id)).unwrap();
          const extendedAssignment: ExtendedAssignment = {
            ...result,
            questions: result.questions.map((q: QuestionCard) => ({ 
              ...q, 
              isCompleted: practiceProgress?.completedQuestions?.includes(q.id) || false 
            }))
          };
          setAssignment(extendedAssignment);
        }
      } catch (err) {
        setError('Failed to load assignment. Please check your internet connection and try again.');
        console.error('Failed to load assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id, dispatch, previewMode, previewData]);

  const markQuestionCompleted = useCallback((questionIndex: number) => {
    setAssignment(prev => {
      if (!prev) return null;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        isCompleted: true
      };
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  return {
    assignment,
    loading,
    error,
    markQuestionCompleted
  };
};