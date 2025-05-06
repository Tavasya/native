export interface Class {
  id: string;
  name: string;
  teacherId: string;
  class_code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassDto {
  name: string;
  teacher_id: string; 
  class_code: string;
}

export interface JoinClassDto {
  student_id: string;
  class_code: string
}

export interface ClassState {
  classes: Class[];
  classStats: ClassStats[];
  loading: boolean;
  error: string | null;
  createClassLoading: boolean;
  deletingClassId: string | null;
  statsLoading: boolean;  // Added this
  statsError: string | null;  // Added this
}

export interface ClassStats {
  id: string;
  name: string;
  class_code : string;
  teacher_id: string;
  student_count: number;
  assignment_count: number;
  avg_grade: number | null;
}
export interface CreateAssignmentDto {
  classId: string;
  title: string;
  description: string;
  template: string;
  dueDate: string;
  autoSendReport: boolean;
  questions: {
    id: string;
    type: 'normal' | 'bulletPoints';
    question: string;
    bulletPoints?: string[];
    speakAloud: boolean;
    timeLimit: string;
  }[];
}
