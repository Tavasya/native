import React, { useState, useEffect } from 'react';
import { signInWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { clearAuth } from '@/features/auth/authSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import NativeLogo from '@/lib/images/Native Logo.png';

export default function NewLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error: authError, user, profile } = useAppSelector(state => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    dispatch(clearAuth());
  }, [dispatch]);

  useEffect(() => {
    // Debug logging
    console.log('Auth state:', { user, profile, loading });
    
    // ✅ NEW - Check profile completion before redirecting
    if (user && profile?.profile_complete && profile.role) {
      console.log('Redirecting to dashboard:', profile.role);
      // Check if there's a 'from' location to redirect back to
      const from = location.state?.from?.pathname || `/${profile.role}/dashboard`;
      navigate(from, { replace: true });
    } else if (user && profile && !profile.profile_complete) {
      console.log('Redirecting to onboarding - profile incomplete');
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signInWithEmail({ 
      email, 
      password
    }));
    
    if (signInWithEmail.rejected.match(result)) {
      const errorMessage = result.payload as string;
      // Map common error messages to user-friendly versions
      const friendlyError = errorMessage.includes('Invalid login credentials')
        ? 'Invalid email or password'
        : errorMessage.includes('Email not confirmed')
        ? 'Please verify your email before logging in. Check your inbox for the verification link.'
        : errorMessage.includes('not found')
        ? 'No account found with this email. Please sign up first.'
        : 'Failed to sign in. Please try again.';
      
      dispatch(clearAuth());
      setError(friendlyError);
    }
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
              onClick={() => navigate('/')}
            />
          </div>

          {(error || authError || googleError) && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error || authError || googleError}
              {error?.includes('verify your email') && (
                <div className="mt-2">
                  <Button
                    onClick={() => navigate('/sign-up')}
                    variant="outline"
                    className="w-full mt-2 text-[#272A69] border-[#272A69] hover:bg-[#272A69] hover:text-white"
                  >
                    Sign up again
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  dispatch(clearAuth());
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
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  dispatch(clearAuth());
                }}
                required
                className="w-full"
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-[#272A69] hover:text-[#272A69]/90">
                  Forgot Password
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <GoogleAuthButton 
                mode="login" 
                onError={(error) => setGoogleError(error)} 
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/sign-up" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 