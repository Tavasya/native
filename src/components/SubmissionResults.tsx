import React from 'react';
import { useSelector } from 'react-redux';
import { useRealtimeSubmission } from '@/hooks/useRealtimeSubmission';
import { RootState } from '@/app/store';

export function SubmissionResults() {
  const { selectedSubmission, loading, error } = useSelector((state: RootState) => state.submissions);

  useRealtimeSubmission(selectedSubmission?.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedSubmission) return <div>No submission selected</div>;

  return (
    <div>
      <h2>Submission #{selectedSubmission.attempt}</h2>
      <div>Status: {selectedSubmission.status}</div>
      {/* Add more UI as needed, see feedback for details */}
    </div>
  );
}