import { Play, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
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

const SubmissionFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { selectedSubmission, loading, error } = useAppSelector(state => state.submissions);

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
    if (!currentFeedback || highlightType === 'none') return text;

    let mistakesToHighlight: Mistake[] = [];
    
    if (highlightType === 'grammar' && currentFeedback.grammar?.issues) {
      mistakesToHighlight = currentFeedback.grammar.issues.map(issue => ({
        text: issue.original,
        explanation: issue.correction.explanation,
        type: 'Grammar',
        color: 'bg-red-100 text-red-800 border-red-200 cursor-pointer hover:bg-red-200 transition-colors'
      }));
    } else if (highlightType === 'vocabulary' && currentFeedback.lexical?.issues) {
      mistakesToHighlight = currentFeedback.lexical.issues.map(issue => ({
        text: issue.original,
        explanation: issue.suggestion.explanation,
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
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap max-w-xs">
              <div className="font-semibold">{pos.mistake.type}</div>
              <div className="mt-1">{pos.mistake.explanation}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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
    // Implement audio playback logic here
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Language Assessment</h1>
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Assignment Header */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium text-gray-900">
                  Assignment {submissionInfo.assignment_id || submissionId}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on: {new Date(submissionInfo.submitted_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Overall Scoring */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">
                Student {submissionInfo.student_id || 'Unknown'}
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
                {Array.from(recordings)
                  .sort((a, b) => (a.question_id || 0) - (b.question_id || 0))
                  .map((recording, index) => (
                  <button
                    key={recording.question_id || index}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                      selectedQuestionIndex === index 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setSelectedQuestionIndex(index)}
                  >
                    Q{recording.question_id || (index + 1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Player */}
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Play className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="w-full">
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: "35%" }}
                        className="absolute left-0 top-0 h-full bg-primary rounded-full"
                      ></div>
                      <div
                        className="absolute top-0 h-full w-1 bg-primary/80 rounded-full"
                        style={{ left: "35%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0:00</span>
                      <span>1:23</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="mt-4">
              <h3 className="text-base font-medium text-gray-900 mb-2">Transcript</h3>
              <div className="text-sm text-gray-600 leading-relaxed">
                {renderHighlightedText(
                  currentQuestion.transcript || 'No transcript available.',
                  activeTab === 'grammar' ? 'grammar' : activeTab === 'vocabulary' ? 'vocabulary' : 'none'
                )}
              </div>
            </div>
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
                  {currentFeedback?.fluency?.issues?.map((issue, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{issue}</p>
                    </div>
                  )) || <p className="text-sm text-gray-500">No fluency feedback available.</p>}
                </div>
              </TabsContent>

              <TabsContent value="pronunciation" className="mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pronunciation Analysis</h4>
                  {currentFeedback?.pronunciation?.issues?.map((issue, index) => {
                    if (issue.type === 'word_scores' && issue.words) {
                      const wordsToPractice = issue.words.filter(word => word.score < 80);
                      
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
                              <TableHead className="w-[100px]">Score</TableHead>
                              <TableHead className="w-[100px]">Audio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {wordsToPractice.map((word, wordIndex) => (
                              <TableRow key={wordIndex}>
                                <TableCell className="font-medium">{word.word}</TableCell>
                                <TableCell>
                                  <span className={getScoreColor(word.score)}>{word.score}</span>
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
                      {currentFeedback?.grammar?.issues?.map((issue, index) => (
                        <Collapsible 
                          key={index}
                          open={grammarOpen[`grammar-${index}`]} 
                          onOpenChange={(open) => toggleGrammarOpen(`grammar-${index}`)}
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
                      {currentFeedback?.lexical?.issues?.map((issue, index) => (
                        <Collapsible 
                          key={index}
                          open={vocabularyOpen[`vocab-${index}`]} 
                          onOpenChange={(open) => toggleVocabularyOpen(`vocab-${index}`)}
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
                                  <p className="text-xs text-gray-600">{issue.original}</p>
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