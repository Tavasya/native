import React, { useState, useEffect } from 'react';
import { signUpWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { clearAuth } from '@/features/auth/authSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from '@/features/auth/types';
import NativeLogo from '@/lib/images/Native Logo.png';

export default function NewSignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user, role } = useAppSelector(state => state.auth);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  useEffect(() => {
    dispatch(clearAuth());
  }, [dispatch]);

  useEffect(() => {
    if (user && role) {
      navigate(`/${role}/dashboard`);
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(signUpWithEmail({ 
      email, 
      password, 
      name,
      role: selectedRole 
    }));
    
    if (signUpWithEmail.rejected.match(result)) {
      console.error('Signup failed:', result.payload);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
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
                  dispatch(clearAuth());
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
    </div>
  );
} 