import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDispatch } from 'react-redux';
import { updateSubmissionFromRealtime } from '@/features/submissions/submissionsSlice';
import { Submission } from '@/features/submissions/types';

export function useRealtimeSubmission(submissionId?: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!submissionId) return;

    const channel = supabase
      .channel('public:submissions')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `id=eq.${submissionId}` },
        (payload) => {
          dispatch(updateSubmissionFromRealtime(payload.new as Submission));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId, dispatch]);
}
