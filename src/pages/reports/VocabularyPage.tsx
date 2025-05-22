import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabSuggestion } from '@/components/VocabSuggestion';
import { BookText } from 'lucide-react';

interface VocabPosition {
  sentence: number;
  word: string;
  occurrence: number;
}

interface VocabIssue {
  id: string;
  type: 'basic' | 'advanced' | 'academic' | 'technical' | 'formal' | 'informal' | 'precise' | 'idiomatic';
  position: VocabPosition;
  suggestion: string;
  explanation: string;
}

const initialVocabIssues: VocabIssue[] = [
  {
    id: '1',
    type: 'advanced',
    position: { sentence: 1, word: 'big', occurrence: 1 },
    suggestion: 'big → substantial',
    explanation: 'Using "substantial" elevates the formality and precision of your statement, showing advanced vocabulary mastery.',
  },
  {
    id: '2',
    type: 'precise',
    position: { sentence: 1, word: 'said', occurrence: 1 },
    suggestion: 'said → articulated',
    explanation: 'The word "articulated" more precisely describes the careful expression of thoughts or ideas.',
  },
  {
    id: '3',
    type: 'formal',
    position: { sentence: 2, word: 'a lot of', occurrence: 1 },
    suggestion: 'a lot of → numerous',
    explanation: 'In formal writing, replace "a lot of" with more specific quantifiers like "numerous" for better precision.',
  },
  {
    id: '4',
    type: 'academic',
    position: { sentence: 2, word: 'thinking', occurrence: 1 },
    suggestion: 'thinking → cognitive processing',
    explanation: 'The academic term "cognitive processing" is more appropriate in scholarly contexts when discussing mental activities.',
  },
  {
    id: '5',
    type: 'idiomatic',
    position: { sentence: 3, word: 'at the end of the day', occurrence: 1 },
    suggestion: 'at the end of the day → ultimately',
    explanation: 'Replace this common idiom with "ultimately" for more concise and formal expression.',
  },
];

const sampleTexts = [
  "The presentation had a big impact on the audience. The speaker said the most important points clearly.",
  "There were a lot of factors to consider when thinking about the implications of the research findings.",
  "At the end of the day, we need to focus on practical applications of these theories in real-world scenarios.",
];

const VocabularyPage = () => {
  const [vocabIssues, setVocabIssues] = useState<VocabIssue[]>(initialVocabIssues);

  const handleAcceptSuggestion = (id: string) => {
    setVocabIssues(vocabIssues.filter(issue => issue.id !== id));
  };

  const handleDismissSuggestion = (id: string) => {
    setVocabIssues(vocabIssues.filter(issue => issue.id !== id));
  };

  // Get original text for a suggestion
  const getOriginalText = (issue: VocabIssue) => {
    const sentenceIndex = issue.position.sentence - 1;
    if (sentenceIndex >= 0 && sentenceIndex < sampleTexts.length) {
      const text = sampleTexts[sentenceIndex];
      if (text.includes(issue.position.word)) {
        return issue.position.word;
      }
    }
    return issue.suggestion.split(' → ')[0] || issue.position.word;
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-semibold text-center">Lexical Resources</h2>
        <p className="text-gray-500 text-center mt-2">Vocabulary enhancement suggestions to elevate your language</p>
      </div>

      <div className="bg-white rounded-lg border shadow p-6">
        {vocabIssues.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {vocabIssues.map((issue) => (
                <VocabSuggestion
                  key={issue.id}
                  issue={issue}
                  originalText={getOriginalText(issue)}
                  onAccept={() => handleAcceptSuggestion(issue.id)}
                  onDismiss={() => handleDismissSuggestion(issue.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
            <BookText size={48} className="mb-4 text-brand-blue opacity-50" />
            <p className="text-lg">No vocabulary issues detected</p>
            <p className="text-sm mt-2">Your lexical choices look great!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
