import { Play, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';

interface Mistake {
  text: string;
  explanation: string;
  type?: string;
  color?: string;
}

interface MistakePosition {
  start: number;
  end: number;
  mistake: Mistake;
  index: number;
}

interface GrammarIssue {
  original?: string;
  correction: {
    suggested_correction: string;
    explanation: string;
  };
}

interface LexicalIssue {
  sentence?: string;
  suggestion: {
    suggested_phrase: string;
    explanation: string;
  };
}

interface WordScore {
  word: string;
  score: number;
  reference_phonemes?: string;
  timestamp?: number;
  duration?: number;
}

interface PronunciationIssue {
  type?: string;
  words?: WordScore[];
  message?: string;
}

const SubmissionFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { selectedSubmission, loading, error } = useAppSelector(state => state.submissions);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fluency");
  const [grammarOpen, setGrammarOpen] = useState<{ [key: string]: boolean }>({});
  const [vocabularyOpen, setVocabularyOpen] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (submissionId) {
      console.log('SubmissionFeedback - Fetching submission:', submissionId);
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  // DEBUG: Add logging to see what data we're getting
  useEffect(() => {
    if (selectedSubmission) {
      console.log('Selected Submission:', selectedSubmission);
      console.log('Type of selectedSubmission:', typeof selectedSubmission);
      console.log('Is Array?', Array.isArray(selectedSubmission));
    }
  }, [selectedSubmission]);

  const handleBack = () => {
    if (location.state?.fromClassDetail) {
      navigate(-1);
    } else {
      navigate('/student/dashboard');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const renderHighlightedText = (text: string, highlightType: 'none' | 'grammar' | 'vocabulary' = 'none') => {
    if (!text || !currentFeedback || highlightType === 'none') return text;

    let mistakesToHighlight: Mistake[] = [];
    
    if (highlightType === 'grammar' && currentFeedback.grammar?.issues) {
      mistakesToHighlight = currentFeedback.grammar.issues.map((issue: GrammarIssue) => ({
        text: issue.original || '',
        explanation: issue.correction.explanation || '',
        type: 'Grammar',
        color: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors'
      }));
    } else if (highlightType === 'vocabulary' && currentFeedback.lexical?.issues) {
      mistakesToHighlight = currentFeedback.lexical.issues.map((issue: LexicalIssue) => ({
        text: issue.sentence || '',
        explanation: issue.suggestion.explanation || '',
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
              <div className="mt-1 text-gray-600">{pos.mistake.explanation}</div>
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

  const toggleGrammarOpen = (key: string) => {
    setGrammarOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleVocabularyOpen = (key: string) => {
    setVocabularyOpen(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const playWordSegment = (word: any, index: number) => {
    console.log('Playing word:', word, 'at index:', index);
    
    if (audioRef.current && word.timestamp !== undefined && word.duration !== undefined) {
      const audio = audioRef.current;
      const startTime = word.timestamp;
      const endTime = word.timestamp + word.duration;
      
      // Set the current time to the word's timestamp
      audio.currentTime = startTime;
      
      // Play the audio
      audio.play();
      
      // Set up a listener to pause at the end of the word
      const handleTimeUpdate = () => {
        if (audio.currentTime >= endTime) {
          audio.pause();
          audio.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-lg text-gray-600">Loading submission...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Submission</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Submission Not Found</h2>
            <p className="text-yellow-600">The requested submission could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Handle the correct data structure
  // Your data has section_feedback as an array of objects with question data
  const recordings = Array.isArray(selectedSubmission.section_feedback) 
    ? selectedSubmission.section_feedback 
    : [];
  const submissionInfo = selectedSubmission;

  const currentQuestion = recordings[selectedQuestionIndex];
  const currentFeedback = currentQuestion?.section_feedback;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Question Data</h2>
            <p className="text-yellow-600">No question data found for this submission.</p>
            <p className="text-xs text-gray-500 mt-2">Debug: recordings length = {recordings.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button and Assignment Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            {location.state?.fromClassDetail ? 'Back to Class' : 'Back to Dashboard'}
          </Button>
        </div>

        {/* Assignment Header */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">
                  {submissionInfo.assignment_title || 'Assignment'}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on: {new Date(submissionInfo.submitted_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Overall Scoring */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">
                {submissionInfo.student_name || 'Student'}
              </p>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Overall Assignment Scoring</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(currentFeedback?.fluency?.grade || 0)}`}>
                      {currentFeedback?.fluency?.grade || 0}
                    </div>
                    <div className="text-xs text-gray-500">Fluency</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(currentFeedback?.pronunciation?.grade || 0)}`}>
                      {currentFeedback?.pronunciation?.grade || 0}
                    </div>
                    <div className="text-xs text-gray-500">Pronunciation</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(currentFeedback?.grammar?.grade || 0)}`}>
                      {currentFeedback?.grammar?.grade || 0}
                    </div>
                    <div className="text-xs text-gray-500">Grammar</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(currentFeedback?.lexical?.grade || 0)}`}>
                      {currentFeedback?.lexical?.grade || 0}
                    </div>
                    <div className="text-xs text-gray-500">Vocabulary</div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Teacher's Comment */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Teacher's Comment</h3>
                <p className="text-sm text-gray-600">
                  Great work on this assignment! Your pronunciation has improved significantly.
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Question Selection */}
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-4">
            <div className="w-full">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
                {[...recordings]
                  .sort((a, b) => {
                    const aId = typeof a.question_id === 'string' ? parseInt(a.question_id) : a.question_id || 0;
                    const bId = typeof b.question_id === 'string' ? parseInt(b.question_id) : b.question_id || 0;
                    return aId - bId;
                  })
                  .map((recording, sortedIndex) => {
                    // Find the original index of this recording in the unsorted array
                    const originalIndex = recordings.findIndex(r => r.question_id === recording.question_id);
                    return (
                      <button
                        key={recording.question_id || sortedIndex}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                          selectedQuestionIndex === originalIndex 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                        onClick={() => setSelectedQuestionIndex(originalIndex)}
                      >
                        Q{recording.question_id || (sortedIndex + 1)}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Audio Player */}
            <div className="mt-4">
              <h3 className="text-base font-medium text-gray-900 mb-2">Audio Recording</h3>
              <audio 
                ref={audioRef}
                controls 
                className="w-full h-12"
                src={currentQuestion.audio_url}
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>

            {/* Transcript */}
            <Card className="shadow-sm border-0 bg-white overflow-visible">
              <CardContent className="p-4 overflow-visible">
                <div className="mt-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">Transcript</h3>
                  <div className="text-sm text-gray-600 leading-relaxed overflow-visible">
                    {renderHighlightedText(
                      currentQuestion.transcript || 'No transcript available.',
                      activeTab === 'grammar' ? 'grammar' : activeTab === 'vocabulary' ? 'vocabulary' : 'none'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-primary/10">
                <TabsTrigger value="fluency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Fluency
                </TabsTrigger>
                <TabsTrigger value="pronunciation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Pronunciation
                </TabsTrigger>
                <TabsTrigger value="grammar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Grammar
                </TabsTrigger>
                <TabsTrigger value="vocabulary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Vocabulary
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fluency" className="mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Fluency Feedback</h4>
                  {currentFeedback?.fluency?.issues?.map((issue: string, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{issue}</p>
                    </div>
                  )) || <p className="text-sm text-gray-500">No fluency feedback available.</p>}
                </div>
              </TabsContent>

              <TabsContent value="pronunciation" className="mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pronunciation Analysis</h4>
                  {currentFeedback?.pronunciation?.issues?.map((issue: PronunciationIssue, index: number) => {
                    if (issue.type === 'word_scores' && issue.words) {
                      const wordsToPractice = issue.words.filter((word: WordScore) => word.score < 80);
                      
                      if (wordsToPractice.length === 0) {
                        return (
                          <div key={index} className="text-sm text-gray-500 text-center py-4">
                            Great pronunciation! No words need practice at this time.
                          </div>
                        );
                      }

                      return (
                        <Table key={index}>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Word</TableHead>
                              <TableHead className="w-[150px]">Phonemes</TableHead>
                              <TableHead className="w-[100px]">Audio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wordsToPractice.map((word, wordIndex) => (
                              <TableRow key={wordIndex}>
                                <TableCell className="font-medium">{word.word}</TableCell>
                                <TableCell>
                                  <span className="text-sm font-mono text-gray-600">
                                    {word.reference_phonemes || 'N/A'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => playWordSegment(word, wordIndex)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      );
                    }
                    return (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">{issue.message}</p>
                      </div>
                    );
                  }) || <p className="text-sm text-gray-500">No pronunciation feedback available.</p>}
                </div>
              </TabsContent>

              <TabsContent value="grammar" className="mt-4">
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Hover over highlighted text to see explanations</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grammar Issues</h3>
                    
                    <div className="space-y-3">
                      {currentFeedback?.grammar?.issues?.map((issue: GrammarIssue, index: number) => (
                        <Collapsible 
                          key={index}
                          open={grammarOpen[`grammar-${index}`]} 
                          onOpenChange={() => toggleGrammarOpen(`grammar-${index}`)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Grammar Issue {index + 1}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${grammarOpen[`grammar-${index}`] ? 'rotate-180' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-3 pb-3">
                            <div className="bg-white p-4 rounded border">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Original</h4>
                                  <p className="text-xs text-gray-600">{issue.original}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Correction</h4>
                                  <p className="text-xs text-gray-600">{issue.correction.suggested_correction}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Explanation</h4>
                                  <p className="text-xs text-gray-600">{issue.correction.explanation}</p>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )) || <p className="text-sm text-gray-500">No grammar issues found.</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vocabulary" className="mt-4">
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Hover over highlighted text to see explanations</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vocabulary Suggestions</h3>
                    
                    <div className="space-y-3">
                      {currentFeedback?.lexical?.issues?.map((issue: LexicalIssue, index: number) => (
                        <Collapsible 
                          key={index}
                          open={vocabularyOpen[`vocab-${index}`]} 
                          onOpenChange={() => toggleVocabularyOpen(`vocab-${index}`)}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Vocabulary Issue {index + 1}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${vocabularyOpen[`vocab-${index}`] ? 'rotate-180' : ''}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-3 pb-3">
                            <div className="bg-white p-4 rounded border">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Original</h4>
                                  <p className="text-xs text-gray-600">{issue.sentence}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggestion</h4>
                                  <p className="text-xs text-gray-600">{issue.suggestion.suggested_phrase}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Explanation</h4>
                                  <p className="text-xs text-gray-600">{issue.suggestion.explanation}</p>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )) || <p className="text-sm text-gray-500">No vocabulary suggestions available.</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionFeedback;