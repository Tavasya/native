export type QuestionType = 'cueCard' | 'regular';

export interface Question {
  id: number;
  type: QuestionType;
  content: string;
  instructions?: string[];
  isCompleted: boolean;
  estimatedTime: string;
  audioUrl?: string;
}

// Assignment type
export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalQuestions: number;
  questions: Question[];
  instructions?: string[];
  estimatedTime?: string;
}