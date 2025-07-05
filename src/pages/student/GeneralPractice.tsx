import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const GeneralPractice: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back arrow */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Practice</h1>
        </div>

        {/* Placeholder content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-4">Practice content will be added here</p>
            <p className="text-sm">This page is currently under development</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralPractice; 