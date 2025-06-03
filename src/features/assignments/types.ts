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
    [key: string]: any;       // for future flags
  };
  status: AssignmentStatus;
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
    [key: string]: any;
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
}
