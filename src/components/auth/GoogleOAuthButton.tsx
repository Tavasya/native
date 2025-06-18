import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

interface GoogleOAuthButtonProps {
  onClick?: () => Promise<void> | void;
  buttonText?: string;
  className?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onClick,
  buttonText = 'Sign in with Google',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      if (onClick) {
        await onClick();
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm font-medium py-2 px-4 rounded-lg transition-all"
      >
        <FcGoogle className="w-5 h-5" />
        {loading ? 'Signing in...' : buttonText}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
