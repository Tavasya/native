import { UserRole, UserProfile } from '@/features/auth/types';

/**
 * Check if a user's profile is complete based on their role
 */
export const isProfileComplete = (profile: UserProfile): boolean => {
  if (!profile.role || !profile.agreed_to_terms) return false;
  
  if (profile.role === 'student') {
    return !!(profile.phone_number && profile.date_of_birth);
  }
  
  return true; // Teacher just needs role and terms
};

/**
 * Get required fields for a specific role
 */
export const getRequiredFields = (role: UserRole): string[] => {
  const common = ['agreed_to_terms'];
  
  if (role === 'student') {
    return [...common, 'phone_number', 'date_of_birth'];
  }
  
  return common;
};

/**
 * Validate onboarding data before submission
 */
export const validateOnboardingData = (data: {
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.agreed_to_terms) {
    errors.push('You must agree to the terms and conditions');
  }

  if (data.role === 'student') {
    if (!data.phone_number) {
      errors.push('Phone number is required for students');
    }
    if (!data.date_of_birth) {
      errors.push('Date of birth is required for students');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 