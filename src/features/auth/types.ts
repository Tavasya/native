// src/features/auth/types.ts
export type UserRole = 'student' | 'teacher';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  email_verified: boolean;
}

export interface UserProfile {
  id: string;
  role: UserRole | null;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  profile_complete: boolean;
  auth_provider: 'email' | 'google';
  onboarding_completed_at?: string;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}

export interface AuthState {
  user:   AuthUser | null;
  profile: UserProfile | null;
  role:   UserRole | null;
  loading: boolean;
  error:  string | null;
  emailChangeInProgress: boolean;
}

export interface OnboardingData {
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}