import { QuestionCard } from '@/features/assignments/types';

export interface AssignmentTemplate {
  id: string;
  teacher_id: string;
  title: string;
  topic?: string;
  questions: QuestionCard[];
  metadata?: { [key: string]: unknown };
  created_at: string;
}

export interface CreateAssignmentTemplateDto {
  teacher_id: string;
  title: string;
  topic?: string;
  questions: QuestionCard[];
  metadata?: { [key: string]: unknown };
} 