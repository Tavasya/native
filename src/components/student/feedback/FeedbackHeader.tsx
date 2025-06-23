// components/student/feedback/FeedbackHeader.tsx

import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackHeaderProps {
  assignmentTitle: string;
  submittedAt: string;
  studentName: string;
  isAwaitingReview: boolean;
  onBack: () => void;
  onSubmitAndSend: () => void;
  submissionId?: string;
  // New props for redo functionality
  assignmentId?: string;
  showRedoButton?: boolean;
  onRedo?: () => void;
}

const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({
  studentName,
  isAwaitingReview,
  onBack,
  onSubmitAndSend,
  showRedoButton = false,
  onRedo
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
      <div className="flex items-center gap-2">
        {showRedoButton && onRedo && (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={onRedo}
          >
            <RefreshCw className="h-4 w-4" />
            Redo Assignment
          </Button>
        )}
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
    </div>
  );
};

export default FeedbackHeader;