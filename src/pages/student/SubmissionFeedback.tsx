import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';

const SubmissionFeedback: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const dispatch = useAppDispatch();
  const { selectedSubmission, loading, error } = useAppSelector(state => state.submissions);

  useEffect(() => {
    if (submissionId) {
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!selectedSubmission) {
    return <div>Submission not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Submission Feedback</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(selectedSubmission.section_feedback, null, 2)}
      </pre>
    </div>
  );
};

export default SubmissionFeedback; 