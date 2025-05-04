import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom'; // or useRouter if using Next.js
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { SubmissionResults } from '@/components/SubmissionResults';
import type { AppDispatch } from '@/app/store'; // <-- import your AppDispatch type

export default function Submission() {
  const dispatch = useDispatch<AppDispatch>(); // <-- use the correct type
  const { submissionId } = useParams<{ submissionId: string }>();

  useEffect(() => {
    if (submissionId) {
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  return (
    <div>
      <h1>Submission Details</h1>
      <SubmissionResults />
    </div>
  );
}
