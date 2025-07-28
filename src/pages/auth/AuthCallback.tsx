import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { loadSession } from '@/features/auth/authThunks';
import { handleGoogleAuthCallback } from '@/integrations/supabase/oauth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 ===== AUTH CALLBACK DEBUG START =====');
        
        // Handle the OAuth callback
        const { needsOnboarding } = await handleGoogleAuthCallback();
        
        // 🔍 DEBUG: Log before loadSession
        console.log('🔍 ===== LOAD SESSION DEBUG =====');
        console.log('🔍 needsOnboarding from OAuth callback:', needsOnboarding);
        
        // Load the session to update Redux state
        const result = await dispatch(loadSession());
        
        // 🔍 DEBUG: Log loadSession result
        console.log('🔍 loadSession result type:', result.type);
        console.log('🔍 loadSession fulfilled:', loadSession.fulfilled.match(result));
        console.log('🔍 loadSession rejected:', loadSession.rejected.match(result));
        
        // Check if loadSession was successful and get the user data
        if (loadSession.fulfilled.match(result) && result.payload) {
          const { user, role } = result.payload;
          
          // 🔍 DEBUG: Log the user data from loadSession
          console.log('🔍 ===== USER DATA FROM LOAD SESSION =====');
          console.log('🔍 Complete user object:', user);
          console.log('🔍 User ID:', user.id);
          console.log('🔍 User Email:', user.email);
          console.log('🔍 User Name:', user.name);
          console.log('🔍 User Role:', role);
          console.log('🔍 User email_verified:', user.email_verified);
          
          // 🔍 DEBUG: Check if name is "unknown" or empty
          console.log('🔍 ===== NAME VALIDATION =====');
          console.log('🔍 Name is undefined:', user.name === undefined);
          console.log('🔍 Name is null:', user.name === null);
          console.log('🔍 Name is empty string:', user.name === '');
          console.log('🔍 Name is "unknown":', user.name === 'unknown');
          console.log('🔍 Name length:', user.name?.length);
          console.log('🔍 Name type:', typeof user.name);
          
          // Redirect based on onboarding status
          if (needsOnboarding) {
            console.log('🔍 Redirecting to onboarding');
            navigate('/onboarding');
          } else if (role) {
            // User has complete profile, redirect to their dashboard or original URL
            console.log('🔍 Redirecting to dashboard:', role);
            const from = location.state?.from?.pathname || `/${role}/dashboard`;
            navigate(from, { replace: true });
          } else {
            // Fallback - redirect to login if no role found
            console.log('🔍 No role found, redirecting to login');
            navigate('/login');
          }
        } else {
          // If loadSession failed, redirect to login
          console.log('🔍 loadSession failed, redirecting to login');
          console.log('🔍 loadSession error:', result.payload);
          navigate('/login');
        }
        
        console.log('🔍 ===== AUTH CALLBACK DEBUG END =====');
      } catch (error) {
        console.error('🔍 OAuth callback failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate, location.state]);

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