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
import { savePartialStudentData, savePartialTeacherData } from '@/features/auth/authThunks';

// --- Modal Components ---
function Modal({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-6 text-sm text-gray-700">{children}</div>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
      </div>
    </div>
  );
}

function StudentPrivacyPolicyModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Student Privacy Policy">
      We collect your data to provide educational services. Your information will not be shared with third parties except as required by law.
    </Modal>
  );
}
function StudentTermsOfServiceModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Student Terms of Service">
      By using this platform, you agree to abide by all school and platform rules. Misuse may result in account suspension.
    </Modal>
  );
}
function TeacherPrivacyPolicyModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Teacher Privacy Policy">
      We collect your data to facilitate teaching and payment. Your information will not be shared with third parties except as required by law.
    </Modal>
  );
}
function TeacherTermsOfServiceModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Teacher Terms of Service">
      By using this platform, you agree to provide accurate information and conduct yourself professionally.
    </Modal>
  );
}

// Debounce utility
function debounce<F extends (...args: any[]) => void>(func: F, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
  const pollCountRef = useRef(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout>();
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  // Student fields
  const [studentPhone, setStudentPhone] = useState('');
  const [studentDOB, setStudentDOB] = useState('');
  const [studentPrivacyChecked, setStudentPrivacyChecked] = useState(false);
  const [studentTermsChecked, setStudentTermsChecked] = useState(false);
  // Teacher fields
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherActiveStudents, setTeacherActiveStudents] = useState('');
  const [teacherAvgTuition, setTeacherAvgTuition] = useState('');
  const [teacherReferralSource, setTeacherReferralSource] = useState('');
  const [teacherPrivacyChecked, setTeacherPrivacyChecked] = useState(false);
  const [teacherTermsChecked, setTeacherTermsChecked] = useState(false);
  // Modal state
  const [showStudentPrivacy, setShowStudentPrivacy] = useState(false);
  const [showStudentTerms, setShowStudentTerms] = useState(false);
  const [showTeacherPrivacy, setShowTeacherPrivacy] = useState(false);
  const [showTeacherTerms, setShowTeacherTerms] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [lastSavePayload, setLastSavePayload] = useState<any>(null);

  // Debounced save functions
  const debouncedSaveStudent = useRef(
    debounce((data) => {
      if (debugMode) {
        console.log('[DEBUG] savePartialStudentData payload:', data);
        setLastSavePayload(data);
      }
      dispatch(savePartialStudentData(data));
    }, 600)
  ).current;
  const debouncedSaveTeacher = useRef(
    debounce((data, meta) => {
      if (debugMode) {
        console.log('[DEBUG] savePartialTeacherData payload:', { user: data, meta });
        setLastSavePayload({ user: data, meta });
      }
      dispatch(savePartialTeacherData({ user: data, meta }));
    }, 600)
  ).current;

  // Student field handlers
  const handleStudentFieldChange = (field: string, value: any) => {
    const studentData = {
      name,
      email,
      phone_number: studentPhone,
      date_of_birth: studentDOB,
      agreed_to_terms: studentPrivacyChecked && studentTermsChecked,
      role: 'student',
    };
    debouncedSaveStudent({ ...studentData, [field]: value });
  };

  // Teacher field handlers
  const handleTeacherFieldChange = (field: string, value: any) => {
    const teacherData = {
      name,
      email,
      phone_number: teacherPhone,
      agreed_to_terms: teacherPrivacyChecked && teacherTermsChecked,
      role: 'teacher',
    };
    const teacherMeta = {
      active_student_count: teacherActiveStudents ? Number(teacherActiveStudents) : null,
      avg_tuition_per_student: teacherAvgTuition ? Number(teacherAvgTuition) : null,
      referral_source: teacherReferralSource,
    };
    if (["active_student_count", "avg_tuition_per_student", "referral_source"].includes(field)) {
      debouncedSaveTeacher(teacherData, { ...teacherMeta, [field]: value });
    } else {
      debouncedSaveTeacher({ ...teacherData, [field]: value }, teacherMeta);
    }
  };

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
      navigate(`/${role}/join-class`);
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
        console.log('No session found, attempting to sign in...');
        
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
          console.log('No session after sign in attempt');
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
        console.log('No profile found for user');
        return;
      }

      if (profile.email_verified) {
        console.log('Email verified, updating state...');
        setVerificationChecked(true);
        
        // Update Redux state
        dispatch(verifyEmail({
          email: currentSession.user.email || '',
          token: currentSession.access_token
        }));

        // Navigate instead of reloading
        navigate(`/${profile.role}/join-class`);
      } else {
        console.log('Email not yet verified');
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
        console.log('Max polls reached, stopping verification check');
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
    if (!studentPrivacyChecked) return 'You must agree to the Privacy Policy.';
    if (!studentTermsChecked) return 'You must agree to the Terms of Service.';
    return '';
  }
  function validateTeacher() {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!teacherPhone.trim()) return 'Phone number is required.';
    if (!teacherActiveStudents.trim()) return 'Number of active students is required.';
    if (!teacherAvgTuition.trim()) return 'Average tuition per student is required.';
    if (!teacherReferralSource.trim()) return 'Referral source is required.';
    if (!teacherPrivacyChecked) return 'You must agree to the Privacy Policy.';
    if (!teacherTermsChecked) return 'You must agree to the Terms of Service.';
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

    const result = await dispatch(signUpWithEmail({ 
      email, 
      password, 
      name,
      role: selectedRole 
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

  // Manual test save for debug panel
  const handleTestSave = () => {
    if (selectedRole === 'student') {
      const studentData = {
        name,
        email,
        phone_number: studentPhone,
        date_of_birth: studentDOB,
        agreed_to_terms: studentPrivacyChecked && studentTermsChecked,
        role: 'student' as const,
      };
      setLastSavePayload(studentData);
      dispatch(savePartialStudentData(studentData));
      if (debugMode) console.log('[DEBUG] Manual test save (student):', studentData);
    } else {
      const teacherData = {
        name,
        email,
        phone_number: teacherPhone,
        agreed_to_terms: teacherPrivacyChecked && teacherTermsChecked,
        role: 'teacher' as const,
      };
      const teacherMeta = {
        active_student_count: teacherActiveStudents ? Number(teacherActiveStudents) : null,
        avg_tuition_per_student: teacherAvgTuition ? Number(teacherAvgTuition) : null,
        referral_source: teacherReferralSource,
      };
      setLastSavePayload({ user: teacherData, meta: teacherMeta });
      dispatch(savePartialTeacherData({ user: teacherData, meta: teacherMeta }));
      if (debugMode) console.log('[DEBUG] Manual test save (teacher):', { user: teacherData, meta: teacherMeta });
    }
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
              <div className="mb-1">Current Role: {selectedRole}</div>
              <div className="mb-1">Current Form State: <pre>{JSON.stringify({
                name, email, studentPhone, studentDOB, studentPrivacyChecked, studentTermsChecked,
                teacherPhone, teacherActiveStudents, teacherAvgTuition, teacherReferralSource, teacherPrivacyChecked, teacherTermsChecked
              }, null, 2)}</pre></div>
              <div className="mb-1">Last Save Payload: <pre>{JSON.stringify(lastSavePayload, null, 2)}</pre></div>
              <div className="mb-1">Last Validation Error: {validationError || '(none)'}</div>
              <button onClick={handleTestSave} className="mt-2 px-3 py-1 bg-[#272A69] text-white rounded hover:bg-[#272A69]/90">Test Save</button>
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

          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            <button
              onClick={() => setSelectedRole('student')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedRole === 'student'
                  ? 'bg-[#272A69] text-white'
                  : 'hover:bg-gray-50'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setSelectedRole('teacher')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                selectedRole === 'teacher'
                  ? 'bg-[#272A69] text-white'
                  : 'hover:bg-gray-50'
              }`}
            >
              Teacher
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (selectedRole === 'student') handleStudentFieldChange('name', e.target.value);
                  else handleTeacherFieldChange('name', e.target.value);
                }}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (selectedRole === 'student') handleStudentFieldChange('email', e.target.value);
                  else handleTeacherFieldChange('email', e.target.value);
                }}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                className="w-full"
              />
            </div>

            {/* Student Fields */}
            {selectedRole === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="student-phone">Phone Number</Label>
                  <Input
                    id="student-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={studentPhone}
                    onChange={e => {
                      setStudentPhone(e.target.value);
                      handleStudentFieldChange('phone_number', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-dob">Date of Birth</Label>
                  <Input
                    id="student-dob"
                    type="date"
                    value={studentDOB}
                    onChange={e => {
                      setStudentDOB(e.target.value);
                      handleStudentFieldChange('date_of_birth', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="student-privacy"
                    type="checkbox"
                    checked={studentPrivacyChecked}
                    onChange={e => {
                      setStudentPrivacyChecked(e.target.checked);
                      handleStudentFieldChange('agreed_to_terms', e.target.checked && studentTermsChecked);
                    }}
                  />
                  <Label htmlFor="student-privacy" className="text-sm">
                    I agree to the{' '}
                    <button type="button" className="underline text-[#272A69]" onClick={() => setShowStudentPrivacy(true)}>
                      Privacy Policy
                    </button>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="student-terms"
                    type="checkbox"
                    checked={studentTermsChecked}
                    onChange={e => {
                      setStudentTermsChecked(e.target.checked);
                      handleStudentFieldChange('agreed_to_terms', e.target.checked && studentPrivacyChecked);
                    }}
                  />
                  <Label htmlFor="student-terms" className="text-sm">
                    I agree to the{' '}
                    <button type="button" className="underline text-[#272A69]" onClick={() => setShowStudentTerms(true)}>
                      Terms of Service
                    </button>
                  </Label>
                </div>
              </>
            )}

            {/* Teacher Fields */}
            {selectedRole === 'teacher' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teacher-phone">Phone Number</Label>
                  <Input
                    id="teacher-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={teacherPhone}
                    onChange={e => {
                      setTeacherPhone(e.target.value);
                      handleTeacherFieldChange('phone_number', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-active-students"># of Active Students</Label>
                  <Input
                    id="teacher-active-students"
                    type="number"
                    placeholder="e.g. 10"
                    value={teacherActiveStudents}
                    onChange={e => {
                      setTeacherActiveStudents(e.target.value);
                      handleTeacherFieldChange('active_student_count', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-avg-tuition">Avg Tuition per Student</Label>
                  <Input
                    id="teacher-avg-tuition"
                    type="number"
                    placeholder="e.g. 100"
                    value={teacherAvgTuition}
                    onChange={e => {
                      setTeacherAvgTuition(e.target.value);
                      handleTeacherFieldChange('avg_tuition_per_student', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-referral">Where did you hear from us?</Label>
                  <Input
                    id="teacher-referral"
                    type="text"
                    placeholder="e.g. Google, Friend, etc."
                    value={teacherReferralSource}
                    onChange={e => {
                      setTeacherReferralSource(e.target.value);
                      handleTeacherFieldChange('referral_source', e.target.value);
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="teacher-privacy"
                    type="checkbox"
                    checked={teacherPrivacyChecked}
                    onChange={e => {
                      setTeacherPrivacyChecked(e.target.checked);
                      handleTeacherFieldChange('agreed_to_terms', e.target.checked && teacherTermsChecked);
                    }}
                  />
                  <Label htmlFor="teacher-privacy" className="text-sm">
                    I agree to the{' '}
                    <button type="button" className="underline text-[#272A69]" onClick={() => setShowTeacherPrivacy(true)}>
                      Privacy Policy
                    </button>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="teacher-terms"
                    type="checkbox"
                    checked={teacherTermsChecked}
                    onChange={e => {
                      setTeacherTermsChecked(e.target.checked);
                      handleTeacherFieldChange('agreed_to_terms', e.target.checked && teacherPrivacyChecked);
                    }}
                  />
                  <Label htmlFor="teacher-terms" className="text-sm">
                    I agree to the{' '}
                    <button type="button" className="underline text-[#272A69]" onClick={() => setShowTeacherTerms(true)}>
                      Terms of Service
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

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Modals */}
      <StudentPrivacyPolicyModal open={showStudentPrivacy} onClose={() => setShowStudentPrivacy(false)} />
      <StudentTermsOfServiceModal open={showStudentTerms} onClose={() => setShowStudentTerms(false)} />
      <TeacherPrivacyPolicyModal open={showTeacherPrivacy} onClose={() => setShowTeacherPrivacy(false)} />
      <TeacherTermsOfServiceModal open={showTeacherTerms} onClose={() => setShowTeacherTerms(false)} />
    </div>
  );
} 