import React from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { 
  selectPracticePart2Modal,
  closePracticePart2Modal,
  setPracticePart2UserText
} from '@/features/practice/practiceSlice';

const PracticePart2Modal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, sessionId, improvedTranscript, userText } = useSelector(selectPracticePart2Modal);

  const handleClose = () => {
    dispatch(closePracticePart2Modal());
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setPracticePart2UserText(event.target.value));
  };

  if (!isOpen || !sessionId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Part 2 of Practice
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Improved Transcript Display */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Improved Transcript
            </h3>
            <div className="text-gray-800 leading-relaxed">
              {improvedTranscript}
            </div>
          </div>

          {/* Text Input Field */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">
              Your Response
            </h3>
            <Textarea
              placeholder="Type your response here..."
              value={userText}
              onChange={handleTextChange}
              className="min-h-[150px] resize-none"
              rows={6}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Close
            </Button>
            
            <div className="text-sm text-gray-500">
              {userText.length} characters
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticePart2Modal; 