// components/student/feedback/FeedbackHeader.tsx

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackHeaderProps {
  assignmentTitle: string;
  submittedAt: string;
  studentName: string;
  isAwaitingReview: boolean;
  onBack: () => void;
  onSubmitAndSend: () => void;
}

const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({
  studentName,
  isAwaitingReview,
  onBack,
  onSubmitAndSend
}) => {
  
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      {isAwaitingReview && (
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={onSubmitAndSend}
        >
          Submit & Send to {studentName}
        </Button>
      )}
    </div>
  );
};

export default FeedbackHeader;