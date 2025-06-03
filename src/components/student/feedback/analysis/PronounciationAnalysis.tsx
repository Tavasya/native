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

  return (
    <div className={cn(
      "space-y-4",
      isEditing && "bg-gray-50 rounded-lg p-6"
    )}>
      {feedbackToUse?.pronunciation?.word_details && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-base">Word</TableHead>
                <TableHead className="text-base">IPA + Definition</TableHead>
                <TableHead className="text-center text-base">Score</TableHead>
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
                    <div className="flex">
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
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-base font-medium ${getScoreColor(word.accuracy_score)}`}>
                      {word.accuracy_score}
                    </span>
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