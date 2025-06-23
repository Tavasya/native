import React from 'react';
import { useAppDispatch } from '@/app/hooks';
import { hideChoiceModal } from '@/features/submissions/submissionsSlice';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Eye, RefreshCw, X } from 'lucide-react';
import { Submission } from '@/features/submissions/types';

interface ResubmissionChoiceModalProps {
  onStartNew: () => void;
  onViewPrevious: () => void;
  existingSubmission: Submission | null;
}

const ResubmissionChoiceModal: React.FC<ResubmissionChoiceModalProps> = ({
  onStartNew,
  onViewPrevious,
  existingSubmission
}) => {
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(hideChoiceModal());
  };

  const attemptText = existingSubmission?.attempt && existingSubmission.attempt > 1 
    ? `(Attempt ${existingSubmission.attempt})` 
    : '';

  const submissionStatus = existingSubmission?.status;
  
  // Determine status display text
  const getStatusText = () => {
    switch (submissionStatus) {
      case 'pending':
        return 'Submitted (Pending Analysis)';
      case 'awaiting_review':
        return 'Under Review';
      case 'graded':
        return 'Completed & Graded';
      default:
        return 'Submitted';
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Assignment Already Submitted
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            You've already submitted this assignment {attemptText} and it's currently {getStatusText().toLowerCase()}. 
            Would you like to view your submission or start a new attempt?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={onViewPrevious}
            variant="outline"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Submission & Results
          </Button>
          
          <Button 
            onClick={onStartNew}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Start New Attempt
          </Button>
        </div>

        {/* Show attempt info if available */}
        {existingSubmission && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            <div className="font-medium">Previous submission details:</div>
            <div>Attempt: {existingSubmission.attempt}</div>
            <div>Status: {getStatusText()}</div>
            {existingSubmission.submitted_at && (
              <div>
                Submitted: {new Date(existingSubmission.submitted_at).toLocaleDateString()}
              </div>
            )}
            {existingSubmission.recordings && existingSubmission.recordings.length > 0 && (
              <div>
                Recordings: {existingSubmission.recordings.length} question(s)
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResubmissionChoiceModal;