import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Play, Pause, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { supabase } from '@/integrations/supabase/client';
import { startRecording, stopRecording, setRecordingError } from '@/features/practice/practiceSlice';
import { RecordingService } from '@/features/practice/recordingService';
import { PracticeSession } from '@/features/practice/practiceTypes';
import { practiceService } from '@/features/practice/practiceService';

interface SectionFeedback {
  audio_url: string;
  transcript: string;
  question_id: number;
  section_feedback: Record<string, unknown>;
}

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAppSelector(state => state.auth);
  const { recording, pronunciationAssessment } = useAppSelector(state => state.practice);
  const [longestScript, setLongestScript] = useState<SectionFeedback | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [showImproved, setShowImproved] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [recordingService] = useState(() => new RecordingService());
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Practice session state
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [improvementError, setImprovementError] = useState<string | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleImproveTranscript = async () => {
    if (!longestScript?.transcript || !user?.id) return;
    
    try {
      setIsImproving(true);
      setImprovementError(null);
      
      // First check if a practice session already exists for this audio URL
      const { data: existingSessions, error: searchError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('original_audio_url', longestScript.audio_url)
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) {
        console.error('Error checking existing sessions:', searchError);
        // Continue with creation if we can't check
      }

      let sessionId: string;
      let sessionData: PracticeSession;

      if (existingSessions && existingSessions.length > 0) {
        // Use existing session
        console.log('Using existing practice session:', existingSessions[0].id);
        sessionData = existingSessions[0];
        sessionId = sessionData.id;
        setPracticeSession(sessionData);
        
        // If it already has improved transcript, show it immediately
        if (sessionData.improved_transcript) {
          setShowImproved(true);
          setIsImproving(false);
          setHighlightedWords(new Set());
          return;
        }
      } else {
        // Create a new practice session
        const { data: newSessionData, error: createError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            original_audio_url: longestScript.audio_url,
            original_transcript: longestScript.transcript,
            status: 'transcript_ready'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create practice session: ${createError.message}`);
        }

        sessionData = newSessionData;
        sessionId = sessionData.id;
        console.log('Created new practice session:', sessionId);
      }
      
      // Call backend API to improve transcript
      await practiceService.improveTranscriptAPI(sessionId);
      
      // Set up real-time subscription to watch for updates
      const channel = supabase
        .channel(`practice_session_${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'practice_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          const updatedSession = payload.new as PracticeSession;
          setPracticeSession(updatedSession);
          
          if (updatedSession.status === 'transcript_ready' && updatedSession.improved_transcript) {
            setShowImproved(true);
            setIsImproving(false);
            setHighlightedWords(new Set()); // Reset highlighted words
            
            // Clean up subscription
            supabase.removeChannel(channel);
          } else if (updatedSession.status === 'failed') {
            setImprovementError(updatedSession.error_message || 'Failed to improve transcript');
            setIsImproving(false);
            supabase.removeChannel(channel);
          }
        })
        .subscribe();

      // Set initial session state
      setPracticeSession(sessionData);
      
    } catch (error) {
      console.error('Failed to improve transcript:', error);
      setImprovementError(error instanceof Error ? error.message : 'Failed to improve transcript');
      setIsImproving(false);
    }
  };

  const handleReset = () => {
    setShowImproved(false);
    setHighlightedWords(new Set());
    setAudioBlob(null);
    setPracticeSession(null);
    setImprovementError(null);
  };

  const handleStartRecording = async () => {
    try {
      dispatch(startRecording());
      await recordingService.startRecording();
    } catch (error) {
      console.error('Recording error:', error);
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Recording failed'));
    }
  };

  const handleStopRecording = async () => {
    try {
      const { audioBlob, audioUrl } = await recordingService.stopRecording();
      setAudioBlob(audioBlob); // Store blob locally
      dispatch(stopRecording({ audioUrl })); // Only pass URL to Redux
    } catch (error) {
      console.error('Stop recording error:', error);
      dispatch(setRecordingError(error instanceof Error ? error.message : 'Failed to stop recording'));
    }
  };

  const handleWordClick = (word: string) => {
    const newHighlightedWords = new Set(highlightedWords);
    if (newHighlightedWords.has(word)) {
      newHighlightedWords.delete(word);
    } else {
      // Only add if we haven't reached 10 words
      if (newHighlightedWords.size < 10) {
        newHighlightedWords.add(word);
      }
    }
    setHighlightedWords(newHighlightedWords);
  };

  const renderInteractiveText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      const isHighlighted = highlightedWords.has(cleanWord);
      const canHighlight = highlightedWords.size < 10 || isHighlighted;
      
      // Check if this word has pronunciation issues
      const wordScore = pronunciationAssessment?.wordScores.find(ws => 
        ws.word.toLowerCase() === cleanWord.toLowerCase()
      );
      const isWeakWord = wordScore && wordScore.score < 50;
      
      if (cleanWord.length === 0) {
        return <span key={index}>{word}</span>;
      }
      
      let className = 'transition-colors';
      
      if (pronunciationAssessment && isWeakWord) {
        // Red highlighting for weak words (pronunciation issues)
        className += ' bg-red-200 px-1 rounded font-medium cursor-pointer';
      } else if (isHighlighted) {
        // Yellow highlighting for student-selected words
        className += ' bg-yellow-200 px-1 rounded font-medium cursor-pointer';
      } else if (canHighlight) {
        className += ' hover:bg-yellow-100 rounded cursor-pointer';
      } else {
        className += ' opacity-50 cursor-not-allowed';
      }
      
      return (
        <span
          key={index}
          onClick={() => handleWordClick(cleanWord)}
          className={className}
          title={wordScore ? `Pronunciation Score: ${wordScore.score}%` : undefined}
        >
          {word}
        </span>
      );
    });
  };

  useEffect(() => {
    const fetchLongestScript = async () => {
      if (!user || !submissionId) return;

      try {
        // Fetch the specific submission
        const { data: submission, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .eq('student_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching submission:', error);
          return;
        }

        if (!submission || !submission.section_feedback) {
          setIsLoadingScript(false);
          return;
        }

        // Find the longest transcript within this specific submission
        let longestTranscript = '';
        let longestScriptData: SectionFeedback | null = null;

        if (Array.isArray(submission.section_feedback)) {
          submission.section_feedback.forEach((feedback: SectionFeedback) => {
            if (feedback.transcript && feedback.transcript.length > longestTranscript.length) {
              longestTranscript = feedback.transcript;
              longestScriptData = feedback;
            }
          });
        }

        setLongestScript(longestScriptData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingScript(false);
      }
    };

    fetchLongestScript();
  }, [user, submissionId]);

  const handlePlayAudio = () => {
    if (!longestScript?.audio_url) return;

    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } else {
      const newAudio = new Audio(longestScript.audio_url);
      newAudio.addEventListener('ended', () => setIsPlaying(false));
      newAudio.play();
      setIsPlaying(true);
      setAudio(newAudio);
    }
  };

  const handleAssessPronunciation = async () => {
    if (!audioBlob || !practiceSession) return;
    
    try {
      // For now, we'll skip pronunciation assessment since the API method doesn't exist
      // This can be implemented later when the backend supports it
      console.log('Pronunciation assessment not yet implemented');
    } catch (error) {
      console.error('Pronunciation assessment failed:', error);
    }
  };

  if (isLoadingScript) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {longestScript ? (
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Your Longest Script</h2>
                        <p className="text-sm text-gray-600">Question {longestScript.question_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {longestScript.audio_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePlayAudio}
                          className="flex items-center gap-2"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                      )}
                      {!showImproved && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleImproveTranscript}
                          disabled={isImproving}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isImproving ? 'Improving...' : 'Improve'}
                        </Button>
                      )}
                      {showImproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          className="flex items-center gap-2"
                        >
                          Show Original
                        </Button>
                      )}
                    </div>
                  </div>

                  {improvementError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600">{improvementError}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">
                      {showImproved && practiceSession ? 'Improved Transcript' : 'Original Transcript'}
                    </h3>
                    
                    {showImproved && practiceSession ? (
                      <div>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-blue-800 font-medium">This is an improved version</p>
                          <p className="text-blue-700 text-sm mt-1">Click on words/phrases that you would want to remember in the future.</p>
                          <p className="text-blue-600 text-sm mt-2">
                            Words highlighted: {highlightedWords.size}/10
                          </p>
                        </div>
                        
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {renderInteractiveText(practiceSession.improved_transcript || '')}
                        </div>
                        
                        {highlightedWords.size > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="font-medium text-yellow-800 mb-2">Your Highlighted Words:</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(highlightedWords).map((word, index) => (
                                <span 
                                  key={index}
                                  className="bg-yellow-200 px-2 py-1 rounded text-sm font-medium"
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {pronunciationAssessment && !pronunciationAssessment.loading && (
                          <div className="mt-6 space-y-4">
                            {/* Overall Score */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-2">Pronunciation Assessment Results</h4>
                              <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-blue-600">
                                  {pronunciationAssessment.overallScore}%
                                </div>
                                <div className="text-sm text-blue-700">
                                  Overall Pronunciation Score
                                </div>
                              </div>
                            </div>

                            {/* Weak Words */}
                            {pronunciationAssessment.weakWords.length > 0 && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-medium text-red-800 mb-2">Words Needing Improvement:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {pronunciationAssessment.weakWords.map((word, index) => (
                                    <span 
                                      key={index}
                                      className="bg-red-200 px-2 py-1 rounded text-sm font-medium text-red-800"
                                    >
                                      {word}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-sm text-red-600 mt-2">
                                  These words scored below 50% in pronunciation accuracy.
                                </p>
                              </div>
                            )}

                            {/* Phoneme-Level Feedback */}
                            {pronunciationAssessment.wordScores.some(ws => ws.phonemes.length > 0) && (
                              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="font-medium text-purple-800 mb-2">Phoneme-Level Feedback:</h4>
                                <div className="space-y-2">
                                  {pronunciationAssessment.wordScores
                                    .filter(ws => ws.phonemes.length > 0)
                                    .slice(0, 5) // Show first 5 words with phonemes
                                    .map((wordScore, index) => (
                                    <div key={index} className="text-sm">
                                      <span className="font-medium text-purple-700">{wordScore.word}:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {wordScore.phonemes.map((phoneme, pIndex) => (
                                          <span 
                                            key={pIndex}
                                            className={`px-1 rounded text-xs ${
                                              phoneme.score < 50 
                                                ? 'bg-red-200 text-red-800' 
                                                : 'bg-green-200 text-green-800'
                                            }`}
                                            title={`${phoneme.phoneme}: ${phoneme.score}%`}
                                          >
                                            {phoneme.phoneme}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {pronunciationAssessment?.error && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">Assessment Error: {pronunciationAssessment.error}</p>
                          </div>
                        )}

                        {highlightedWords.size === 10 && (
                          <div className="mt-6 text-center">
                            {!recording.isRecording && !recording.hasRecording ? (
                              <Button
                                variant="default"
                                size="lg"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleStartRecording}
                                disabled={recording.isRecording}
                              >
                                🎤 Start Recording
                              </Button>
                            ) : recording.isRecording ? (
                              <Button
                                variant="destructive"
                                size="lg"
                                onClick={handleStopRecording}
                              >
                                ⏹️ Stop Recording
                              </Button>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-green-800 font-medium">Recording Complete!</p>
                                  <p className="text-green-600 text-sm">Your audio is ready for pronunciation assessment.</p>
                                </div>
                                <Button
                                  variant="default"
                                  size="lg"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={handleAssessPronunciation}
                                  disabled={pronunciationAssessment?.loading}
                                >
                                  {pronunciationAssessment?.loading ? '📊 Assessing...' : '📊 Assess Pronunciation'}
                                </Button>
                              </div>
                            )}
                            
                            {recording.recordingError && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600">{recording.recordingError}</p>
                              </div>
                            )}
                            
                            {!recording.isRecording && !recording.hasRecording && (
                              <p className="text-sm text-gray-600 mt-2">
                                Great! Now practice reading the improved transcript aloud.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {longestScript.transcript}
                      </p>
                    )}
                  </div>

                                      <div className="text-center pt-4">
                      <p className="text-sm text-gray-500">
                        Character count: {showImproved && practiceSession 
                          ? (practiceSession.improved_transcript?.length || 0)
                          : longestScript.transcript.length} characters
                      </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">No Scripts Found</h2>
                  <p className="text-gray-600">
                    Complete some assignments first to start practicing with your scripts.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice; 