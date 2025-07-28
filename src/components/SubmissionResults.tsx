import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRealtimeSubmission } from '@/hooks/feedback/useRealtimeSubmission';
import { RootState } from '@/app/store';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ResultsContainer = styled.div`
  padding: 24px;
  background: #2a2a2a;
  border-radius: 8px;
  color: #fff;
`;

const SectionContainer = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 6px;
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin: 16px 0;
  background: #1a1a1a;
  border-radius: 4px;
`;

const FeedbackText = styled.p`
  color: #ddd;
  margin-top: 12px;
  line-height: 1.5;
`;

const GradeBadge = styled.span<{ $grade: number }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${props => {
    if (props.$grade >= 80) return '#00C851';
    if (props.$grade >= 60) return '#ffbb33';
    return '#ff4444';
  }};
  color: white;
  font-weight: bold;
  margin-right: 8px;
`;

const AttemptSelector = styled.div`
  margin: 16px 0;
  padding: 12px;
  background: #333;
  border-radius: 4px;
`;

const AttemptButton = styled.button<{ $isSelected: boolean }>`
  padding: 8px 16px;
  margin-right: 8px;
  background: ${props => props.$isSelected ? '#4CAF50' : '#666'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.$isSelected ? '#45a049' : '#777'};
  }
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 16px;
  transition: background 0.2s;

  &:hover {
    background: #1976D2;
  }
`;

export function SubmissionResults() {
  const navigate = useNavigate();
  const { selectedSubmission, submissions, loading, error } = useSelector((state: RootState) => state.submissions);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(0);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useRealtimeSubmission(selectedSubmission?.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedSubmission) return <div>No submission selected</div>;

  // Get all submissions for this assignment
  const assignmentSubmissions = submissions.filter(
    s => s.assignment_id === selectedSubmission.assignment_id
  ).sort((a, b) => b.attempt - a.attempt);

  const currentSubmission = assignmentSubmissions[selectedAttempt];

  const handleRetry = () => {
    navigate(`/student/assignment/${selectedSubmission.assignment_id}`, { 
      state: { isRetry: true } 
    });
  };

  // Handle attempt change
  const handleAttemptChange = (idx: number) => {
    // Pause all audio players when switching attempts
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setSelectedAttempt(idx);
  };

  return (
    <ResultsContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Submission #{currentSubmission.attempt}</h2>
        <div>
          Status: {currentSubmission.status}
          {currentSubmission.grade && (
            <GradeBadge $grade={currentSubmission.grade}>
              Overall Grade: {currentSubmission.grade}%
            </GradeBadge>
          )}
        </div>
      </div>

      {assignmentSubmissions.length > 1 && (
        <AttemptSelector>
          <h3>View Attempts:</h3>
          <div>
            {assignmentSubmissions.map((submission, idx) => (
              <AttemptButton
                key={submission.id}
                $isSelected={idx === selectedAttempt}
                onClick={() => handleAttemptChange(idx)}
              >
                Attempt {submission.attempt}
                {submission.grade && ` (${submission.grade}%)`}
              </AttemptButton>
            ))}
          </div>
        </AttemptSelector>
      )}

      {currentSubmission.recordings && currentSubmission.recordings.map((recording, index) => {
        const feedback = currentSubmission.section_feedback?.find(
          section => section.question_id === parseInt(recording.questionId)
        )?.section_feedback;
        const audioKey = `${currentSubmission.id}_${recording.questionId}`;
        
        return (
          <SectionContainer key={recording.questionId}>
            <h3>Question {index + 1}</h3>
            <AudioPlayer 
              controls 
              ref={el => {
                if (el) {
                  audioRefs.current[audioKey] = el;
                }
              }}
              key={audioKey} // Add key to force re-render when switching attempts
            >
              <source src={recording.audioUrl} type="audio/webm" />
              Your browser does not support the audio element.
            </AudioPlayer>
            
            {feedback && (
              <div>
                <GradeBadge $grade={feedback.grade}>
                  Grade: {feedback.grade}%
                </GradeBadge>
                <FeedbackText>
                  {feedback.feedback}
                </FeedbackText>
              </div>
            )}
          </SectionContainer>
        );
      })}

      <RetryButton onClick={handleRetry}>
        Retry Assignment
      </RetryButton>
    </ResultsContainer>
  );
}