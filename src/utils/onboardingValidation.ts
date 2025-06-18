// Onboarding validation utilities

import { OnboardingData } from '@/features/auth/types';

// Helper: Validate phone number (simple international format)
export function validatePhoneNumber(phone?: string): string | null {
  if (!phone || phone.trim() === '') return 'Phone number is required.';
  // Basic regex for international phone numbers
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(phone.trim())) return 'Invalid phone number format.';
  return null;
}

// Helper: Validate date of birth (must be a valid date, and optionally age check)
export function validateDateOfBirth(dob?: string, role?: 'student' | 'teacher'): string | null {
  if (!dob) return 'Date of birth is required.';
  const date = new Date(dob);
  if (isNaN(date.getTime())) return 'Invalid date of birth.';
  // Age check for students (must be under 18 or have guardian consent)
  if (role === 'student') {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    if (age < 5) return 'You must be at least 5 years old.';
    if (age > 18) return 'If you are over 18, please sign up as a teacher.';
  }
  return null;
}

// Validate student onboarding form
export function validateStudentForm(data: OnboardingData): string | null {
  const phoneError = validatePhoneNumber(data.phone_number);
  if (phoneError) return phoneError;
  const dobError = validateDateOfBirth(data.date_of_birth, 'student');
  if (dobError) return dobError;
  // Add more student-specific validation as needed
  return null;
}

// Validate teacher onboarding form
export function validateTeacherForm(data: OnboardingData): string | null {
  const phoneError = validatePhoneNumber(data.phone_number);
  if (phoneError) return phoneError;
  if (!data.teacherMetadata) return 'Teacher metadata is required.';
  if (
    data.teacherMetadata.active_student_count === undefined ||
    data.teacherMetadata.active_student_count === null
  ) {
    return 'Number of active students is required.';
  }
  if (
    data.teacherMetadata.avg_tuition_per_student === undefined ||
    data.teacherMetadata.avg_tuition_per_student === null
  ) {
    return 'Average tuition per student is required.';
  }
  // Referral source is optional
  return null;
}
