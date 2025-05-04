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
