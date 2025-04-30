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

export interface ClassState {
  classes: Class[];
  loading: boolean;
  error: string | null;
} 