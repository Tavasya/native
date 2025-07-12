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
  setPracticePart2BulletPointDescription,
  setPracticePart2BulletPointWord,
  addPracticePart2BulletPoint,
  removePracticePart2BulletPoint,
  addPracticePart2HighlightFromTranscript,
  removePracticePart2HighlightFromTranscript
} from '@/features/practice/practiceSlice';

const PracticePart2Modal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, sessionId, improvedTranscript, bulletPoints, highlights, userAddedHighlights } = useSelector(selectPracticePart2Modal);

  const handleClose = () => {
    dispatch(closePracticePart2Modal());
  };

  const handleDescriptionChange = (index: number, description: string) => {
    dispatch(setPracticePart2BulletPointDescription({ index, description }));
  };

  const handleWordChange = (index: number, word: string) => {
    dispatch(setPracticePart2BulletPointWord({ index, word }));
  };

  const handleAddBulletPoint = () => {
    dispatch(addPracticePart2BulletPoint({ word: '', description: '' }));
  };

  const handleRemoveBulletPoint = (index: number) => {
    dispatch(removePracticePart2BulletPoint(index));
  };

  const handleWordClick = (word: string, position: number) => {
    dispatch(addPracticePart2HighlightFromTranscript({ word, position }));
  };

  const handleRemoveHighlight = (word: string, position: number) => {
    dispatch(removePracticePart2HighlightFromTranscript({ word, position }));
  };

  const renderHighlightedText = (text: string, originalHighlights: { word: string; position: number }[]) => {
    const words = text.split(' ');
    const elements: React.ReactNode[] = [];
    
    words.forEach((word, index) => {
      const isOriginalHighlight = originalHighlights.some(h => h.position === index);
      const isUserHighlight = userAddedHighlights.some(h => h.position === index);
      const cleanWord = word.replace(/[.,!?;:]$/, ''); // Remove punctuation for matching
      const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
      
      if (isOriginalHighlight) {
        // Original practice highlights - yellow background (not clickable to remove)
        elements.push(
          <span key={index} className="bg-yellow-200 font-medium px-1 rounded">
            {cleanWord}
          </span>
        );
      } else if (isUserHighlight) {
        // User-added highlights - blue background (clickable to remove)
        elements.push(
          <span 
            key={index} 
            className="bg-blue-200 font-medium px-1 rounded cursor-pointer hover:bg-blue-300 transition-colors"
            onClick={() => handleRemoveHighlight(cleanWord, index)}
            title="Click to remove highlight"
          >
            {cleanWord}
          </span>
        );
      } else {
        // Non-highlighted words - clickable
        elements.push(
          <span 
            key={index} 
            className="text-gray-800 hover:bg-gray-100 cursor-pointer px-1 rounded transition-colors"
            onClick={() => handleWordClick(cleanWord, index)}
          >
            {cleanWord}
          </span>
        );
      }
      
      if (punctuation) {
        elements.push(
          <span key={`${index}-punct`} className="text-gray-800">
            {punctuation}
          </span>
        );
      }
      
      // Add space between words (except for the last word)
      if (index < words.length - 1) {
        elements.push(' ');
      }
    });
    
    return <span className="leading-relaxed">{elements}</span>;
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
              {renderHighlightedText(improvedTranscript, highlights)}
            </div>
            {(highlights.length > 0 || userAddedHighlights.length > 0) && (
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div className="flex flex-wrap gap-4">
                  {highlights.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="bg-yellow-200 font-medium px-1 rounded">Yellow</span>
                      <span>words from practice</span>
                    </div>
                  )}
                  {userAddedHighlights.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="bg-blue-200 font-medium px-1 rounded">Blue</span>
                      <span>words you selected</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  💡 Click any word to add it to your notes • Click blue highlighted words to remove them
                </div>
              </div>
            )}
          </div>

          {/* Bullet Points Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Word Definitions & Notes
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBulletPoint}
              >
                Add Note
              </Button>
            </div>
            
            <div className="space-y-3">
              {bulletPoints.map((bulletPoint, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {bulletPoint.isHighlighted ? (
                        <span className="font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                          {bulletPoint.word}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={bulletPoint.word}
                          onChange={(e) => handleWordChange(index, e.target.value)}
                          placeholder="Enter word..."
                          className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {bulletPoint.isHighlighted && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                          From practice
                        </span>
                      )}
                    </div>
                    <Textarea
                      placeholder="Write your definition or notes about this word..."
                      value={bulletPoint.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      className="min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBulletPoint(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {bulletPoints.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No words to define yet. Click "Add Note" to get started.
                </div>
              )}
            </div>
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
              {bulletPoints.length} {bulletPoints.length === 1 ? 'note' : 'notes'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticePart2Modal; 