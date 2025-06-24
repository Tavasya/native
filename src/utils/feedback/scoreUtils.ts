// utils/feedback/scoreUtils.ts

import { SpeedCategory } from '@/types/feedback';

export const getScoreColor = (score: number | null, isTest: boolean = false): string => {
  if (score === null) return "text-gray-400";
  if (isTest) {
    return "text-orange-500";
  }
  if (score >= 90) return "text-green-500";
  if (score >= 80) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 50) return "text-orange-500";
  return "text-red-400";
};

export const getPhonemeColor = (score: number): string => {
  if (score >= 90) return "text-green-500";
  if (score >= 80) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 50) return "text-orange-500";
  return "text-red-400";
};

export const getSpeedCategory = (wpm: number): SpeedCategory => {
  if (wpm < 70) return { category: 'Too Slow', color: 'bg-[#ef5136]' };
  if (wpm < 100) return { category: 'Slow', color: 'bg-[#feb622]' };
  if (wpm < 140) return { category: 'Good', color: 'bg-green-500' };
  if (wpm < 170) return { category: 'Fast', color: 'bg-[#feb622]' };
  return { category: 'Too Fast', color: 'bg-[#ef5136]' };
};

export const calculateOverallPronunciationScore = (wordDetails: any[]): number => {
  if (!wordDetails || wordDetails.length === 0) {
    return 0;
  }
  
  // Calculate weighted average based on word accuracy scores
  const totalScore = wordDetails.reduce((sum, word) => sum + (word.accuracy_score || 0), 0);
  const averageScore = totalScore / wordDetails.length;
  
  // Round to nearest integer
  return Math.round(averageScore);
};

export const getWordsToShow = (wordDetails: any[]): any[] => {
  if (!wordDetails || wordDetails.length === 0) return [];
  
  // Blacklist of words to exclude
  const blacklistedWords = ['vietnam', 'hanoi'];
  
  // First, filter out words that are 2 letters or less
  const validWords = wordDetails.filter(word => word.word.length > 2);
  
  // Then filter out blacklisted words
  const nonBlacklistedWords = validWords.filter(word => 
    !blacklistedWords.includes(word.word.toLowerCase())
  );
  
  // Show words that have low accuracy scores OR have phonemes with low scores
  const filteredWords = nonBlacklistedWords.filter(word => {
    // Show if overall word score is low
    if (word.accuracy_score < 70) return true;
    
    // Also show if any phoneme has a low score (below 70)
    if (word.phoneme_details && Array.isArray(word.phoneme_details)) {
      return word.phoneme_details.some((phoneme: any) => phoneme.accuracy_score < 70);
    }
    
    return false;
  });
  
  // Always return filtered words, even if empty
  return filteredWords;
};