import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { handleOAuthCallback } from '@/features/auth/authThunks';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (code) {
          const result = await dispatch(handleOAuthCallback({ code, state }));
          if (handleOAuthCallback.fulfilled.match(result)) {
            const { onboardingCompleted, role } = result.payload;
            if (!onboardingCompleted) {
              navigate('/onboarding');
            } else {
              navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
            }
          } else {
            navigate('/login?error=oauth_failed');
          }
        } else {
          navigate('/login?error=oauth_failed');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    };
    handleCallback();
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
} 