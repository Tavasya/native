import React from 'react';
import { useSelector } from 'react-redux';
import { useRealtimeSubmission } from '@/hooks/useRealtimeSubmission';
import { RootState } from '@/app/store';
import styled from 'styled-components';

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

export function SubmissionResults() {
  const { selectedSubmission, loading, error } = useSelector((state: RootState) => state.submissions);

  useRealtimeSubmission(selectedSubmission?.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedSubmission) return <div>No submission selected</div>;

  return (
    <ResultsContainer>
      <h2>Submission #{selectedSubmission.attempt}</h2>
      <div style={{ marginBottom: '24px' }}>
        Status: {selectedSubmission.status}
        {selectedSubmission.grade && (
          <GradeBadge $grade={selectedSubmission.grade}>
            Overall Grade: {selectedSubmission.grade}%
          </GradeBadge>
        )}
      </div>

      {selectedSubmission.recordings && selectedSubmission.recordings.map((recording, index) => {
        const feedback = selectedSubmission.section_feedback?.[recording.questionId];
        
        return (
          <SectionContainer key={recording.questionId}>
            <h3>Question {index + 1}</h3>
            <AudioPlayer controls>
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
    </ResultsContainer>
  );
}