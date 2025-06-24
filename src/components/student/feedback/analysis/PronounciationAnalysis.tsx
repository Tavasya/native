// components/student/feedback/analysis/PronunciationAnalysis.tsx

import React from 'react';
import { Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getScoreColor, getPhonemeColor, getWordsToShow } from '@/utils/feedback/scoreUtils';
import { convertPhonemeToIPA } from '@/utils/feedback/textUtils';
import { playWordSegment, playTTSAudio } from '@/utils/feedback/audioUtils';
import { SectionFeedback, WordScore } from '@/types/feedback';
import { AppDispatch } from '@/app/store';

interface PronunciationAnalysisProps {
  currentFeedback: SectionFeedback | null;
  tempFeedback: SectionFeedback | null;
  isEditing: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  ttsAudioCache: Record<string, { url: string }>;
  ttsLoading: Record<string, boolean>;
  dispatch: AppDispatch;
  onDeleteIssue: (section: 'pronunciation', index: number) => void;
}

const PronunciationAnalysis: React.FC<PronunciationAnalysisProps> = ({
  currentFeedback,
  tempFeedback,
  isEditing,
  audioRef,
  ttsAudioCache,
  ttsLoading,
  dispatch,
  onDeleteIssue
}) => {
  const feedbackToUse = isEditing ? tempFeedback : currentFeedback;
  const [clickedPhoneme, setClickedPhoneme] = React.useState<string | null>(null);
  
  const wordsToShow = React.useMemo(() => {
    if (!feedbackToUse?.pronunciation?.word_details) return [];
    return getWordsToShow(feedbackToUse.pronunciation.word_details);
  }, [feedbackToUse?.pronunciation?.word_details]);

  const handlePlayWordSegment = (word: WordScore, wordIndex: number) => {
    playWordSegment(word, wordIndex, audioRef);
  };

  const handlePlayTTSAudio = async (word: string) => {
    await playTTSAudio(word, ttsAudioCache, dispatch);
  };

  const handleDeleteWord = (word: WordScore) => {
    // Find the actual index in the full word_details array
    const wordDetails = feedbackToUse?.pronunciation?.word_details || [];
    const actualIndex = wordDetails.findIndex(
      (w: any) => w.word === word.word && w.accuracy_score === word.accuracy_score
    );
    
    if (actualIndex !== -1) {
      onDeleteIssue('pronunciation', actualIndex);
    }
  };

  const generatePhonemeFeedback = (phoneme: string, score: number): string => {
    const ipaSymbol = convertPhonemeToIPA(phoneme);
    
    if (score >= 90) return `Excellent pronunciation of /${ipaSymbol}/!`;
    if (score >= 80) return `Good pronunciation of /${ipaSymbol}/, but could be slightly clearer.`;
    if (score >= 70) return `Pronunciation of /${ipaSymbol}/ needs some improvement for clarity.`;
    if (score >= 60) return `The /${ipaSymbol}/ sound needs more emphasis and clarity.`;
    if (score >= 50) return `Focus on improving the /${ipaSymbol}/ sound - try practicing it slowly.`;
    
    return `The /${ipaSymbol}/ sound needs significant improvement. Practice this sound in isolation first.`;
  };

  const handleWordIpaClick = (wordIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const wordId = `word-${wordIndex}`;
    setClickedPhoneme(clickedPhoneme === wordId ? null : wordId);
  };

  const generateWordPhonemeFeedback = (word: WordScore): string => {
    if (!word.phoneme_details || word.phoneme_details.length === 0) {
      return "No phoneme details available for this word.";
    }

    const problemPhonemes = word.phoneme_details
      .filter((phoneme: any) => phoneme.accuracy_score < 70)
      .map((phoneme: any) => ({
        symbol: convertPhonemeToIPA(phoneme.phoneme),
        score: phoneme.accuracy_score
      }));

    if (problemPhonemes.length === 0) {
      return "Overall pronunciation is good! All phonemes scored 70 or above.";
    }

    const feedbackParts = problemPhonemes.map(phoneme => {
      if (phoneme.score >= 60) return `The /${phoneme.symbol}/ sound needs more emphasis and clarity.`;
      if (phoneme.score >= 50) return `Focus on improving the /${phoneme.symbol}/ sound - try practicing it slowly.`;
      return `The /${phoneme.symbol}/ sound needs significant improvement. Practice this sound in isolation first.`;
    });

    return `Issues found:\n• ${feedbackParts.join('\n• ')}`;
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setClickedPhoneme(null);
    };

    if (clickedPhoneme) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [clickedPhoneme]);

  return (
    <div className={cn(
      "space-y-4",
      isEditing && "bg-gray-50 rounded-lg p-6"
    )}>
      {/* Pronunciation Score Legend */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Pronunciation Score Guide</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-500">●</span>
            <span>Perfect</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span>Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">●</span>
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">●</span>
            <span>Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-500">●</span>
            <span>Getting There</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">●</span>
            <span>Keep Practicing</span>
          </div>
        </div>
      </div>

      {feedbackToUse?.pronunciation?.word_details && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-base">Word</TableHead>
                <TableHead className="text-base">IPA + Definition</TableHead>
                <TableHead className="text-center text-base">Correct Audio</TableHead>
                <TableHead className="text-center text-base">Student Audio</TableHead>
                {isEditing && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {wordsToShow.map((word: WordScore, wordIndex: number) => (
                <TableRow key={wordIndex}>
                  <TableCell className="font-medium text-base">{word.word}</TableCell>
                  <TableCell>
                    <div className="relative">
                      <div 
                        className="inline-flex cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        onClick={(e) => handleWordIpaClick(wordIndex, e)}
                        title={`Click for pronunciation feedback on "${word.word}"`}
                      >
                        <span className="text-base font-mono text-gray-600">/</span>
                        {word.phoneme_details?.map((phoneme: { phoneme: string; accuracy_score: number }, idx: number) => (
                          <span 
                            key={idx} 
                            className={`text-base font-mono ${getPhonemeColor(phoneme.accuracy_score)}`}
                          >
                            {convertPhonemeToIPA(phoneme.phoneme)}
                          </span>
                        ))}
                        <span className="text-base font-mono text-gray-600">/</span>
                      </div>
                      
                      {clickedPhoneme === `word-${wordIndex}` && (
                        <div className="absolute top-full left-0 mt-2 px-4 py-3 bg-white text-gray-900 text-sm rounded-md shadow-lg border border-gray-200 z-50 w-96">
                          <div className="font-medium text-gray-900 mb-2">
                            Pronunciation Feedback for "{word.word}"
                          </div>
                          <div className="text-gray-600 whitespace-pre-line">
                            {generateWordPhonemeFeedback(word)}
                          </div>
                          <div className="absolute top-0 left-8 transform -translate-y-1 border-4 border-transparent border-b-white"></div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handlePlayTTSAudio(word.word)}
                      disabled={ttsLoading[`tts_${word.word.toLowerCase()}`]}
                    >
                      {ttsLoading[`tts_${word.word.toLowerCase()}`] ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handlePlayWordSegment(word, wordIndex)}
                      disabled={!word.offset || !word.duration}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </TableCell>
                  {isEditing && (
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteWord(word)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PronunciationAnalysis;