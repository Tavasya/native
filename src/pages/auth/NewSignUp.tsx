import React, { useState, useEffect, useRef } from 'react';
import { signUpWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { clearAuth } from '@/features/auth/authSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from '@/features/auth/types';
import NativeLogo from '@/lib/images/Native Logo.png';
import { supabase } from '@/integrations/supabase/client';
import { verifyEmail } from '@/features/auth/authThunks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Modal Components ---
function Modal({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 text-sm text-gray-700 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function StudentSignUpAgreementModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal open={open} onClose={onClose} title="Student Sign-Up Agreement">
      <div className="space-y-6 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-[#272A69] text-base mb-3">
            By continuing, I confirm the following:
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I have been given a <strong>Class Code by my teacher</strong> to join Native.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              If I am <strong>under 18 years old</strong>, my teacher has received permission from my parent or legal guardian to let me use Native.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I understand that my <strong>recordings and feedback will only be shared with my teacher</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I agree to Native's{' '}
              <button 
                onClick={() => handleLinkClick('/legal/privacy-policy')}
                className="text-[#272A69] underline hover:text-[#272A69]/80 font-medium"
              >
                Privacy Policy
              </button>{' '}
              and{' '}
              <button 
                onClick={() => handleLinkClick('/legal/terms-and-conditions')}
                className="text-[#272A69] underline hover:text-[#272A69]/80 font-medium"
              >
                Terms of Service
              </button>.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <p className="text-xs text-gray-600 text-center">
            If you have questions, ask your teacher or contact:{' '}
            <a href="mailto:support@nativespeaking.ai" className="text-[#272A69] underline">
              support@nativespeaking.ai
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
function TeacherSignUpAgreementModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal open={open} onClose={onClose} title="Teacher Sign-Up Agreement">
      <div className="space-y-6 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-[#272A69] text-base mb-3">
            By signing up for a Teacher account on Native, I confirm the following:
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I am <strong>18 years or older</strong> and legally eligible to use this service.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
                             I have read and agree to Native's{' '}
               <button 
                 onClick={() => handleLinkClick('/legal/terms-and-conditions')}
                 className="text-[#272A69] underline hover:text-[#272A69]/80 font-medium"
               >
                 Terms and Conditions
               </button>{' '}
               and{' '}
               <button 
                 onClick={() => handleLinkClick('/legal/privacy-policy')}
                 className="text-[#272A69] underline hover:text-[#272A69]/80 font-medium"
               >
                 Privacy Policy
               </button>.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I understand that Native is designed for <strong>supervised student use</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I agree that if I assign Native to any student under the age of 18, I will first obtain <strong>verifiable consent</strong> from that student's parent or legal guardian.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I take full responsibility for ensuring student data is submitted in compliance with applicable laws, including <strong>COPPA, FERPA, and CCPA</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I acknowledge that AI model training is conducted using <strong>anonymized data only</strong>, and that Native does not associate student names or identities with the training process.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#272A69] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              I'm responsible for <strong>communicating this clearly to guardians</strong>.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">
              <strong>Failure to comply</strong> with these obligations may result in data removal or suspension of my account.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <p className="text-xs text-gray-600 text-center">
            By checking the agreement box, you acknowledge that you have read, understood, and agree to all the terms above.
          </p>
        </div>
      </div>
    </Modal>
  );
}


export default function NewSignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error: authError, user, role } = useAppSelector(state => state.auth);
  const location = useLocation();
  const debugMode = location.search.includes('debug=1');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [error, setError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const pollCountRef = useRef(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout>();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  // Student fields
  const [studentPhone, setStudentPhone] = useState('');
  const [studentDOB, setStudentDOB] = useState('');
  const [studentAgreementChecked, setStudentAgreementChecked] = useState(false);
  // Teacher fields
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherActiveStudents, setTeacherActiveStudents] = useState('');
  const [teacherAvgTuition, setTeacherAvgTuition] = useState('');
  const [teacherReferralSource, setTeacherReferralSource] = useState('');
  const [teacherAgreementChecked, setTeacherAgreementChecked] = useState(false);
  // Modal state
  const [showStudentAgreement, setShowStudentAgreement] = useState(false);
  const [showTeacherAgreement, setShowTeacherAgreement] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Only clear session if there's no user in Redux state
    const clearExistingSession = async () => {
      if (!user) {
        try {
          await supabase.auth.signOut();
          dispatch(clearAuth());
        } catch (err) {
          console.error('Error clearing session:', err);
        }
      }
    };
    clearExistingSession();
  }, [dispatch, user]);

  useEffect(() => {
    if (user && role && user.email_verified) {
      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/join-class');
      }
    }
  }, [user, role, navigate]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldown(30);
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkVerificationStatus = async () => {
    if (!signupSuccess || verificationChecked) {
      return;
    }

    try {
      // First try to get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

      let currentSession = session;
      
      // If no session, try to sign in again
      if (!currentSession?.user) {
        // Try to sign in with the stored credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          return;
        }

        if (!signInData.session) {
          return;
        }

        currentSession = signInData.session;
      }

      // Get user profile using the session's user ID
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }

      if (!profile) {
        return;
      }

      // Check if the user is actually verified in auth
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth user fetch error:', authError);
        return;
      }

      // Strict verification check - both conditions must be true
      const isVerified = profile.email_verified && authUser?.user?.email_confirmed_at;
      
      if (!isVerified) {
        return;
      }

      setVerificationChecked(true);
      
      // Update Redux state
      dispatch(verifyEmail({
        email: currentSession.user.email || '',
        token: currentSession.access_token
      }));

      // Navigate based on role
      if (profile.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/join-class');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  // Add polling for verification status with progressive intervals
  useEffect(() => {
    if (!signupSuccess || verificationChecked) {
      return;
    }

    const startPolling = () => {
      if (pollCountRef.current >= 12) {
        return;
      }

      checkVerificationStatus();
      pollCountRef.current += 1;
      
      // Calculate next interval based on poll count
      const interval = pollCountRef.current < 4 
        ? 2000  // First 4 polls: 2 seconds
        : pollCountRef.current < 8 
          ? 3000  // Next 4 polls: 3 seconds
          : 4000; // After that: 4 seconds

      // Clear any existing intervals/timeouts
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      // Set timeout for next poll
      pollTimeoutRef.current = setTimeout(() => {
        pollIntervalRef.current = setInterval(startPolling, interval);
      }, interval);
    };

    // Start initial poll
    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [signupSuccess, verificationChecked, dispatch, navigate, email, password]);

  // Add a button to manually check verification
  const handleManualCheck = async () => {
    setVerificationChecked(false);
    pollCountRef.current = 0;
    await checkVerificationStatus();
  };

  // Validation functions
  function validateStudent() {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!studentPhone.trim()) return 'Phone number is required.';
    if (!studentDOB.trim()) return 'Date of birth is required.';
    if (!studentAgreementChecked) return 'You must agree to the Student Sign-Up Agreement.';
    return '';
  }
  function validateTeacher() {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!teacherPhone.trim()) return 'Phone number is required.';
    if (!teacherActiveStudents.trim()) return 'Number of active students is required.';
    if (!teacherAvgTuition.trim()) return 'Average tuition per student is required.';
    if (!teacherAgreementChecked) return 'You must agree to the Teacher Sign-Up Agreement.';
    return '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Final validation
    let errorMsg = '';
    if (selectedRole === 'student') errorMsg = validateStudent();
    else errorMsg = validateTeacher();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    // Clear any existing session before signup
    try {
      await supabase.auth.signOut();
      dispatch(clearAuth());
    } catch (err) {
      console.error('Error clearing session before signup:', err);
    }

    // Create the auth account
    const result = await dispatch(signUpWithEmail({ 
      email, 
      password, 
      name,
      role: selectedRole,
      agreed_to_terms: selectedRole === 'teacher' ? teacherAgreementChecked : studentAgreementChecked,
      ...(selectedRole === 'student' && {
        phone_number: studentPhone,
        date_of_birth: studentDOB
      }),
      ...(selectedRole === 'teacher' && {
        phone_number: teacherPhone,
        teacherMetadata: {
          active_student_count: parseInt(teacherActiveStudents.split('-')[0]) || null,
          avg_tuition_per_student: parseInt(teacherAvgTuition.split('-')[0]) || null,
          referral_source: teacherReferralSource
        }
      })
    }));
    
    if (signUpWithEmail.rejected.match(result)) {
      const errorMessage = result.payload as string;
      // Map common error messages to user-friendly versions
      const friendlyError = errorMessage.includes('already registered and verified')
        ? 'This email is already registered and verified. Please try logging in instead.'
        : errorMessage.includes('already registered but not verified')
        ? 'This email is already registered but not verified. We have resent the verification email. Please check your inbox.'
        : errorMessage.includes('password')
        ? 'Password must be at least 6 characters long'
        : errorMessage.includes('email')
        ? 'Please enter a valid email address'
        : errorMessage.includes('security purposes')
        ? 'Please wait a minute before trying again. This helps us protect your account.'
        : 'Failed to create account. Please try again.';
      
      dispatch(clearAuth());
      setError(friendlyError);

      // If the error is about resending verification, show the verification success screen
      if (errorMessage.includes('already registered but not verified')) {
        setSignupSuccess(true);
      }
    } else if (signUpWithEmail.fulfilled.match(result)) {
      setSignupSuccess(true);
      setVerificationChecked(false);
      pollCountRef.current = 0;
    }
  };

  const handleResendVerification = async () => {
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting another verification email.`);
      return;
    }

    if (resendCount >= 3) {
      setError('You have reached the maximum number of verification email requests. Please try again later.');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        setError('Failed to resend verification email. Please try again.');
        return;
      }

      // Increment resend count and start cooldown
      setResendCount(prev => prev + 1);
      startCooldown();
      
      // Show success message
      setError('');
      setSignupSuccess(true);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Failed to resend verification email. Please try again.');
    }
  };

  const handleNextStep = () => {
    setValidationError('');
    setCurrentStep(2);
  };

  const handleBackStep = () => {
    setCurrentStep(1);
    setValidationError('');
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Check Your Email</h2>
              <p className="mt-2 text-gray-600">
                We've sent a verification link to {email}. Please check your email and click the link to verify your account.
              </p>
              <div className="mt-6 space-y-4">
                <Button
                  onClick={handleManualCheck}
                  className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
                >
                  Already verified? Click here
                </Button>
                <p className="text-sm text-gray-500">
                  Didn't receive the email?{' '}
                  <button
                    onClick={handleResendVerification}
                    disabled={cooldown > 0 || resendCount >= 3}
                    className={`text-[#272A69] hover:text-[#272A69]/90 font-medium ${
                      (cooldown > 0 || resendCount >= 3) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {cooldown > 0 
                      ? `Resend verification email (${cooldown}s)`
                      : resendCount >= 3
                      ? 'Maximum retries reached'
                      : 'Resend verification email'}
                  </button>
                  {' '}or{' '}
                  <button
                    onClick={() => setSignupSuccess(false)}
                    className="text-[#272A69] hover:text-[#272A69]/90 font-medium"
                  >
                    try again
                  </button>
                </p>
                {resendCount > 0 && (
                  <p className="text-sm text-gray-500">
                    {resendCount}/3 verification emails sent
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
          </div>

          {/* Debug Panel */}
          {debugMode && (
            <div className="mb-4 p-4 text-xs bg-gray-100 border border-gray-300 rounded-lg">
              <div className="font-bold mb-2">[DEBUG PANEL]</div>
              <div className="mb-1">Current Step: {currentStep}</div>
              <div className="mb-1">Current Role: {selectedRole}</div>
              <div className="mb-1">Current Form State: <pre>{JSON.stringify({
                name, email, studentPhone, studentDOB, studentAgreementChecked,
                teacherPhone, teacherActiveStudents, teacherAvgTuition, teacherReferralSource, teacherAgreementChecked
              }, null, 2)}</pre></div>
              <div className="mb-1">Last Validation Error: {validationError || '(none)'}</div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {validationError}
            </div>
          )}

          {(error || authError) && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error || authError}
              {error?.includes('already registered') && (
                <div className="mt-2">
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="w-full mt-2 text-[#272A69] border-[#272A69] hover:bg-[#272A69] hover:text-white"
                  >
                    Go to Login
                  </Button>
                </div>
              )}
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={e => {
                    setPassword(e.target.value);
                    dispatch(clearAuth());
                  }}
                  required
                  className={`w-full ${!password && validationError ? 'border-red-500' : ''}`}
                />
              </div>

              {/* Student Fields */}
              {selectedRole === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="student-phone" className="flex items-center">
                      Phone Number <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="student-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={studentPhone}
                      onChange={e => {
                        setStudentPhone(e.target.value);
                      }}
                      className={`w-full ${!studentPhone && validationError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-dob" className="flex items-center">
                      Date of Birth <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="student-dob"
                      type="date"
                      value={studentDOB}
                      onChange={e => {
                        setStudentDOB(e.target.value);
                      }}
                      className={`w-full ${!studentDOB && validationError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="student-agreement"
                      type="checkbox"
                      checked={studentAgreementChecked}
                      onChange={e => {
                        setStudentAgreementChecked(e.target.checked);
                      }}
                      className={!studentAgreementChecked && validationError ? 'border-red-500' : ''}
                    />
                    <Label htmlFor="student-agreement" className="text-sm flex items-center">
                      I agree to the{' '}
                      <button 
                        type="button" 
                        onClick={() => setShowStudentAgreement(true)}
                        className="text-[#272A69] hover:text-[#272A69]/90 underline ml-1"
                      >
                        Student Sign-Up Agreement
                      </button>
                    </Label>
                  </div>
                </>
              )}

              {/* Teacher Fields */}
              {selectedRole === 'teacher' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-phone" className="flex items-center">
                      Phone Number <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="teacher-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={teacherPhone}
                      onChange={e => {
                        setTeacherPhone(e.target.value);
                      }}
                      required
                      className={`w-full ${!teacherPhone && validationError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-active-students" className="flex items-center">
                      # of Active Students <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={teacherActiveStudents}
                      onValueChange={(value) => {
                        setTeacherActiveStudents(value);
                      }}
                    >
                      <SelectTrigger className={`w-full ${!teacherActiveStudents && validationError ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select number of students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 students</SelectItem>
                        <SelectItem value="11-30">11-30 students</SelectItem>
                        <SelectItem value="31-50">31-50 students</SelectItem>
                        <SelectItem value="51-100">51-100 students</SelectItem>
                        <SelectItem value="101-200">101-200 students</SelectItem>
                        <SelectItem value="200+">More than 200 students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-avg-tuition" className="flex items-center">
                      Average Monthly Tuition Fee per Student <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={teacherAvgTuition}
                      onValueChange={(value) => {
                        setTeacherAvgTuition(value);
                      }}
                    >
                      <SelectTrigger className={`w-full ${!teacherAvgTuition && validationError ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select tuition range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="800000">Under $30 (&lt; 800k VND)</SelectItem>
                        <SelectItem value="800000-1500000">$30 - $55 (800k - 1.5mil VND)</SelectItem>
                        <SelectItem value="1500000-2000000">$56 - $77 (1.5mil - 2mil VND)</SelectItem>
                        <SelectItem value="2000000-3000000">$78 - $115 (2mil - 3mil VND)</SelectItem>
                        <SelectItem value="3000000+">$115+ (3+ mil VND)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-referral">
                      Where did you hear from us?
                    </Label>
                    <Input
                      id="teacher-referral"
                      type="text"
                      placeholder="e.g. Google, Friend, etc."
                      value={teacherReferralSource}
                      onChange={e => {
                        setTeacherReferralSource(e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="teacher-agreement"
                      type="checkbox"
                      checked={teacherAgreementChecked}
                      onChange={e => {
                        setTeacherAgreementChecked(e.target.checked);
                      }}
                      className={!teacherAgreementChecked && validationError ? 'border-red-500' : ''}
                    />
                    <Label htmlFor="teacher-agreement" className="text-sm flex items-center">
                      I agree to the{' '}
                      <button 
                        type="button" 
                        onClick={() => setShowTeacherAgreement(true)}
                        className="text-[#272A69] hover:text-[#272A69]/90 underline ml-1 cursor-pointer"
                      >
                        Teacher Sign-Up Agreement
                      </button>
                    </Label>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Modals */}
      <StudentSignUpAgreementModal open={showStudentAgreement} onClose={() => setShowStudentAgreement(false)} />
      <TeacherSignUpAgreementModal open={showTeacherAgreement} onClose={() => setShowTeacherAgreement(false)} />
    </div>
  );
} 