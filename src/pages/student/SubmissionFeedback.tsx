import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Pause, ArrowLeft } from 'lucide-react';

const SubmissionFeedback: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedSubmission, loading, error } = useAppSelector(state => state.submissions);
  const [playingAudio, setPlayingAudio] = React.useState<string | null>(null);
  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (submissionId) {
      console.log('Fetching submission:', submissionId);
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  useEffect(() => {
    console.log('Selected submission:', selectedSubmission);
  }, [selectedSubmission]);

  const handlePlayPause = (audioKey: string) => {
    const audioElement = audioRefs.current[audioKey];
    if (!audioElement) return;

    if (playingAudio === audioKey) {
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
      }
      audioElement.play();
      setPlayingAudio(audioKey);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading submission...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Submission</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedSubmission) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Submission Not Found</h2>
          <p className="text-yellow-600">The requested submission could not be found.</p>
        </div>
      </div>
    );
  }

  const renderFeedbackSection = (title: string, data: any) => {
    console.log(`Rendering ${title}:`, data);
    if (!data) return null;
    
    const grade = data.grade ?? 0;
    const issues = data.issues || [];

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <span className="text-2xl font-bold">{grade}%</span>
          </div>
          <Progress value={grade} className="h-2" />
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <ul className="space-y-2">
              {issues.map((issue: any, index: number) => {
                if (typeof issue === 'string') {
                  return (
                    <li key={index} className="text-sm text-gray-600">
                      {issue}
                    </li>
                  );
                } else if (issue.type === 'word_scores') {
                  return (
                    <div key={index} className="mt-2">
                      <h4 className="text-sm font-medium mb-2">Word-by-Word Analysis</h4>
                      <div className="flex flex-wrap gap-2">
                        {issue.words.map((word: any, wordIndex: number) => (
                          <div
                            key={wordIndex}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            title={`Score: ${word.score}%`}
                          >
                            {word.word}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else if (issue.type === 'suggestion' || issue.type === 'prosody' || issue.type === 'fluency') {
                  return (
                    <li key={index} className="text-sm text-gray-600">
                      {issue.message}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          ) : (
            <p className="text-sm text-green-600">No issues found. Great job!</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRecordings = () => {
    if (!selectedSubmission.recordings) {
      console.log('No recordings found in submission:', selectedSubmission);
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">No recordings available for this submission.</p>
        </div>
      );
    }

    let recordings;
    try {
      recordings = Array.isArray(selectedSubmission.recordings) 
        ? selectedSubmission.recordings 
        : JSON.parse(selectedSubmission.recordings);
    } catch (error) {
      console.error('Error parsing recordings:', error);
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading recordings. Please try again later.</p>
        </div>
      );
    }

    if (!recordings.length) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">No recordings available for this submission.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {recordings.map((recording: any, index: number) => {
          const audioKey = `${selectedSubmission.id}_${recording.questionId || index}`;
          return (
            <Card key={audioKey} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => handlePlayPause(audioKey)}
                    className="rounded-full w-12 h-12"
                    variant="outline"
                  >
                    {playingAudio === audioKey ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <audio
                    ref={el => {
                      if (el) {
                        audioRefs.current[audioKey] = el;
                      }
                    }}
                    src={recording.audioUrl}
                    onEnded={() => setPlayingAudio(null)}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">
                      {recording.questionId ? `Question ID: ${recording.questionId}` : `Recording ${index + 1}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => navigate('/student/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Submission Details</h1>
      </div>
      
      {selectedSubmission.status === 'graded' && selectedSubmission.section_feedback ? (
        // Show feedback for graded submissions
        (Array.isArray(selectedSubmission.section_feedback) ? selectedSubmission.section_feedback : [selectedSubmission.section_feedback]).map((feedback: any, index: number) => (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Question {feedback.question_id}</h2>
            <div>
              {renderFeedbackSection('Fluency', feedback.section_feedback.fluency)}
              {renderFeedbackSection('Grammar', feedback.section_feedback.grammar)}
              {renderFeedbackSection('Vocabulary', feedback.section_feedback.lexical)}
              {renderFeedbackSection('Pronunciation', feedback.section_feedback.pronunciation)}
            </div>
          </div>
        ))
      ) : (
        // Show recordings for pending submissions
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Your Recordings</h2>
            <p className="text-sm text-gray-500">This submission is currently being processed.</p>
          </div>
          {renderRecordings()}
        </div>
      )}
    </div>
  );
};

export default SubmissionFeedback; 