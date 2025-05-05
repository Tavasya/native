
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GrammarSuggestion } from '@/components/GrammarSuggestion';

interface GrammarPosition {
  sentence: number;
  word: string;
  occurrence: number;
}

interface GrammarIssue {
  id: string;
  type: 'correctness' | 'clarity' | 'style' | 'vocab' | 'tense' | 'article' | 'plural' | 'preposition' | 'pronunciation';
  position: GrammarPosition;
  suggestion: string;
  explanation: string;
}

const GrammarPage = () => {
  // Original text split into sentences
  const [sentences, setSentences] = useState<string[]>([
    "I thinks that the education system need to be improve.",
    "There are many student who struggles with the current methods.",
    "In my opinion, we should focusing on practical skills rather then just theoretical knowledge."
  ]);
  
  // Grammar issues with sentence-based positioning
  const [issues, setIssues] = useState<GrammarIssue[]>([
    {
      id: '1',
      type: 'correctness',
      position: { sentence: 0, word: "thinks", occurrence: 1 },
      suggestion: 'thinks → think',
      explanation: 'Subject-verb agreement: "I" requires the base form of the verb without -s'
    },
    {
      id: '2',
      type: 'correctness',
      position: { sentence: 0, word: "need", occurrence: 1 },
      suggestion: 'need → needs',
      explanation: 'Subject-verb agreement: "system" is singular and requires "needs"'
    },
    {
      id: '3',
      type: 'correctness',
      position: { sentence: 0, word: "improve", occurrence: 1 },
      suggestion: 'improve → improved',
      explanation: 'Passive voice construction requires past participle'
    },
    {
      id: '4',
      type: 'plural',
      position: { sentence: 1, word: "student", occurrence: 1 },
      suggestion: 'student → students',
      explanation: 'Plural noun needed here'
    },
    {
      id: '5',
      type: 'correctness',
      position: { sentence: 1, word: "struggles", occurrence: 1 },
      suggestion: 'struggles → struggle',
      explanation: 'Subject-verb agreement: "students" (plural) requires "struggle"'
    },
    {
      id: '6',
      type: 'tense',
      position: { sentence: 2, word: "focusing", occurrence: 1 },
      suggestion: 'focusing → focus',
      explanation: 'After "should," use the base form of the verb'
    },
    {
      id: '7',
      type: 'preposition',
      position: { sentence: 2, word: "then", occurrence: 1 },
      suggestion: 'then → than',
      explanation: '"Than" is used for comparisons; "then" refers to time'
    }
  ]);

  // Find word positions within sentences
  const findWordPositions = (sentenceIndex: number, wordToFind: string, occurrence: number) => {
    const sentence = sentences[sentenceIndex];
    if (!sentence) return null;
    
    // Use regex to find all occurrences of the word
    const regex = new RegExp(`\\b${wordToFind}\\b`, 'gi');
    const matches = [...sentence.matchAll(regex)];
    
    // Get the specific occurrence (1-based index)
    const match = matches[occurrence - 1];
    if (!match) return null;
    
    return {
      start: match.index,
      end: (match.index || 0) + wordToFind.length
    };
  };

  // Get styling based on issue type
  const getUnderlineStyle = (issueType: string) => {
    switch (issueType) {
      case 'correctness':
        return 'border-b-2 border-dashed border-red-500 pb-0.5';
      case 'clarity':
        return 'border-b-2 border-dashed border-blue-500 pb-0.5';
      case 'vocab':
        return 'border-b-2 border-dashed border-purple-500 pb-0.5';
      case 'tense':
        return 'border-b-2 border-dashed border-amber-500 pb-0.5';
      case 'article':
        return 'border-b-2 border-dashed border-emerald-500 pb-0.5';
      case 'plural':
        return 'border-b-2 border-dashed border-rose-500 pb-0.5';
      case 'preposition':
        return 'border-b-2 border-dashed border-cyan-500 pb-0.5';
      case 'pronunciation':
        return 'border-b-2 border-dashed border-orange-500 pb-0.5';
      case 'style':
      default:
        return 'border-b-2 border-dashed border-indigo-500 pb-0.5';
    }
  };

  // Render individual sentences with highlighted issues
  const renderSentenceWithHighlights = (sentenceIndex: number) => {
    const sentence = sentences[sentenceIndex];
    if (!sentence) return null;
    
    // Get issues for this sentence
    const sentenceIssues = issues.filter(issue => 
      issue.position.sentence === sentenceIndex
    ).sort((a, b) => {
      const posA = findWordPositions(sentenceIndex, a.position.word, a.position.occurrence);
      const posB = findWordPositions(sentenceIndex, b.position.word, b.position.occurrence);
      return (posA?.start || 0) - (posB?.start || 0);
    });
    
    if (sentenceIssues.length === 0) {
      return <span key={`sentence-${sentenceIndex}`}>{sentence} </span>;
    }
    
    const result = [];
    let lastIndex = 0;
    
    for (const issue of sentenceIssues) {
      const position = findWordPositions(
        issue.position.sentence, 
        issue.position.word, 
        issue.position.occurrence
      );
      
      if (!position) continue;
      
      // Add text before the issue
      if (position.start > lastIndex) {
        result.push(
          <span key={`text-${sentenceIndex}-${lastIndex}`}>
            {sentence.substring(lastIndex, position.start)}
          </span>
        );
      }
      
      // Add highlighted issue with improved styling
      const underlineStyle = getUnderlineStyle(issue.type);
      
      result.push(
        <span 
          key={`highlight-${issue.id}`} 
          className={`${underlineStyle} cursor-pointer hover:bg-gray-100`}
          onClick={() => {
            const element = document.getElementById(`issue-${issue.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              element.classList.add('ring', 'ring-brand-blue', 'ring-opacity-50');
              setTimeout(() => {
                element.classList.remove('ring', 'ring-brand-blue', 'ring-opacity-50');
              }, 2000);
            }
          }}
        >
          {sentence.substring(position.start, position.end)}
        </span>
      );
      
      lastIndex = position.end;
    }
    
    // Add remaining text
    if (lastIndex < sentence.length) {
      result.push(
        <span key={`text-${sentenceIndex}-end`}>
          {sentence.substring(lastIndex)}
        </span>
      );
    }
    
    // Add space after sentence
    result.push(<span key={`space-${sentenceIndex}`}> </span>);
    
    return result;
  };

  const renderAllSentences = () => {
    return sentences.map((_, index) => 
      <React.Fragment key={`sentence-container-${index}`}>
        {renderSentenceWithHighlights(index)}
      </React.Fragment>
    );
  };

  const acceptSuggestion = (issue: GrammarIssue) => {
    const sentenceIndex = issue.position.sentence;
    const sentence = sentences[sentenceIndex];
    if (!sentence) return;
    
    const position = findWordPositions(
      sentenceIndex, 
      issue.position.word, 
      issue.position.occurrence
    );
    
    if (!position) return;
    
    const before = sentence.substring(0, position.start);
    const after = sentence.substring(position.end);
    const suggestion = issue.suggestion.split(' → ')[1] || issue.suggestion;
    const newSentence = before + suggestion + after;
    
    const newSentences = [...sentences];
    newSentences[sentenceIndex] = newSentence;
    setSentences(newSentences);
    
    // Remove the fixed issue
    setIssues(issues.filter(i => i.id !== issue.id));
  };

  const dismissSuggestion = (issueId: string) => {
    setIssues(issues.filter(issue => issue.id !== issueId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16">
      <div className="max-w-4xl w-full mx-auto animate-fade-in">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h1 className="text-2xl font-semibold mb-2">Grammar Analysis</h1>
                <p className="text-gray-600">Review and correct grammatical errors in your text</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
                {/* Left column - Text with highlights */}
                <div className="flex-1 border rounded-xl p-6 bg-white shadow-sm">
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-800">Your Text</h2>
                    <div className="text-sm text-gray-500">
                      {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
                    </div>
                  </div>
                  
                  <div className="text-lg leading-relaxed whitespace-pre-wrap p-6 border rounded-lg bg-gray-50 min-h-[200px] mb-6">
                    {renderAllSentences()}
                  </div>
                </div>
                
                {/* Right column - Suggestions */}
                <div className="w-full md:w-[380px] border rounded-xl bg-white shadow-sm">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-medium text-gray-800">Suggestions</h2>
                  </div>
                  
                  <ScrollArea className="h-[550px] px-4">
                    {issues.length > 0 ? (
                      <div className="space-y-5 py-4">
                        {issues.map(issue => (
                          <GrammarSuggestion
                            key={issue.id}
                            issue={issue}
                            originalText={issue.position.word}
                            onAccept={() => acceptSuggestion(issue)}
                            onDismiss={() => dismissSuggestion(issue.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <p className="text-gray-500 mb-2">No grammar issues found</p>
                        <p className="text-sm text-gray-400">Great job! Your text looks good.</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarPage;
