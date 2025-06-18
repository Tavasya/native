import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, OnboardingData } from '@/features/auth/types';
import { validateStudentForm, validateTeacherForm } from '@/utils/onboardingValidation';

interface UseOnboardingOptions {
  initialRole?: UserRole;
  initialData?: OnboardingData;
}

export function useOnboarding({ initialRole, initialData }: UseOnboardingOptions = {}) {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(initialRole || null);
  const [formData, setFormData] = useState<OnboardingData>(initialData || {});
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate form based on role
  const validate = (): string | null => {
    if (role === 'student') {
      return validateStudentForm(formData);
    } else if (role === 'teacher') {
      return validateTeacherForm(formData);
    }
    return 'Role is required.';
  };

  // Handle form field changes
  const handleChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle teacher metadata changes
  const handleTeacherMetadataChange = (field: keyof NonNullable<OnboardingData['teacherMetadata']>, value: any) => {
    setFormData(prev => ({
      ...prev,
      teacherMetadata: {
        ...prev.teacherMetadata,
        [field]: value,
      },
    }));
  };

  // Go to next step
  const nextStep = () => setStep(s => s + 1);
  // Go to previous step
  const prevStep = () => setStep(s => (s > 1 ? s - 1 : 1));

  // Submit handler (to be used in onboarding page)
  const handleSubmit = async (onSubmit: (data: OnboardingData) => Promise<void>) => {
    setError(null);
    setLoading(true);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const goToDashboard = (roleOverride?: UserRole) => {
    if (roleOverride) {
      navigate(`/${roleOverride}/dashboard`);
    } else if (role) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return {
    role,
    setRole,
    formData,
    setFormData,
    handleChange,
    handleTeacherMetadataChange,
    step,
    setStep,
    nextStep,
    prevStep,
    error,
    setError,
    loading,
    validate,
    handleSubmit,
    goToDashboard,
  };
}
