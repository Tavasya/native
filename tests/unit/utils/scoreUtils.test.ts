/**
 * Unit tests for score calculation utilities
 * Tests core business logic for scoring algorithms and UI display logic
 */

import {
  calculateOverallPronunciationScore,
  getWordsToShow,
  getSpeedCategory,
  getScoreColor,
  getPhonemeColor
} from '../../../src/utils/feedback/scoreUtils';

describe('Score Calculation Utilities', () => {
  describe('calculateOverallPronunciationScore', () => {
    it('should return 0 for empty word details array', () => {
      const result = calculateOverallPronunciationScore([]);
      expect(result).toBe(0);
    });

    it('should return 0 for null or undefined input', () => {
      expect(calculateOverallPronunciationScore(null as any)).toBe(0);
      expect(calculateOverallPronunciationScore(undefined as any)).toBe(0);
    });

    it('should calculate average score correctly for single word', () => {
      const wordDetails = [
        { word: 'hello', accuracy_score: 85 }
      ];
      const result = calculateOverallPronunciationScore(wordDetails);
      expect(result).toBe(85);
    });

    it('should calculate average score correctly for multiple words', () => {
      const wordDetails = [
        { word: 'hello', accuracy_score: 80 },
        { word: 'world', accuracy_score: 90 },
        { word: 'test', accuracy_score: 70 }
      ];
      // Average: (80 + 90 + 70) / 3 = 80
      const result = calculateOverallPronunciationScore(wordDetails);
      expect(result).toBe(80);
    });

    it('should round to nearest integer', () => {
      const wordDetails = [
        { word: 'word1', accuracy_score: 83 },
        { word: 'word2', accuracy_score: 84 }
      ];
      // Average: (83 + 84) / 2 = 83.5, should round to 84
      const result = calculateOverallPronunciationScore(wordDetails);
      expect(result).toBe(84);
    });

    it('should handle words with missing accuracy_score (treat as 0)', () => {
      const wordDetails = [
        { word: 'word1', accuracy_score: 90 },
        { word: 'word2' }, // Missing accuracy_score
        { word: 'word3', accuracy_score: 80 }
      ];
      // Average: (90 + 0 + 80) / 3 = 56.67, should round to 57
      const result = calculateOverallPronunciationScore(wordDetails);
      expect(result).toBe(57);
    });

    it('should handle extreme scores correctly', () => {
      const wordDetails = [
        { word: 'perfect', accuracy_score: 100 },
        { word: 'terrible', accuracy_score: 0 },
        { word: 'average', accuracy_score: 50 }
      ];
      // Average: (100 + 0 + 50) / 3 = 50
      const result = calculateOverallPronunciationScore(wordDetails);
      expect(result).toBe(50);
    });
  });

  describe('getWordsToShow', () => {
    it('should return empty array for empty input', () => {
      const result = getWordsToShow([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for null or undefined input', () => {
      expect(getWordsToShow(null as any)).toEqual([]);
      expect(getWordsToShow(undefined as any)).toEqual([]);
    });

    it('should filter out words with 2 letters or less', () => {
      const wordDetails = [
        { word: 'a', accuracy_score: 60 },
        { word: 'to', accuracy_score: 60 },
        { word: 'the', accuracy_score: 60 },
        { word: 'hello', accuracy_score: 60 }
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toHaveLength(2);
      expect(result.map(w => w.word)).toEqual(['the', 'hello']);
    });

    it('should filter out words with scores 70 or above', () => {
      const wordDetails = [
        { word: 'excellent', accuracy_score: 90 },
        { word: 'good', accuracy_score: 80 },
        { word: 'needs_work', accuracy_score: 65 },
        { word: 'poor', accuracy_score: 60 }
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toHaveLength(2);
      expect(result.map(w => w.word)).toEqual(['needs_work', 'poor']);
    });

    it('should apply both filters: length and score', () => {
      const wordDetails = [
        { word: 'a', accuracy_score: 60 }, // Too short
        { word: 'excellent', accuracy_score: 90 }, // Score too high
        { word: 'the', accuracy_score: 85 }, // Score too high
        { word: 'needs_work', accuracy_score: 65 }, // Should show
        { word: 'bad', accuracy_score: 60 } // Should show
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toHaveLength(2);
      expect(result.map(w => w.word)).toEqual(['needs_work', 'bad']);
    });

    it('should return empty array if all words are filtered out', () => {
      const wordDetails = [
        { word: 'a', accuracy_score: 60 }, // Too short
        { word: 'to', accuracy_score: 60 }, // Too short
        { word: 'excellent', accuracy_score: 90 }, // Score too high
        { word: 'perfect', accuracy_score: 95 } // Score too high
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toEqual([]);
    });

    it('should handle edge case: exactly 69 score (should show)', () => {
      const wordDetails = [
        { word: 'borderline', accuracy_score: 69 }
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toHaveLength(1);
      expect(result[0].word).toBe('borderline');
    });

    it('should handle edge case: exactly 70 score (should not show)', () => {
      const wordDetails = [
        { word: 'borderline', accuracy_score: 70 }
      ];
      const result = getWordsToShow(wordDetails);
      expect(result).toEqual([]);
    });
  });

  describe('getSpeedCategory', () => {
    it('should categorize very slow speech correctly', () => {
      const result = getSpeedCategory(50);
      expect(result).toEqual({
        category: 'Too Slow',
        color: 'bg-[#ef5136]'
      });
    });

    it('should categorize slow speech correctly', () => {
      const result = getSpeedCategory(120);
      expect(result).toEqual({
        category: 'Slow',
        color: 'bg-[#feb622]'
      });
    });

    it('should categorize good speech speed correctly', () => {
      const result = getSpeedCategory(150);
      expect(result).toEqual({
        category: 'Good',
        color: 'bg-green-500'
      });
    });

    it('should categorize fast speech correctly', () => {
      const result = getSpeedCategory(180);
      expect(result).toEqual({
        category: 'Fast',
        color: 'bg-[#feb622]'
      });
    });

    it('should categorize very fast speech correctly', () => {
      const result = getSpeedCategory(250);
      expect(result).toEqual({
        category: 'Too Fast',
        color: 'bg-[#ef5136]'
      });
    });

    it('should handle boundary cases correctly', () => {
      // Test exact boundaries
      expect(getSpeedCategory(99)).toEqual({
        category: 'Too Slow',
        color: 'bg-[#ef5136]'
      });
      
      expect(getSpeedCategory(100)).toEqual({
        category: 'Slow',
        color: 'bg-[#feb622]'
      });
      
      expect(getSpeedCategory(130)).toEqual({
        category: 'Good',
        color: 'bg-green-500'
      });
      
      expect(getSpeedCategory(170)).toEqual({
        category: 'Fast',
        color: 'bg-[#feb622]'
      });
      
      expect(getSpeedCategory(200)).toEqual({
        category: 'Too Fast',
        color: 'bg-[#ef5136]'
      });
    });

    it('should handle zero and negative values', () => {
      expect(getSpeedCategory(0)).toEqual({
        category: 'Too Slow',
        color: 'bg-[#ef5136]'
      });
      
      expect(getSpeedCategory(-10)).toEqual({
        category: 'Too Slow',
        color: 'bg-[#ef5136]'
      });
    });
  });

  describe('getScoreColor', () => {
    it('should return correct color for excellent scores (90+)', () => {
      expect(getScoreColor(95)).toBe('text-green-500');
      expect(getScoreColor(90)).toBe('text-green-500');
      expect(getScoreColor(100)).toBe('text-green-500');
    });

    it('should return correct color for very good scores (80-89)', () => {
      expect(getScoreColor(85)).toBe('text-green-400');
      expect(getScoreColor(80)).toBe('text-green-400');
      expect(getScoreColor(89)).toBe('text-green-400');
    });

    it('should return correct color for good scores (70-79)', () => {
      expect(getScoreColor(75)).toBe('text-yellow-400');
      expect(getScoreColor(70)).toBe('text-yellow-400');
      expect(getScoreColor(79)).toBe('text-yellow-400');
    });

    it('should return correct color for fair scores (60-69)', () => {
      expect(getScoreColor(65)).toBe('text-orange-400');
      expect(getScoreColor(60)).toBe('text-orange-400');
      expect(getScoreColor(69)).toBe('text-orange-400');
    });

    it('should return correct color for poor scores (50-59)', () => {
      expect(getScoreColor(55)).toBe('text-orange-500');
      expect(getScoreColor(50)).toBe('text-orange-500');
      expect(getScoreColor(59)).toBe('text-orange-500');
    });

    it('should return correct color for very poor scores (<50)', () => {
      expect(getScoreColor(40)).toBe('text-red-400');
      expect(getScoreColor(0)).toBe('text-red-400');
      expect(getScoreColor(49)).toBe('text-red-400');
    });

    it('should handle edge cases and invalid inputs', () => {
      expect(getScoreColor(-5)).toBe('text-red-400');
      expect(getScoreColor(105)).toBe('text-green-500'); // Scores above 100
    });
  });

  describe('getPhonemeColor', () => {
    it('should return correct color for excellent phoneme scores (90+)', () => {
      expect(getPhonemeColor(95)).toBe('text-green-500');
      expect(getPhonemeColor(90)).toBe('text-green-500');
      expect(getPhonemeColor(100)).toBe('text-green-500');
    });

    it('should return correct color for very good phoneme scores (80-89)', () => {
      expect(getPhonemeColor(85)).toBe('text-green-400');
      expect(getPhonemeColor(80)).toBe('text-green-400');
      expect(getPhonemeColor(89)).toBe('text-green-400');
    });

    it('should return correct color for good phoneme scores (70-79)', () => {
      expect(getPhonemeColor(75)).toBe('text-yellow-400');
      expect(getPhonemeColor(70)).toBe('text-yellow-400');
      expect(getPhonemeColor(79)).toBe('text-yellow-400');
    });

    it('should return correct color for fair phoneme scores (60-69)', () => {
      expect(getPhonemeColor(65)).toBe('text-orange-400');
      expect(getPhonemeColor(60)).toBe('text-orange-400');
      expect(getPhonemeColor(69)).toBe('text-orange-400');
    });

    it('should return correct color for poor phoneme scores (50-59)', () => {
      expect(getPhonemeColor(55)).toBe('text-orange-500');
      expect(getPhonemeColor(50)).toBe('text-orange-500');
      expect(getPhonemeColor(59)).toBe('text-orange-500');
    });

    it('should return correct color for very poor phoneme scores (<50)', () => {
      expect(getPhonemeColor(40)).toBe('text-red-400');
      expect(getPhonemeColor(0)).toBe('text-red-400');
      expect(getPhonemeColor(49)).toBe('text-red-400');
    });

    it('should handle edge cases for phonemes', () => {
      expect(getPhonemeColor(-10)).toBe('text-red-400');
      expect(getPhonemeColor(110)).toBe('text-green-500');
    });
  });

  describe('Integration scenarios', () => {
    it('should work correctly with realistic pronunciation data', () => {
      const wordDetails = [
        { word: 'hello', accuracy_score: 85 },
        { word: 'pronunciation', accuracy_score: 62 },
        { word: 'excellent', accuracy_score: 92 }, // Won't show (score too high)
        { word: 'the', accuracy_score: 65 }, // Will show (score < 70)
        { word: 'difficult', accuracy_score: 58 }
      ];

      // Test overall score calculation
      const overallScore = calculateOverallPronunciationScore(wordDetails);
      expect(overallScore).toBe(72); // (85+62+92+65+58)/5 = 72.4 → 72

             // Test words to show filtering
       const wordsToShow = getWordsToShow(wordDetails);
       expect(wordsToShow).toHaveLength(3); // 'pronunciation', 'the', and 'difficult' (all < 70)
       expect(wordsToShow.map(w => w.word)).toEqual(['pronunciation', 'the', 'difficult']);

      // Test color coding
      expect(getScoreColor(overallScore)).toBe('text-yellow-400'); // 72 is in 70-79 range
    });

    it('should handle mixed quality pronunciation results', () => {
      const wordDetails = [
        { word: 'perfect', accuracy_score: 98 },
        { word: 'struggles', accuracy_score: 45 },
        { word: 'average', accuracy_score: 65 }
      ];

      const overallScore = calculateOverallPronunciationScore(wordDetails);
      expect(overallScore).toBe(69); // (98+45+65)/3 = 69.33 → 69

      const wordsToShow = getWordsToShow(wordDetails);
      expect(wordsToShow).toHaveLength(2); // 'struggles' and 'average'
      
      // Verify color coding for different scores
      expect(getScoreColor(98)).toBe('text-green-500');
      expect(getScoreColor(45)).toBe('text-red-400');
      expect(getScoreColor(65)).toBe('text-orange-400');
    });
  });
}); 