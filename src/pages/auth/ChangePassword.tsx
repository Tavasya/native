import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { changePassword } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NativeLogo from '@/lib/images/Native Logo.png';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user, role } = useAppSelector(state => state.auth);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters long';
    }
    if (newPassword !== confirmPassword) {
      return 'New passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validationError = validatePasswords();
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    const result = await dispatch(changePassword({
      currentPassword,
      newPassword
    }));

    if (changePassword.fulfilled.match(result)) {
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Show success message and redirect
      alert('Password changed successfully');
      navigate(`/${role}/dashboard`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Please Sign In</h2>
              <p className="mt-2 text-gray-600">You need to be signed in to change your password.</p>
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
            <h2 className="text-2xl font-semibold text-gray-900">Change Password</h2>
            <p className="mt-2 text-gray-600">Enter your current password and choose a new one</p>
          </div>

          {(error || validationError) && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error || validationError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
              <p className="text-sm text-gray-500">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 