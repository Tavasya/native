// utils/feedback/textUtils.ts

import { Mistake, MistakePosition, GrammarIssue, LexicalIssue, SectionFeedback } from '@/types/feedback';

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

export const createHighlightedText = (
  text: string,
  currentFeedback: SectionFeedback | null,
  highlightType: 'none' | 'grammar' | 'vocabulary',
  selectedQuestionIndex: number,
  openPopover: string | null,
  setOpenPopover: (id: string | null) => void
) => {
  if (!text || !currentFeedback || highlightType === 'none') return text;

  let mistakesToHighlight: Mistake[] = [];
  
  if (highlightType === 'grammar' && currentFeedback.grammar?.issues) {
    mistakesToHighlight = currentFeedback.grammar.issues.map((issue: GrammarIssue) => ({
      text: issue.correction.original_phrase || issue.original || '',
      explanation: issue.correction.explanation || '',
      suggestion: issue.correction.suggested_correction || '',
      type: 'Grammar',
      color: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors'
    }));
  } else if (highlightType === 'vocabulary' && currentFeedback.lexical?.issues) {
    mistakesToHighlight = currentFeedback.lexical.issues.map((issue: LexicalIssue) => ({
      text: issue.suggestion.original_phrase || issue.sentence || '',
      explanation: issue.suggestion.explanation || '',
      suggestion: issue.suggestion.suggested_phrase || '',
      type: 'Vocabulary',
      color: 'bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors'
    }));
  }

  if (mistakesToHighlight.length === 0) return text;

  // Sort mistakes by length (longest first) to avoid partial replacements
  mistakesToHighlight.sort((a, b) => b.text.length - a.text.length);
  let result = [];
  let lastIndex = 0;
  let processedText = text;

  // Find all mistake positions
  const mistakePositions: MistakePosition[] = [];
  mistakesToHighlight.forEach((mistake, index) => {
    if (!mistake.text) return; // Skip empty text
    const escapedText = mistake.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedText, 'i');
    const match = processedText.match(regex);
    if (match && match.index !== undefined) {
      mistakePositions.push({
        start: match.index,
        end: match.index + mistake.text.length,
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
      pos.start >= existing.start && pos.start < existing.end || 
      pos.end > existing.start && pos.end <= existing.end
    );
    if (!overlaps) {
      filteredPositions.push(pos);
    }
  });

  // Build the result with hover tooltips
  filteredPositions.forEach((pos, index) => {
    if (pos.start > lastIndex) {
      result.push(processedText.slice(lastIndex, pos.start));
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

  if (lastIndex < processedText.length) {
    result.push(processedText.slice(lastIndex));
  }
  return result.length > 0 ? result : [text];
};