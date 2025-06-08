// utils/feedback/textUtils.ts

import { Mistake, MistakePosition, GrammarIssue, SectionFeedback } from '@/types/feedback';

// Extended grammar type to handle v2 format
interface ExtendedGrammar {
  grade: number;
  issues: any[];
  grammar_corrections?: {
    [key: string]: {
      original: string;
      corrections: Array<{
        type: string;
        explanation: string;
        phrase_index: number;
        sentence_text: string;
        sentence_index: number;
        original_phrase: string;
        suggested_correction: string;
      }>;
    };
  };
}

// Extended vocabulary type to handle v2 format
interface ExtendedVocabulary {
  grade: number;
  vocabulary_suggestions?: {
    [key: string]: {
      original_word: string;
      suggested_word: string;
      explanation: string;
      examples: string[];
      original_level: string;
      suggested_level: string;
      sentence_index?: number;
      phrase_index?: number;
    };
  };
}

export const phonemeToIPA: { [key: string]: string } = {
  'aa': 'ɑ',
  'ae': 'æ',
  'ah': 'ʌ',
  'ao': 'ɔ',
  'aw': 'aʊ',
  'ax': 'ə',
  'ay': 'aɪ',
  'b': 'b',
  'ch': 'tʃ',
  'd': 'd',
  'dh': 'ð',
  'eh': 'ɛ',
  'er': 'ɝ',
  'ey': 'eɪ',
  'f': 'f',
  'g': 'g',
  'hh': 'h',
  'ih': 'ɪ',
  'iy': 'i',
  'jh': 'dʒ',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'ng': 'ŋ',
  'ow': 'oʊ',
  'oy': 'ɔɪ',
  'p': 'p',
  'r': 'r',
  's': 's',
  'sh': 'ʃ',
  't': 't',
  'th': 'θ',
  'uh': 'ʊ',
  'uw': 'u',
  'v': 'v',
  'w': 'w',
  'y': 'j',
  'z': 'z',
  'zh': 'ʒ'
};

export const convertPhonemeToIPA = (phoneme: string): string => {
  return phonemeToIPA[phoneme] || phoneme;
};

// Helper function to find text position using multiple strategies
const findTextPosition = (
  allText: string, 
  targetPhrase: string,
  sentenceIndex?: number
): { start: number; end: number } | null => {
  if (!targetPhrase) return null;

  // Strategy 1: If we have sentence index, try to use it
  if (sentenceIndex !== undefined && sentenceIndex >= 0) {
    // Try different sentence splitting methods
    const splittingMethods = [
      // Method 1: Split by periods
      () => allText.split(/\.(?:\s+|$)/).filter(s => s.trim().length > 0),
      // Method 2: Split by sentence-ending punctuation
      () => allText.split(/[.!?]+\s+/).filter(s => s.trim().length > 0),
      // Method 3: Split by "uh" or other filler words as potential sentence boundaries
      () => allText.split(/\.\s*uh\s*/i).filter(s => s.trim().length > 0),
      // Method 4: More liberal splitting
      () => allText.split(/(?:[.!?]\s+)|(?:\s+uh\s+)/i).filter(s => s.trim().length > 0)
    ];

    for (const splittingMethod of splittingMethods) {
      try {
        const sentences = splittingMethod();
        if (sentenceIndex < sentences.length) {
          const targetSentence = sentences[sentenceIndex];
          
          // Find this sentence in the original text
          const sentenceStart = allText.toLowerCase().indexOf(targetSentence.toLowerCase());
          if (sentenceStart !== -1) {
            // Find the phrase within this sentence
            const phraseIndex = targetSentence.toLowerCase().indexOf(targetPhrase.toLowerCase());
            if (phraseIndex !== -1) {
              return {
                start: sentenceStart + phraseIndex,
                end: sentenceStart + phraseIndex + targetPhrase.length
              };
            }
          }
        }
      } catch (e) {
        // Continue to next method if this one fails
        continue;
      }
    }
  }

  // Strategy 2: Global search with some intelligence
  const escapedText = targetPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedText, 'gi'); // Global and case insensitive
  
  let match;
  const matches = [];
  while ((match = regex.exec(allText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + targetPhrase.length
    });
  }

  // If we have sentence index info, try to pick the most appropriate match
  if (matches.length > 1 && sentenceIndex !== undefined) {
    // Rough estimation: divide text into approximate sentence chunks
    const approximateSentenceLength = allText.length / 10; // Assume ~10 sentences
    const expectedPosition = sentenceIndex * approximateSentenceLength;
    
    // Find the match closest to expected position
    let bestMatch = matches[0];
    let bestDistance = Math.abs(matches[0].start - expectedPosition);
    
    for (const match of matches) {
      const distance = Math.abs(match.start - expectedPosition);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = match;
      }
    }
    
    return bestMatch;
  }

  // Return first match if found
  return matches.length > 0 ? matches[0] : null;
};

// Helper function to split text into sentences - more flexible approach
const splitIntoSentences = (text: string): string[] => {
  // Split by periods, but be more flexible about sentence boundaries
  // This handles cases where sentences might not end with proper punctuation
  const sentences = text.split(/\.(?:\s+|$)/).filter(s => s.trim().length > 0);
  
  // If no periods found, split by other potential sentence boundaries
  if (sentences.length === 1) {
    return text.split(/(?:\.\s+|;\s+|!\s+|\?\s+)/).filter(s => s.trim().length > 0);
  }
  
  return sentences;
};

// Helper function to find text position using sentence index
const findTextInSentence = (
  allText: string, 
  targetSentenceIndex: number, 
  targetPhrase: string
): { start: number; end: number } | null => {
  // First, try to use sentence boundaries to locate the text
  const sentences = splitIntoSentences(allText);
  
  // If we have a valid sentence index and it's within bounds
  if (targetSentenceIndex >= 0 && targetSentenceIndex < sentences.length) {
    const targetSentence = sentences[targetSentenceIndex];
    
    // Find where this sentence appears in the original text
    let sentenceStartInText = 0;
    for (let i = 0; i < targetSentenceIndex; i++) {
      const sentenceToFind = sentences[i];
      const foundAt = allText.indexOf(sentenceToFind, sentenceStartInText);
      if (foundAt !== -1) {
        sentenceStartInText = foundAt + sentenceToFind.length;
        // Skip any whitespace or punctuation between sentences
        while (sentenceStartInText < allText.length && 
               /[\s\.]/.test(allText[sentenceStartInText])) {
          sentenceStartInText++;
        }
      }
    }
    
    // Now find the target sentence in the text
    const targetSentenceStart = allText.indexOf(targetSentence, Math.max(0, sentenceStartInText - 50));
    if (targetSentenceStart !== -1) {
      // Find the phrase within this sentence
      const phraseIndex = targetSentence.toLowerCase().indexOf(targetPhrase.toLowerCase());
      if (phraseIndex !== -1) {
        return {
          start: targetSentenceStart + phraseIndex,
          end: targetSentenceStart + phraseIndex + targetPhrase.length
        };
      }
    }
  }
  
  return null;
};

export const createHighlightedText = (
  text: string,
  currentFeedback: SectionFeedback | null,
  highlightType: 'none' | 'grammar' | 'vocabulary',
  selectedQuestionIndex: number,
  openPopover: string | null,
  setOpenPopover: (id: string | null) => void
) => {
  if (!text || !currentFeedback || highlightType === 'none') return text;

  let mistakesToHighlight: Array<Mistake & { sentenceIndex?: number; phraseIndex?: number }> = [];
  
  if (highlightType === 'grammar') {
    // Try v2 format first (grammar_corrections inside grammar)
    const extendedGrammar = currentFeedback.grammar as ExtendedGrammar;
    if (extendedGrammar?.grammar_corrections) {
      mistakesToHighlight = Object.entries(extendedGrammar.grammar_corrections)
        .map(([_, correction]) => ({
          text: correction.corrections[0]?.original_phrase || correction.original || '',
          explanation: correction.corrections[0]?.explanation || '',
          suggestion: correction.corrections[0]?.suggested_correction || '',
          type: 'Grammar',
          color: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors',
          sentenceIndex: correction.corrections[0]?.sentence_index,
          phraseIndex: correction.corrections[0]?.phrase_index
        }));
    }
    // Try v1 format (grammar.issues)
    else if (currentFeedback.grammar?.issues) {
      if (Array.isArray(currentFeedback.grammar.issues)) {
        mistakesToHighlight = currentFeedback.grammar.issues.map((issue: GrammarIssue) => {
          let textToHighlight = issue.correction?.original_phrase || '';
          
          if (!textToHighlight && issue.original) {
            if (issue.correction?.suggested_correction) {
              const suggestedWords = issue.correction.suggested_correction.split(' ');
              if (suggestedWords.length <= 3) {
                const originalWords = issue.original.split(' ');
                const matchingIndex = originalWords.findIndex(word => 
                  suggestedWords.some(suggested => 
                    word.toLowerCase().includes(suggested.toLowerCase())
                  )
                );
                if (matchingIndex !== -1) {
                  textToHighlight = originalWords[matchingIndex];
                }
              }
            }
          }
          
          return {
            text: textToHighlight || issue.original || '',
            explanation: issue.correction?.explanation || '',
            suggestion: issue.correction?.suggested_correction || '',
            type: 'Grammar',
            color: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors',
            sentenceIndex: issue.sentence_index,
            phraseIndex: issue.phrase_index
          };
        });
      }
    }
  } else if (highlightType === 'vocabulary') {
    const extendedVocabulary = currentFeedback.vocabulary as ExtendedVocabulary;
    if (extendedVocabulary?.vocabulary_suggestions) {
      mistakesToHighlight = Object.entries(extendedVocabulary.vocabulary_suggestions)
        .map(([_, suggestion]) => ({
          text: suggestion.original_word || '',
          explanation: suggestion.explanation || '',
          suggestion: suggestion.suggested_word || '',
          type: 'Vocabulary',
          color: 'bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors',
          sentenceIndex: suggestion.sentence_index,
          phraseIndex: suggestion.phrase_index
        }));
    }
  }

  if (mistakesToHighlight.length === 0) return text;

  // Find precise positions using sentence and phrase indices
  const mistakePositions: MistakePosition[] = [];
  mistakesToHighlight.forEach((mistake, index) => {
    if (!mistake.text) return;

    let position = null;

    // If we have sentence index, use the new robust method
    if (mistake.sentenceIndex !== undefined) {
      position = findTextPosition(text, mistake.text, mistake.sentenceIndex);
    } else {
      // Fallback to global search
      position = findTextPosition(text, mistake.text);
    }

    if (position) {
      mistakePositions.push({
        start: position.start,
        end: position.end,
        mistake,
        index
      });
    }
  });

  // Sort by position and remove overlaps
  mistakePositions.sort((a, b) => a.start - b.start);
  const filteredPositions: MistakePosition[] = [];
  mistakePositions.forEach(pos => {
    const overlaps = filteredPositions.some(existing => 
      (pos.start >= existing.start && pos.start < existing.end) || 
      (pos.end > existing.start && pos.end <= existing.end) ||
      (pos.start <= existing.start && pos.end >= existing.end)
    );
    if (!overlaps) {
      filteredPositions.push(pos);
    }
  });

  // Build the result with hover tooltips
  let result = [];
  let lastIndex = 0;

  filteredPositions.forEach((pos, index) => {
    if (pos.start > lastIndex) {
      result.push(text.slice(lastIndex, pos.start));
    }

    const mistakeId = `mistake-${selectedQuestionIndex}-${highlightType}-${index}`;
    result.push(
      <span
        key={mistakeId}
        className={`${pos.mistake.color} px-1 py-0.5 rounded border relative group`}
        onMouseEnter={() => setOpenPopover(mistakeId)}
        onMouseLeave={() => setOpenPopover(null)}
      >
        {pos.mistake.text}
        {openPopover === mistakeId && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-white text-gray-900 text-sm rounded-md shadow-sm border border-gray-200 z-50 w-96">
            <div className="font-medium text-gray-900">{pos.mistake.type}</div>
            {pos.mistake.suggestion && (
              <div className="mt-2">
                <div className="text-xs text-gray-500">Suggestion:</div>
                <div className="font-medium text-green-600">{pos.mistake.suggestion}</div>
              </div>
            )}
            <div className="mt-2">
              <div className="text-xs text-gray-500">Explanation:</div>
              <div className="text-gray-600">{pos.mistake.explanation}</div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
          </div>
        )}
      </span>
    );
    lastIndex = pos.end;
  });

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
};