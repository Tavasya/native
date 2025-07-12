import React from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Mic, Square, ArrowLeft } from 'lucide-react';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { 
  selectPracticePart2Modal,
  closePracticePart2Modal,
  setPracticePart2BulletPointDescription,
  setPracticePart2BulletPointWord,
  addPracticePart2BulletPoint,
  removePracticePart2BulletPoint,
  addPracticePart2HighlightFromTranscript,
  removePracticePart2HighlightFromTranscript,
  setPracticePart2Step,
  setPracticePart2Recording,
  setPracticePart2Uploading,
  markPracticePart2Completed
} from '@/features/practice/practiceSlice';
import { uploadAudioToStorage } from '@/features/submissions/audioUploadService';
import { supabase } from '@/integrations/supabase/client';
import AudioPlayer from '@/components/assignment/AudioPlayer';

const PracticePart2Modal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, sessionId, improvedTranscript, bulletPoints, highlights, userAddedHighlights, currentStep, recordingUrl, isUploading } = useSelector(selectPracticePart2Modal);

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

  const handleNext = () => {
    dispatch(setPracticePart2Step('recording'));
  };

  const handleBack = () => {
    dispatch(setPracticePart2Step('transcript'));
  };

  const handleDone = () => {
    if (recordingUrl) {
      // Mark Part 2 as complete with the recording URL
      dispatch(markPracticePart2Completed({ recordingUrl }));
    }
    // Close the modal
    dispatch(closePracticePart2Modal());
  };

  const {
    isRecording,
    isProcessing,
    toggleRecording
  } = useAudioRecording({
    onRecordingComplete: async (blob) => {
      try {
        dispatch(setPracticePart2Uploading(true));
        
        // Upload to Supabase storage
        // Use sessionId as questionId and 'part2' as assignmentId for organization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('User not authenticated');
        }
        
        const supabaseUrl = await uploadAudioToStorage(
          blob,
          'part2-practice', // Use a specific identifier for Part 2 practice
          sessionId || 'unknown',
          session.user.id
        );
        
        dispatch(setPracticePart2Recording({ url: supabaseUrl }));
        console.log('Part 2 recording uploaded to Supabase:', supabaseUrl);
      } catch (error) {
        console.error('Part 2 recording upload error:', error);
        dispatch(setPracticePart2Uploading(false));
        // Could add error handling UI here
      }
    },
    onError: (errorMessage) => {
      console.error('Part 2 recording error:', errorMessage);
      dispatch(setPracticePart2Uploading(false));
    }
  });

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

  const renderTranscriptStep = () => (
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
        
        <Button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderFormattedNotes = () => {
    if (bulletPoints.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 italic">
          No word definitions added.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bulletPoints.map((bulletPoint, index) => (
          <div key={index} className="text-gray-800">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 font-medium min-w-fit">{index + 1}.</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {bulletPoint.word}
                  {bulletPoint.isHighlighted && (
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      from practice
                    </span>
                  )}
                </div>
                <div className="mt-1 text-gray-700 leading-relaxed">
                  {bulletPoint.description || <span className="italic text-gray-500">No description added.</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecordingStep = () => (
    <div className="space-y-6">
      {/* Word Definitions & Notes (Read-only) */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Your Word Definitions & Notes
        </h3>
        
        <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
          {renderFormattedNotes()}
        </div>
      </div>

      {/* Recording Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Record Your Practice
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              Practice speaking about the words you've defined above
            </div>
            
            {/* Recording Controls */}
            {!recordingUrl && (
              <>
                <div className="flex justify-center">
                  <Button
                    onClick={toggleRecording}
                    disabled={isProcessing || isUploading}
                    className={`w-16 h-16 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isProcessing || isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : isRecording ? (
                      <Square className="h-6 w-6 text-white" />
                    ) : (
                      <Mic className="h-6 w-6 text-white" />
                    )}
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  {isUploading 
                    ? 'Saving recording...' 
                    : isRecording 
                      ? 'Recording... Click to stop' 
                      : 'Click to start recording'
                  }
                </div>
              </>
            )}
            
            {/* Audio Player */}
            {recordingUrl && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  ✅ Recording saved successfully
                </div>
                <AudioPlayer
                  hasRecorded={true}
                  isRecording={false}
                  onTimeUpdate={() => {}}
                  audioUrl={recordingUrl}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    dispatch(setPracticePart2Recording({ url: null }));
                    dispatch(setPracticePart2Uploading(false));
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Record Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {recordingUrl ? (
          <Button
            onClick={handleDone}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Done
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Part 2 of Practice {currentStep === 'recording' && '- Recording'}
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
        
        {currentStep === 'transcript' ? renderTranscriptStep() : renderRecordingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default PracticePart2Modal; 