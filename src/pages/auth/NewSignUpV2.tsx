import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signUpWithEmail, signUpWithGoogle } from '@/features/auth/authThunks';
import { clearAuth } from '@/features/auth/authSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from '@/features/auth/types';
import NativeLogo from '@/lib/images/Native Logo.png';
import GoogleOAuthButton from '@/components/auth/GoogleOAuthButton';
import { supabase } from '@/integrations/supabase/client';

export default function NewSignUpV2() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error: authError } = useAppSelector(state => state.auth);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [basicAgreementChecked, setBasicAgreementChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(clearAuth());
  }, [dispatch]);

  // Handle Google OAuth signup
  const handleGoogleSignUp = async () => {
    setError('');
    console.log('Starting Google OAuth flow...');
    console.log('Selected role:', selectedRole);
    console.log('Current origin:', window.location.origin);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) {
        console.error('Supabase OAuth error:', error);
        setError(error.message);
        return;
      }
      console.log('OAuth initiated:', data);
      // The redirect will happen automatically
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err?.message || 'Google sign-up failed');
    }
  };

  // Handle email/password signup
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!basicAgreementChecked) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    try {
      const result = await dispatch(signUpWithEmail({ 
        email, 
        password, 
        name,
        role: selectedRole,
        agreed_to_terms: basicAgreementChecked
      }));
      
      if (signUpWithEmail.rejected.match(result)) {
        const errorMessage = result.payload as string;
        setError(errorMessage);
      } else if (signUpWithEmail.fulfilled.match(result)) {
        // Redirect to onboarding
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign-up failed');
    }
  };

  const handleNextStep = () => {
    setError('');
    setCurrentStep(2);
  };

  const handleBackStep = () => {
    setCurrentStep(1);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img 
              src={NativeLogo} 
              alt="Native" 
              className="h-12 mx-auto mb-6 cursor-pointer" 
              onClick={() => navigate('/landing-page')}
            />
          </div>

          {/* Error Display */}
          {(error || authError) && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error || authError}
            </div>
          )}

          {currentStep === 1 ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-sm text-gray-600">
                  I am a...
                </Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                      selectedRole === 'student'
                        ? 'border-[#272A69] bg-[#272A69] text-white'
                        : 'border-gray-200 hover:border-[#272A69]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">Student</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                      selectedRole === 'teacher'
                        ? 'border-[#272A69] bg-[#272A69] text-white'
                        : 'border-gray-200 hover:border-[#272A69]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">Teacher</span>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleNextStep}
                className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
              >
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="text-[#272A69] hover:text-[#272A69]/90"
                >
                  ← Back
                </button>
                <div className="text-sm text-gray-500">
                  Step 2 of 2
                </div>
              </div>

              {/* Google OAuth Button */}
              <div className="space-y-4">
                <GoogleOAuthButton
                  onClick={handleGoogleSignUp}
                  buttonText="Sign up with Google"
                  className="mb-4"
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                  </div>
                </div>
              </div>

              {/* Email/Password Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    Full Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    Email <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="basic-agreement"
                    type="checkbox"
                    checked={basicAgreementChecked}
                    onChange={(e) => setBasicAgreementChecked(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="basic-agreement" className="text-sm">
                    I agree to the{' '}
                    <a 
                      href="/legal/terms-and-conditions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#272A69] hover:text-[#272A69]/90 underline"
                    >
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a 
                      href="/legal/privacy-policy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#272A69] hover:text-[#272A69]/90 underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
