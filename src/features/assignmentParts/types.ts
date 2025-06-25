import { QuestionCard } from '@/features/assignments/types';

export type PartType = 'part1' | 'part2_3' | 'part2_only' | 'part3_only';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AssignmentPart {
  id: string;
  title: string;
  description?: string;
  part_type: PartType;
  topic?: string;
  difficulty_level?: DifficultyLevel;
  questions: QuestionCard[];
  metadata: {
    autoGrade?: boolean;
    isTest?: boolean;
    estimatedTime?: string;
    [key: string]: unknown;
  };
  created_by: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PartCombination {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  part2_id: string;
  part3_id: string;
  created_by: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  // Joined data
  part2?: AssignmentPart;
  part3?: AssignmentPart;
}

export interface CreateAssignmentPartDto {
  title: string;
  description?: string;
  part_type: PartType;
  topic?: string;
  difficulty_level?: DifficultyLevel;
  questions: QuestionCard[];
  metadata?: {
    autoGrade?: boolean;
    isTest?: boolean;
    estimatedTime?: string;
    [key: string]: unknown;
  };
  is_public?: boolean;
}

export interface CreatePartCombinationDto {
  title: string;
  description?: string;
  topic?: string;
  part2_id: string;
  part3_id: string;
  is_public?: boolean;
}

export interface AssignmentPartsState {
  parts: AssignmentPart[];
  combinations: PartCombination[];
  loading: boolean;
  error: string | null;
  createPartLoading: boolean;
  createCombinationLoading: boolean;
  selectedTopic?: string;
  selectedPartType?: PartType;
  selectedDifficulty?: DifficultyLevel;
}

export interface PartFilterOptions {
  topic?: string;
  part_type?: PartType;
  difficulty_level?: DifficultyLevel;
  is_public?: boolean;
  created_by?: string;
}

export interface BuilderAssignment {
  id: string;
  title: string;
  due_date: string;
  parts: (AssignmentPart | PartCombination)[];
  metadata: {
    autoGrade: boolean;
    isTest: boolean;
    [key: string]: unknown;
  };
} 