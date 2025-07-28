import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppDispatch } from '@/app/hooks';
import { fetchLatestSubmissionsByAssignment } from '@/features/assignments/assignmentThunks';

interface UseClassDetailWebSocketProps {
  classId?: string;
  assignmentIds: string[];
  enabled?: boolean;
}

export function useClassDetailWebSocket({ 
  classId, 
  assignmentIds, 
  enabled = true 
}: UseClassDetailWebSocketProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || !classId || !assignmentIds.length) return;
    
    // Create a channel for submissions updates
    const channel = supabase
      .channel(`submissions-updates-${classId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', // Listen for both INSERT and UPDATE events
          schema: 'public', 
          table: 'submissions'
        },
        (payload) => {
          // When a submission changes, update that specific submission in real-time
          const newData = payload.new as any;
          const assignmentId = newData?.assignment_id;
          
          // Filter by assignment IDs we care about
          if (assignmentId && assignmentIds.includes(assignmentId)) {
            if (payload.eventType === 'INSERT') {
              // New submission created - need to fetch fresh data since we don't have all the computed fields
              dispatch(fetchLatestSubmissionsByAssignment(assignmentId));
            } else if (payload.eventType === 'UPDATE') {
              // For UPDATE events, we need to refetch to get accurate attempt counts
              // since they're computed from all submissions for that student
              dispatch(fetchLatestSubmissionsByAssignment(assignmentId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId, assignmentIds, enabled, dispatch]);
}