import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Mic, Square, ArrowLeft, Highlighter, BookOpen, Mic2 } from 'lucide-react';
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
  restorePracticePart2OriginalHighlight,
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
  const { isOpen, sessionId, improvedTranscript, bulletPoints, highlights, userAddedHighlights, removedOriginalHighlights, originalQuestion, currentStep, recordingUrl, isUploading } = useSelector(selectPracticePart2Modal);

  // Local state for introduction
  const [hasSeenIntroduction, setHasSeenIntroduction] = useState(false);
  const [activeTab, setActiveTab] = useState<'highlight' | 'notes' | 'record'>('highlight');

  // Debug logging - only when modal opens or step changes
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Part 2 Modal Debug:', {
        isOpen,
        originalQuestion,
        currentStep,
        hasOriginalQuestion: !!originalQuestion
      });
    }
  }, [isOpen, currentStep, originalQuestion]);

  // Show introduction for first-time users
  useEffect(() => {
    if (isOpen && !hasSeenIntroduction) {
      setHasSeenIntroduction(false);
    }
  }, [isOpen, hasSeenIntroduction]);

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
    if (recordingUrl && sessionId) {
      // Filter out removed original highlights from the original highlights
      const activeOriginalHighlights = highlights.filter(
        originalHighlight => !removedOriginalHighlights.some(
          removedHighlight => removedHighlight.position === originalHighlight.position
        )
      );
      
      // Mark Part 2 as complete with the recording URL and save highlights
      dispatch(markPracticePart2Completed({ 
        recordingUrl, 
        sessionId, 
        highlights: activeOriginalHighlights, 
        userAddedHighlights 
      }));
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
    // Check if this was a removed original highlight - if so, restore it
    const wasRemovedOriginalHighlight = removedOriginalHighlights.some(h => h.position === position);
    if (wasRemovedOriginalHighlight) {
      // Remove from removed list to restore the highlight
      // We'll need a new action for this, but for now let's add it as user highlight
      dispatch(restorePracticePart2OriginalHighlight({ word, position }));
    } else {
      // Normal case - add as user highlight
      dispatch(addPracticePart2HighlightFromTranscript({ word, position }));
    }
  };

  const handleRemoveHighlight = (word: string, position: number) => {
    dispatch(removePracticePart2HighlightFromTranscript({ word, position }));
  };

  const renderHighlightedText = (text: string, originalHighlights: { word: string; position: number }[]) => {
    const words = text.split(' ');
    const elements: React.ReactNode[] = [];
    
    words.forEach((word, index) => {
      const isOriginalHighlight = originalHighlights.some(h => h.position === index);
      const isRemovedOriginalHighlight = removedOriginalHighlights.some(h => h.position === index);
      const isUserHighlight = userAddedHighlights.some(h => h.position === index);
      // Only consider it highlighted if it's an original highlight that hasn't been removed, or a user highlight
      const isHighlighted = (isOriginalHighlight && !isRemovedOriginalHighlight) || isUserHighlight;
      const cleanWord = word.replace(/[.,!?;:]$/, ''); // Remove punctuation for matching
      const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
      
      if (isHighlighted) {
        // All highlights look the same - clickable to remove
        elements.push(
          <span 
            key={index} 
            className="bg-yellow-200 font-medium py-0.5 px-1 rounded mx-0.5 cursor-pointer hover:bg-yellow-300 transition-colors inline-block break-words"
            onClick={() => handleRemoveHighlight(cleanWord, index)}
          >
            {cleanWord}
          </span>
        );
      } else {
        // Non-highlighted words - clickable to add
        elements.push(
          <span 
            key={index} 
            className="text-gray-800 hover:bg-gray-100 cursor-pointer py-0.5 px-1 rounded transition-colors mx-0.5 inline-block break-words"
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
    });
    
    return <span className="leading-relaxed inline-block w-full break-words">{elements}</span>;
  };

  if (!isOpen || !sessionId) {
    return null;
  }

  // Show introduction step for first-time users
  if (!hasSeenIntroduction) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-[#272A69]">Part 2: Highlight & Practice</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Three simple steps:</h3>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('highlight')}
                className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'highlight'
                    ? 'bg-[#272A69] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Highlight
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'bg-[#272A69] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === 'record'
                    ? 'bg-[#272A69] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Record
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'highlight' && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Highlighter className="h-12 w-12 text-[#272A69] mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-[#272A69] mb-2">Click words to highlight</h4>
                  <p className="text-sm text-gray-600">Select words you want to remember</p>
                </div>
              )}
              
              {activeTab === 'notes' && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <BookOpen className="h-12 w-12 text-[#272A69] mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-[#272A69] mb-2">Add definitions</h4>
                  <p className="text-sm text-gray-600">Write notes for each word</p>
                </div>
              )}
              
              {activeTab === 'record' && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Mic2 className="h-12 w-12 text-[#272A69] mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-[#272A69] mb-2">Answer the question again</h4>
                  <p className="text-sm text-gray-600">Use your notes to help you remember</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setHasSeenIntroduction(true)}
                className="bg-[#272A69] hover:bg-[#272A69]/90 text-white px-8 py-3"
                size="lg"
              >
                Start
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderTranscriptStep = () => (
    <div className="space-y-6">
      {/* Original Question */}
      {originalQuestion && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Original Question
          </h3>
          
          <div className="bg-[#272A69]/5 border border-[#272A69]/20 rounded-lg p-4">
            <p className="text-sm text-[#272A69] leading-relaxed">
              {originalQuestion}
            </p>
          </div>
        </div>
      )}

      {/* Improved Transcript Display */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-[#272A69] mb-4">
          Highlight Words
        </h3>
        <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-2">
          <div className="text-[#272A69] leading-relaxed break-words whitespace-normal">
            {renderHighlightedText(improvedTranscript, highlights)}
          </div>
        </div>
        {(highlights.length > 0 || userAddedHighlights.length > 0) && (
          <div className="mt-4 text-sm text-gray-600 space-y-2">
          </div>
        )}
      </div>

      {/* Bullet Points Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Definitions & Notes
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddBulletPoint}
          >
            Add Note
          </Button>
        </div>
        
        <div className="max-h-80 overflow-y-auto overflow-x-hidden space-y-3 pr-2">
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
                      className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-full"
                    />
                  )}

                </div>
                <Textarea
                  placeholder="Write your definition or notes about this word..."
                  value={bulletPoint.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  className="min-h-[80px] resize-none w-full max-w-full"
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
          className="bg-[#272A69] hover:bg-[#272A69]/90"
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
          <div key={index} className="text-[#272A69]">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 font-medium min-w-fit">{index + 1}.</span>
              <div className="flex-1">
                <div className="font-semibold text-[#272A69]">
                  {bulletPoint.word}
                </div>
                <div className="mt-1 text-[#272A69]/80 leading-relaxed">
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
      {/* Original Question */}
      {originalQuestion && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#272A69]">
            Original Question
          </h3>
          
          <div className="bg-[#272A69]/5 border border-[#272A69]/20 rounded-lg p-4">
            <p className="text-sm text-[#272A69] leading-relaxed">
              {originalQuestion}
            </p>
          </div>
        </div>
      )}

      {/* Word Definitions & Notes (Read-only) */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#272A69]">
          Your Word Definitions & Notes
        </h3>
        
        <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
          {renderFormattedNotes()}
        </div>
      </div>

      {/* Recording Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#272A69]">
          Record Your Practice
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              Use the words above to help answer the question
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
                        : 'bg-[#272A69] hover:bg-[#272A69]/90'
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
            className="bg-[#272A69] hover:bg-[#272A69]/90 text-white"
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
      <DialogContent
        className={`w-full max-w-[90vw] ${improvedTranscript && improvedTranscript.length > 400 ? 'sm:max-w-[1100px]' : 'sm:max-w-[700px]'} max-h-[80vh] overflow-y-auto overflow-x-hidden`}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {currentStep === 'transcript' 
              ? "Highlight and write descriptions of words you want to remember"
              : "Answer the question again"
            }
          </DialogTitle>
        </DialogHeader>
        
        {currentStep === 'transcript' ? renderTranscriptStep() : renderRecordingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default PracticePart2Modal; 