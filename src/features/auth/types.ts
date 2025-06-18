// src/features/auth/types.ts
export type UserRole = 'student' | 'teacher';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  email_verified: boolean;
}

export interface OnboardingData {
  phone_number?: string;
  date_of_birth?: string;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}

export interface GoogleAuthResponse {
  user: any;
  role: UserRole;
  authMethod: 'google';
}

export interface AuthState {
  user:   AuthUser | null;
  role:   UserRole | null;
  loading: boolean;
  error:  string | null;
  emailChangeInProgress: boolean;
  onboardingCompleted: boolean;
  tempRole: UserRole | null;
  authMethod: 'google' | 'email' | null;
}