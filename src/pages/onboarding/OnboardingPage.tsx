import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingData } from '@/features/auth/types';
import { validateOnboardingData } from '@/utils/profileValidation';
import NativeLogo from '@/lib/images/Native Logo.png';

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAppSelector(state => state.auth);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    role: 'student',
    phone_number: '',
    date_of_birth: '',
    agreed_to_terms: false,
    teacherMetadata: {
      active_student_count: undefined,
      avg_tuition_per_student: undefined,
      referral_source: ''
    }
  });
  const [error, setError] = useState('');

  // ✅ ONLY check if user is authenticated (RequireAuth handles profile completion)
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const validation = validateOnboardingData(formData);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    // Debug logging
    console.log('Submitting onboarding data:', formData);

    const result = await dispatch(completeOnboarding(formData));
    
    if (completeOnboarding.fulfilled.match(result)) {
      // ✅ After successful onboarding, redirect to their dashboard
      const { profile: updatedProfile } = result.payload;
      console.log('Onboarding successful, redirecting to:', updatedProfile.role);
      navigate(`/${updatedProfile.role}/dashboard`);
    } else if (completeOnboarding.rejected.match(result)) {
      console.error('Onboarding failed:', result.payload);
      setError(result.payload as string);
    }
  };

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // ✅ No redundant profile completion check here
  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900">Complete Your Profile</h2>
            <p className="mt-2 text-gray-600">
              Welcome {user.name}! Let's set up your account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <Label className="text-sm text-gray-600 mb-4 block">I am a...</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ role: 'student' })}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        formData.role === 'student'
                          ? 'border-[#272A69] bg-[#272A69] text-white'
                          : 'border-gray-200 hover:border-[#272A69]'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ role: 'teacher' })}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        formData.role === 'teacher'
                          ? 'border-[#272A69] bg-[#272A69] text-white'
                          : 'border-gray-200 hover:border-[#272A69]'
                      }`}
                    >
                      Teacher
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
                >
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {formData.role === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => updateFormData({ phone_number: e.target.value })}
                        required
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {formData.role === 'teacher' && (
                  <>
                    <div>
                      <Label htmlFor="students">Number of Active Students</Label>
                      <Select
                        value={formData.teacherMetadata?.active_student_count?.toString()}
                        onValueChange={(value) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            active_student_count: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of students" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">1-10 students</SelectItem>
                          <SelectItem value="30">11-30 students</SelectItem>
                          <SelectItem value="50">31-50 students</SelectItem>
                          <SelectItem value="100">51-100 students</SelectItem>
                          <SelectItem value="200">101-200 students</SelectItem>
                          <SelectItem value="500">200+ students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tuition">Average Monthly Tuition per Student</Label>
                      <Select
                        value={formData.teacherMetadata?.avg_tuition_per_student?.toString()}
                        onValueChange={(value) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            avg_tuition_per_student: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tuition range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="800000">Under $30 (&lt; 800k VND)</SelectItem>
                          <SelectItem value="1500000">$30-$55 (800k-1.5mil VND)</SelectItem>
                          <SelectItem value="2000000">$56-$77 (1.5mil-2mil VND)</SelectItem>
                          <SelectItem value="3000000">$78-$115 (2mil-3mil VND)</SelectItem>
                          <SelectItem value="5000000">$115+ (3+ mil VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="referral">How did you hear about us?</Label>
                      <Input
                        id="referral"
                        type="text"
                        value={formData.teacherMetadata?.referral_source}
                        onChange={(e) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            referral_source: e.target.value
                          }
                        })}
                        placeholder="e.g. Google, Friend, etc."
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={formData.agreed_to_terms}
                    onChange={(e) => updateFormData({ agreed_to_terms: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a href="/legal/terms-and-conditions" className="text-[#272A69] underline" target="_blank">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/legal/privacy-policy" className="text-[#272A69] underline" target="_blank">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#272A69] hover:bg-[#272A69]/90"
                  >
                    {loading ? 'Completing...' : 'Complete Setup'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 