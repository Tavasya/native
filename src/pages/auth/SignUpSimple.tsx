import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { signUpSimple } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import NativeLogo from '@/lib/images/Native Logo.png';

export default function SignUpSimple() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user?.email_verified) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await dispatch(signUpSimple(formData));
    
    if (signUpSimple.fulfilled.match(result)) {
      setSignupSuccess(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to {formData.email}. 
                Please verify your email to continue.
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
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
            <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Join Native to start your language journey</p>
          </div>

          {(error || googleError) && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error || googleError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password (min 6 characters)"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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
                mode="signup" 
                onError={(error) => setGoogleError(error)} 
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 