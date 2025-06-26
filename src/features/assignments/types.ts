// src/features/assignments/types.ts

export type AssignmentStatus    = 'not_started' | 'in_progress' | 'completed';
export type SubmissionStatus    = 'not_started' | 'in_progress' | 'completed' | 'pending' | 'graded' | 'rejected' | 'awaiting_review';

export interface QuestionCard {
  id: string;
  type: 'normal' | 'bulletPoints';
  question: string;
  bulletPoints?: string[];
  speakAloud: boolean;
  timeLimit: string;          // in minutes, e.g. "5"
  prepTime?: string;          // in minutes, e.g. "2" - prep time for test mode
}

export interface Assignment {
  id: string;
  class_id: string;
  created_at: string;
  title: string;
  topic?: string;
  due_date: string;           // ISO timestamp
  questions: QuestionCard[];  // now an array of the above
  metadata: {
    autoGrade?: boolean;
    isTest?: boolean;
    [key: string]: unknown;       // for future flags
  };
  status: AssignmentStatus;
  view?: boolean;            // for hiding assignments
  // optionally injected by stats thunk:
  completionStats?: {
    submitted: number;
    inProgress: number;
    notStarted: number;
    totalStudents: number;
  };
}

export interface CreateAssignmentDto {
  class_id: string;
  created_by: string;
  title: string;
  topic?: string;
  due_date: string;           // ISO timestamp
  questions: QuestionCard[];
  metadata?: {
    autoGrade?: boolean;
    isTest?: boolean;
    [key: string]: unknown;
  };
  status?: AssignmentStatus;
}

export interface StudentSubmission {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  assignment_id: string;
  attempt: number;
  status: SubmissionStatus;
  submitted_at: string | null;
  grade: number | null;
  overall_grade: number | null;
  has_ever_completed?: boolean;
  total_attempts?: number;
  completed_attempts?: number;
  completed_submission_id?: string;
}

export interface AssignmentState {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  createAssignmentLoading: boolean;
  deletingAssignmentId: string | null;
  submissions: Record<string, StudentSubmission[]>;
  loadingSubmissions: boolean;
  classStats?: {
    avgGrade: number | null;
    completedAssignments: number;
    totalAssignments: number;
    studentCount: number;
  };
  practiceProgress: {
    [assignmentId: string]: {
      currentQuestionIndex: number;
      completedQuestions: string[];
    };
  };
  testMode: {
    hasGloballyStarted: {
      [assignmentId: string]: boolean;
    };
  };
}
