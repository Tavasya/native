import React from 'react';
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompletionScreenProps {
  goToDashboard: () => void;
  handlePracticeAgain: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  goToDashboard,
  handlePracticeAgain
}) => {
  return (
    <div className="bg-gray-100 rounded-2xl p-4 sm:p-6 shadow-md h-[600px] flex flex-col items-center justify-center">
      <div className="text-center">
        <CircleCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="font-semibold text-2xl text-gray-800 mb-2">Assignment Submitted!</h2>
        <p className="text-gray-600 mb-8">
          We'll notify you when your report is ready.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <Button onClick={goToDashboard} variant="outline" className="bg-white">
            Back to Dashboard
          </Button>
          <Button onClick={handlePracticeAgain} className="bg-[#272A69] hover:bg-[#272A69]/90">
            Practice Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;
