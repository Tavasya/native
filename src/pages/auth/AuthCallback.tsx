import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { loadSession } from '@/features/auth/authThunks';
import { handleGoogleAuthCallback } from '@/integrations/supabase/oauth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        const { needsOnboarding } = await handleGoogleAuthCallback();
        
        // Load the session to update Redux state
        await dispatch(loadSession());
        
        // Redirect based on onboarding status
        if (needsOnboarding) {
          navigate('/onboarding');
        } else {
          // User has complete profile, redirect to dashboard
          // The actual dashboard redirect will be handled by the app routing
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Authentication Failed</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="text-sm text-gray-500">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#272A69] mx-auto mb-4"></div>
        <div className="text-gray-600">Completing authentication...</div>
      </div>
    </div>
  );
} 