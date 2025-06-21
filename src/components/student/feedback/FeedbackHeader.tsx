// components/student/feedback/FeedbackHeader.tsx

import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeedbackHeaderProps {
  assignmentTitle: string;
  submittedAt: string;
  studentName: string;
  isAwaitingReview: boolean;
  onBack: () => void;
  onSubmitAndSend: () => void;
  submissionId?: string;
}

const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({
  studentName,
  isAwaitingReview,
  onBack,
  onSubmitAndSend,
  submissionId
}) => {
  const navigate = useNavigate();

  const handlePracticeClick = () => {
    if (submissionId) {
      navigate(`/student/practice/${submissionId}`);
    } else {
      navigate('/student/practice');
    }
  };
  
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
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={handlePracticeClick}
        >
          <BookOpen className="h-4 w-4" />
          Practice
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
    </div>
  );
};

export default FeedbackHeader;