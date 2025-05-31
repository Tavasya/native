export interface AssignmentTemplate {
  id: string;
  teacher_id: string;
  title: string;
  topic?: string;
  questions: any[]; // or your QuestionCard type
  metadata?: any;
  created_at: string;
}

export interface CreateAssignmentTemplateDto {
  teacher_id: string;
  title: string;
  topic?: string;
  questions: any[];
  metadata?: any;
} 