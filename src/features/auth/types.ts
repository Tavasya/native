// src/features/auth/types.ts
export type UserRole = 'teacher' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user:   AuthUser | null;
  role:   UserRole | null;
  loading: boolean;
  error:  string | null;
}