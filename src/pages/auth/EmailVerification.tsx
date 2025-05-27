import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { verifyEmail } from '@/features/auth/authThunks';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import NativeLogo from '@/lib/images/Native Logo.png';

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Get parameters from both URL query and hash fragment
        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        // Combine parameters, preferring hash fragment values
        const params = new URLSearchParams();
        for (const [key, value] of searchParams.entries()) {
          params.set(key, value);
        }
        for (const [key, value] of hashParams.entries()) {
          params.set(key, value);
        }

        const token = params.get('token');
        const type = params.get('type');
        const errorCode = params.get('error_code');
        const errorMessage = params.get('error_message');

        console.log('Verification params:', { token, type, errorCode, errorMessage });

        // First check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found existing session:', session);
          // Check if user is already verified
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            setError('Failed to fetch user profile. Please try again.');
            setIsVerifying(false);
            return;
          }

          if (!profile) {
            setError('User profile not found. Please try signing up again.');
            setIsVerifying(false);
            return;
          }

          if (profile.email_verified) {
            // If already verified, redirect to join class page
            navigate(`/${profile.role}/join-class`);
            return;
          }

          // If not verified, update verification status
          const { error: updateError } = await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Update error:', updateError);
            setError('Failed to update verification status. Please try again.');
            setIsVerifying(false);
            return;
          }

          // Mark as verified and redirect to join class
          setIsVerified(true);
          setTimeout(() => {
            navigate(`/${profile.role}/join-class`);
          }, 2000);
          return;
        }

        // If no session, proceed with token verification
        if (!token || type !== 'signup') {
          setError('Invalid verification link');
          setIsVerifying(false);
          return;
        }

        // Get the user from the token
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          if (userError?.message?.includes('expired') || userError?.message?.includes('invalid')) {
            setError('Verification link has expired. Please request a new verification email.');
            setIsVerifying(false);
            return;
          }
          setError('Failed to verify user');
          setIsVerifying(false);
          return;
        }

        // Update the user record to mark email as verified
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('id', user.id);

        if (updateError) {
          setError('Failed to update verification status');
          setIsVerifying(false);
          return;
        }

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('Failed to fetch user profile');
          setIsVerifying(false);
          return;
        }

        // Dispatch verification success
        const result = await dispatch(verifyEmail({
          email: user.email || '',
          token: token
        }));

        if (verifyEmail.rejected.match(result)) {
          const errorMessage = result.payload as string;
          if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            setError('Verification link has expired. Please request a new verification email.');
          } else {
            setError(errorMessage);
          }
          setIsVerifying(false);
          return;
        }

        // Mark as verified and redirect to join class
        setIsVerified(true);
        setTimeout(() => {
          navigate(`/${profile.role}/join-class`);
        }, 2000);

      } catch (err) {
        console.error('Verification error:', err);
        if (retryCount < 2) {
          // Retry verification after a short delay
          setRetryCount(prev => prev + 1);
          setTimeout(handleVerification, 2000);
        } else {
          setError('An unexpected error occurred. Please try again later.');
          setIsVerifying(false);
        }
      }
    };

    handleVerification();
  }, [dispatch, navigate, retryCount, location]);

  const handleRetry = () => {
    setError(null);
    setIsVerifying(true);
    setRetryCount(0);
    window.location.reload();
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-gray-600">
                Your email has been successfully verified. Redirecting you to join a class...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-gray-600">
                {error}
              </p>
              <div className="mt-6 space-y-4">
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full text-[#272A69] border-[#272A69] hover:bg-[#272A69] hover:text-white"
                >
                  Return to Login
                </Button>
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
            <h2 className="text-2xl font-semibold text-gray-900">Verifying Your Email</h2>
            <p className="mt-2 text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 