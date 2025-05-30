import { Play, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { setTTSAudio, setLoading, selectTTSAudio, selectTTSLoading, clearTTSAudio } from '@/features/tts/ttsSlice';
import { generateTTSAudio } from '@/features/tts/ttsService';
import { RootState } from '@/app/store';
import { SectionFeedback } from '@/features/submissions/types';
import { supabase } from '@/integrations/supabase/client';

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
  accuracy_score: number;
  error_type: string;
  offset: number;
  duration: number;
  phoneme_details: {
    phoneme: string;
    accuracy_score: number;
  }[];
}

interface PronunciationIssue {
  type?: string;
  message?: string;
}

interface CriticalError {
  word: string;
  score: number;
  timestamp: number;
  duration: number;
}

interface QuestionFeedback {
  question_id: number;
  audio_url: string;
  transcript: string;
  section_feedback: SectionFeedback;
}

interface SpeedCategory {
  category: string;
  color: string;
}

const phonemeToIPA: { [key: string]: string } = {
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

const getSpeedCategory = (wpm: number): SpeedCategory => {
  if (wpm < 100) return { category: 'Too Slow', color: 'bg-[#ef5136]' };
  if (wpm < 130) return { category: 'Slow', color: 'bg-[#feb622]' };
  if (wpm < 170) return { category: 'Good', color: 'bg-green-500' };
  if (wpm < 200) return { category: 'Fast', color: 'bg-[#feb622]' };
  return { category: 'Too Fast', color: 'bg-[#ef5136]' };
};

// Pronunciation scoring utilities
const calculateOverallPronunciationScore = (wordDetails: any[]) => {
  if (!wordDetails || wordDetails.length === 0) {
    return 0;
  }
  
  // Calculate weighted average based on word accuracy scores
  const totalScore = wordDetails.reduce((sum, word) => sum + (word.accuracy_score || 0), 0);
  const averageScore = totalScore / wordDetails.length;
  
  // Round to nearest integer
  return Math.round(averageScore);
};

const calculatePronunciationGrade = (wordDetails: any[]) => {
  if (!wordDetails || wordDetails.length === 0) {
    return 0;
  }

  // Method 1: Simple average
  const simpleAverage = wordDetails.reduce((sum, word) => sum + word.accuracy_score, 0) / wordDetails.length;

  // Method 2: Weighted by word importance
  const weightedScore = wordDetails.reduce((sum, word, index) => {
    const weight = word.word.length > 3 ? 1.2 : 1.0;
    return sum + (word.accuracy_score * weight);
  }, 0) / wordDetails.reduce((sum, word) => {
    const weight = word.word.length > 3 ? 1.2 : 1.0;
    return sum + weight;
  }, 0);

  // Method 3: Penalize very low scores more heavily
  const penalizedScore = wordDetails.map(word => {
    if (word.accuracy_score < 60) {
      return word.accuracy_score * 0.8;
    }
    return word.accuracy_score;
  }).reduce((sum, score) => sum + score, 0) / wordDetails.length;

  // Use weighted score as it provides the best balance
  return Math.round(weightedScore);
};

const validateAndFixPronunciationData = (sectionFeedback: any) => {
  if (!sectionFeedback.pronunciation) {
    return sectionFeedback;
  }

  const { pronunciation } = sectionFeedback;
  
  if (pronunciation.grade === 0 && pronunciation.word_details?.length > 0) {
    pronunciation.grade = calculatePronunciationGrade(pronunciation.word_details);
    console.log('Fixed pronunciation grade:', pronunciation.grade);
  }

  return sectionFeedback;
};

// Pronunciation filtering utilities
const getWordsNeedingImprovement = (wordDetails: any[]) => {
  return wordDetails.filter((word: any) => {
    const showWord = word.accuracy_score < 90;
    console.log('Filtering word (needs improvement):', {
      word: word.word,
      score: word.accuracy_score,
      showWord,
      error_type: word.error_type
    });
    return showWord;
  });
};

const getAdaptiveWordsToShow = (wordDetails: any[]) => {
  const scores = wordDetails.map(w => w.accuracy_score);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const minScore = Math.min(...scores);
  
  // If most words are high-scoring, show anything below average
  // If there's a wide range, show bottom third
  let threshold;
  if (minScore > 85) {
    // High-performing student: show anything below average
    threshold = avgScore;
  } else {
    // Mixed performance: show bottom third
    const sortedScores = scores.sort((a, b) => a - b);
    threshold = sortedScores[Math.floor(sortedScores.length / 3)];
  }
  
  return wordDetails.filter((word: any) => {
    const showWord = word.accuracy_score <= threshold;
    console.log('Adaptive filter:', {
      word: word.word,
      score: word.accuracy_score,
      threshold: Math.round(threshold),
      avgScore: Math.round(avgScore),
      showWord
    });
    return showWord;
  });
};

// Replace the adaptive filtering with simpler logic
const getWordsToShow = (wordDetails: any[]) => {
  if (!wordDetails || wordDetails.length === 0) return [];
  
  // Show words with scores under 90, or if all scores are high, show bottom 30%
  const lowScoreWords = wordDetails.filter(word => word.accuracy_score < 90);
  
  if (lowScoreWords.length > 0) {
    return lowScoreWords;
  }
  
  // If no words under 90, show bottom 30%
  const sorted = [...wordDetails].sort((a, b) => a.accuracy_score - b.accuracy_score);
  const bottomCount = Math.max(1, Math.floor(sorted.length * 0.3));
  return sorted.slice(0, bottomCount);
};

// Debug version to show all words
const getAllWordsForDebugging = (wordDetails: any[]) => {
  return wordDetails || [];
};

const SubmissionFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // State for average scores
  const [averageScores, setAverageScores] = useState({
    avg_fluency_score: 0,
    avg_grammar_score: 0,
    avg_lexical_score: 0,
    avg_pronunciation_score: 0
  });

  // Fetch average scores from Supabase
  useEffect(() => {
    const fetchAverageScores = async () => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('overall_assignment_score')
          .eq('id', submissionId)
          .single();

        if (error) {
          console.error('Error fetching average scores:', error);
          return;
        }

        if (data?.overall_assignment_score) {
          setAverageScores(data.overall_assignment_score);
        }
      } catch (error) {
        console.error('Error in fetchAverageScores:', error);
      }
    };

    if (submissionId) {
      fetchAverageScores();
    }
  }, [submissionId]);

  // Memoize the selectors
  const selectedSubmission = useAppSelector(
    useCallback((state: RootState) => state.submissions.selectedSubmission, [])
  );
  const loading = useAppSelector(
    useCallback((state: RootState) => state.submissions.loading, [])
  );
  const error = useAppSelector(
    useCallback((state: RootState) => state.submissions.error, [])
  );
  const ttsAudioCache = useAppSelector(
    useCallback((state: RootState) => selectTTSAudio(state), [])
  );
  const ttsLoading = useAppSelector(
    useCallback((state: RootState) => selectTTSLoading(state), [])
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fluency");
  const [grammarOpen, setGrammarOpen] = useState<{ [key: string]: boolean }>({});
  const [vocabularyOpen, setVocabularyOpen] = useState<{ [key: string]: boolean }>({});

  // Memoize the current question data
  const currentQuestion = useMemo(() => {
    if (!selectedSubmission?.section_feedback) return null;
    // Sort the section_feedback array by question_id
    const sortedFeedback = [...selectedSubmission.section_feedback].sort((a, b) => 
      (a.question_id || 0) - (b.question_id || 0)
    );
    return sortedFeedback[selectedQuestionIndex];
  }, [selectedSubmission, selectedQuestionIndex]);

  // Memoize the current feedback data
  const currentFeedback = useMemo(() => {
    return currentQuestion?.section_feedback;
  }, [currentQuestion]);

  // Calculate pronunciation score if not provided
  const pronunciationScore = useMemo(() => {
    if (!currentFeedback?.pronunciation) return 0;
    
    if (currentFeedback.pronunciation.grade && currentFeedback.pronunciation.grade > 0) {
      return currentFeedback.pronunciation.grade;
    }
    
    if (currentFeedback.pronunciation.word_details) {
      return calculateOverallPronunciationScore(currentFeedback.pronunciation.word_details);
    }
    
    return 0;
  }, [currentFeedback]);

  // Update wordsToShow calculation
  const wordsToShow = useMemo(() => {
    if (!currentFeedback?.pronunciation?.word_details) return [];
    
    // Log all word details for debugging
    console.log('All word details:', currentFeedback.pronunciation.word_details);
    
    // Use the simpler filter
    return getWordsToShow(currentFeedback.pronunciation.word_details);
    
    // Uncomment to show all words for debugging:
    // return getAllWordsForDebugging(currentFeedback.pronunciation.word_details);
  }, [currentFeedback]);

  // Debug logging
  useEffect(() => {
    if (selectedSubmission) {
      console.log('Selected Submission:', selectedSubmission);
      console.log('Section Feedback:', selectedSubmission.section_feedback);
      console.log('Current Question:', currentQuestion);
      console.log('Current Feedback:', currentFeedback);
    }
  }, [selectedSubmission, currentQuestion, currentFeedback]);

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

  useEffect(() => {
    if (currentFeedback?.pronunciation) {
      console.log('Current question index:', selectedQuestionIndex);
      console.log('Current question:', currentQuestion);
      console.log('Pronunciation data:', {
        grade: currentFeedback.pronunciation.grade,
        issues: currentFeedback.pronunciation.issues,
        word_details: currentFeedback.pronunciation.word_details,
        critical_errors: currentFeedback.pronunciation.critical_errors
      });
    }
  }, [currentFeedback, selectedQuestionIndex, currentQuestion]);

  useEffect(() => {
    if (currentFeedback?.pronunciation) {
      console.log('Pronunciation data structure:', {
        word_details: currentFeedback.pronunciation.word_details,
        first_word: currentFeedback.pronunciation.word_details?.[0],
        has_timestamps: currentFeedback.pronunciation.word_details?.some(w => 'timestamp' in w),
        has_durations: currentFeedback.pronunciation.word_details?.some(w => 'duration' in w)
      });
    }
  }, [currentFeedback]);

  // Debug logging for pronunciation data
  useEffect(() => {
    if (currentFeedback?.pronunciation) {
      console.log('Pronunciation Debug:', {
        currentFeedback: currentFeedback.pronunciation,
        wordDetails: currentFeedback.pronunciation.word_details,
        calculatedScore: currentFeedback.pronunciation.word_details ? 
          calculateOverallPronunciationScore(currentFeedback.pronunciation.word_details) : 'No word details',
        originalGrade: currentFeedback.pronunciation.grade
      });
    }
  }, [currentFeedback]);

  const handleBack = () => {
    if (location.state?.fromClassDetail) {
      navigate(-1);
    } else {
      navigate('/student/dashboard');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    if (score >= 50) return "text-orange-500";
    return "text-red-400";
  };

  const getPhonemeColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    if (score >= 50) return "text-orange-500";
    return "text-red-400";
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

  const playWordSegment = (word: WordScore, wordIndex: number) => {
    console.log('Playing word:', word, 'at index:', wordIndex);
    
    if (!audioRef.current) {
      console.warn('Audio element not found');
      return;
    }

    if (word.offset === undefined || word.duration === undefined) {
      console.warn('Missing offset or duration for word:', word);
      return;
    }

    const audio = audioRef.current;
    const startTime = word.offset; // offset is already in seconds
    const endTime = word.offset + word.duration;
    
    console.log('Audio playback:', {
      startTime,
      endTime,
      currentTime: audio.currentTime,
      duration: audio.duration,
      word: word.word
    });

    // Set up the timeupdate listener before setting the time
    const handleTimeUpdate = () => {
      if (audio.currentTime >= endTime) {
        audio.pause();
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        console.log('Finished playing word segment:', word.word);
      }
    };

    // Add the listener before playing
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Set the current time and play
    audio.currentTime = startTime;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Error playing audio:', error);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      });
    }
  };

  const playTTSAudio = async (word: string) => {
    const cacheKey = `tts_${word.toLowerCase()}`;
    
    try {
      // Check if we have cached audio
      if (ttsAudioCache[cacheKey]) {
        console.log(`[TTS Component] Using cached audio for: "${word}"`);
        const audio = new Audio(ttsAudioCache[cacheKey].url);
        audio.play();
        return;
      }

      console.log(`[TTS Component] No cached audio found for: "${word}", generating new audio`);
      // Set loading state
      dispatch(setLoading({ key: cacheKey, loading: true }));
      
      // Generate new audio
      const audioUrl = await generateTTSAudio(word);
      
      // Store in Redux
      dispatch(setTTSAudio({ key: cacheKey, url: audioUrl }));
      
      // Play the audio
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('[TTS Component] Error playing TTS audio:', error);
    } finally {
      dispatch(setLoading({ key: cacheKey, loading: false }));
    }
  };

  // Clean up audio URLs when component unmounts
  useEffect(() => {
    return () => {
      console.log('[TTS Component] Cleaning up audio resources');
      dispatch(clearTTSAudio());
    };
  }, [dispatch]);

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
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(averageScores.avg_fluency_score)}`}>
                      {averageScores.avg_fluency_score}
                    </div>
                    <div className="text-xs text-gray-500">Fluency</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(averageScores.avg_pronunciation_score)}`}>
                      {averageScores.avg_pronunciation_score}
                    </div>
                    <div className="text-xs text-gray-500">Pronunciation</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(averageScores.avg_grammar_score)}`}>
                      {averageScores.avg_grammar_score}
                    </div>
                    <div className="text-xs text-gray-500">Grammar</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(averageScores.avg_lexical_score)}`}>
                      {averageScores.avg_lexical_score}
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
                  {currentFeedback?.feedback || 'No feedback available.'}
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
                {[...(selectedSubmission?.section_feedback || [])]
                  .sort((a, b) => (a.question_id || 0) - (b.question_id || 0))
                  .map((question: QuestionFeedback, index: number) => (
                    <button
                      key={question.question_id || index}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                        selectedQuestionIndex === index 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => setSelectedQuestionIndex(index)}
                    >
                      Q{question.question_id || (index + 1)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Audio Player */}
            <div className="mt-4">
              <h3 className="text-base font-medium text-gray-900 mb-2">Audio Recording</h3>
              <audio 
                ref={audioRef}
                controls 
                className="w-full h-12"
                src={currentQuestion?.audio_url}
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
                      currentQuestion?.transcript || 'No transcript available.',
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
                {/* Top Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-900 mb-2">Speak at Length</div>
                    <div className={`text-xs ${getScoreColor(averageScores.avg_fluency_score)} mt-1`}>
                      {currentFeedback?.fluency?.wpm ? `${currentFeedback.fluency.wpm} WPM` : 'No data available'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-900 mb-2">Cohesive Devices</div>
                    <div className={`text-xs ${getScoreColor(averageScores.avg_fluency_score)} mt-1`}>
                      {currentFeedback?.fluency?.cohesive_device_feedback || 'No data available'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm font-medium text-gray-900 mb-2">Filler Words</div>
                    <div className={`text-xs ${getScoreColor(averageScores.avg_fluency_score)} mt-1`}>
                      {currentFeedback?.fluency?.filler_words ? `${currentFeedback.fluency.filler_words.length} filler words used` : 'No data available'}
                    </div>
                  </div>
                </div>

                {/* Speech Speed Analysis */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Speech Speed Analysis</h4>

                  <div className="relative">
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="w-1/5 bg-[#ef5136]"></div>
                        <div className="w-1/5 bg-[#feb622]"></div>
                        <div className="w-1/5 bg-green-500"></div>
                        <div className="w-1/5 bg-[#feb622]"></div>
                        <div className="w-1/5 bg-[#ef5136]"></div>
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-black"
                        style={{
                          left: `${Math.min(95, (currentFeedback?.fluency?.wpm || 0) / 250 * 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-center mt-1">
                      <div
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getSpeedCategory(currentFeedback?.fluency?.wpm || 0).color}`}
                      >
                        {currentFeedback?.fluency?.wpm || 0} WPM - {getSpeedCategory(currentFeedback?.fluency?.wpm || 0).category}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pause Analysis */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pause Analysis</h4>
                  <p className="text-sm text-gray-600">
                    {currentFeedback?.fluency?.issues?.find(issue => issue.toLowerCase().includes('pause')) || 'No pause analysis available.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="pronunciation" className="mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Pronunciation Analysis</h4>
                  
                  {currentFeedback?.pronunciation?.word_details && (
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Word</TableHead>
                            <TableHead>IPA + Definition</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Correct Audio</TableHead>
                            <TableHead className="text-center">Student Audio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wordsToShow.map((word: any, wordIndex: number) => (
                            <TableRow key={wordIndex}>
                              <TableCell className="font-medium">{word.word}</TableCell>
                              <TableCell>
                                <div className="flex">
                                  <span className="text-sm font-mono text-gray-600">/</span>
                                  {word.phoneme_details?.map((phoneme: { phoneme: string; accuracy_score: number }, idx: number) => (
                                    <span 
                                      key={idx} 
                                      className={`text-sm font-mono ${getPhonemeColor(phoneme.accuracy_score)}`}
                                    >
                                      {phonemeToIPA[phoneme.phoneme] || phoneme.phoneme}
                                    </span>
                                  ))}
                                  <span className="text-sm font-mono text-gray-600">/</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`text-sm font-medium ${getScoreColor(word.accuracy_score)}`}>
                                  {word.accuracy_score}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => playTTSAudio(word.word)}
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
                                  onClick={() => playWordSegment(word, wordIndex)}
                                  disabled={!word.offset || !word.duration}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {currentFeedback?.pronunciation?.issues?.map((issue: PronunciationIssue, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{issue.message}</p>
                    </div>
                  )) || <p className="text-sm text-gray-500">No pronunciation feedback available.</p>}
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
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Sentence</h4>
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
                      )) || <p className="text-sm text-gray-500">No vocabulary issues found.</p>}
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