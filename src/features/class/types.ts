export interface Class {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassDto {
  name: string;
  teacher_id: string; 
}

export interface ClassState {
  classes: Class[];
  loading: boolean;
  error: string | null;
} 