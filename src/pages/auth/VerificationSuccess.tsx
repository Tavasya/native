import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import NativeLogo from '@/lib/images/Native Logo.png';

export default function VerificationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Congratulations!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your email has been successfully verified. You can now sign in to join a class.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 