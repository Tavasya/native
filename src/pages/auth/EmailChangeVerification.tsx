import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { verifyEmailChange } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NativeLogo from '@/lib/images/Native Logo.png';
import { useNavigate } from 'react-router-dom';

export default function EmailChangeVerification() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, emailChangeInProgress } = useAppSelector(state => state.auth);
  
  const [otp, setOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !otp) return;

    const result = await dispatch(verifyEmailChange({ 
      newEmail,
      otp
    }));

    if (verifyEmailChange.fulfilled.match(result)) {
      // Redirect to dashboard after successful verification
      navigate(`/${result.payload.role}/dashboard`);
    }
  };

  if (!emailChangeInProgress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900">No Email Change in Progress</h2>
              <p className="mt-2 text-gray-600">Please initiate an email change first.</p>
              <Button
                onClick={() => navigate('/change-email')}
                className="mt-4 bg-[#272A69] hover:bg-[#272A69]/90"
              >
                Change Email
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
            <h2 className="text-2xl font-semibold text-gray-900">Verify Email Change</h2>
            <p className="mt-2 text-gray-600">Enter the 6-digit code sent to your new email address</p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Enter your new email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="w-full"
              />
              <p className="text-sm text-gray-500">Enter the 6-digit code sent to your new email address</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {loading ? 'Verifying...' : 'Verify Email Change'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 