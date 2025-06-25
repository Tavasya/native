import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface RedoPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRedo: () => void;
  onContinue: () => void;
  assignmentTitle: string;
  attemptCount: number;
  isProcessing?: boolean;
}

const RedoPromptDialog: React.FC<RedoPromptDialogProps> = ({
  isOpen,
  onClose,
  onRedo,
  onContinue,
  assignmentTitle,
  attemptCount,
  isProcessing = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Assignment Already Submitted
          </DialogTitle>
          <DialogDescription className="text-left">
            You have already submitted <strong>"{assignmentTitle}"</strong> {attemptCount} time{attemptCount > 1 ? 's' : ''}.
            <br /><br />
            What would you like to do?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Continue with Current Attempt</h4>
            <p className="text-sm text-blue-700">
              Continue working on your existing in-progress submission if you have one.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Start New Attempt</h4>
            <p className="text-sm text-green-700">
              Create a new submission attempt. Your previous attempts will be saved and you can view them later.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onContinue}
            disabled={isProcessing}
          >
            Continue Current
          </Button>
          <Button
            onClick={onRedo}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isProcessing ? 'Starting...' : 'Start New Attempt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RedoPromptDialog;