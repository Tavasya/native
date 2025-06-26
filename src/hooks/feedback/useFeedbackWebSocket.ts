import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Submission } from '@/features/submissions/types';

interface UseFeedbackWebSocketProps {
  submissionId: string;
  onFeedbackReady: () => void;
}

export const useFeedbackWebSocket = ({ 
  submissionId, 
  onFeedbackReady 
}: UseFeedbackWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [feedbackReady, setFeedbackReady] = useState(false);
  
  // Use refs to track state without causing re-renders
  const feedbackReadyRef = useRef(false);
  const onFeedbackReadyRef = useRef(onFeedbackReady);
  const isSetupRef = useRef(false);
  const channelRef = useRef<any>(null);

  // Update refs when props change
  useEffect(() => {
    onFeedbackReadyRef.current = onFeedbackReady;
  }, [onFeedbackReady]);

  useEffect(() => {
    feedbackReadyRef.current = feedbackReady;
  }, [feedbackReady]);

  const handleFeedbackUpdate = useCallback((payload: { new: Submission }) => {
    console.log('=== Feedback Update Received ===');
    console.log('Submission ID:', payload.new.id);
    console.log('Section Feedback:', payload.new.section_feedback);
    
    // Check if section_feedback has changed from null/empty to actual data
    const hasFeedbackData = payload.new.section_feedback && 
      Array.isArray(payload.new.section_feedback) && 
      payload.new.section_feedback.length > 0 &&
      payload.new.section_feedback.some(feedback => 
        feedback.section_feedback && 
        Object.keys(feedback.section_feedback).length > 0
      );

    if (hasFeedbackData && !feedbackReadyRef.current) {
      console.log('Feedback data is now available! Triggering refresh...');
      setFeedbackReady(true);
      onFeedbackReadyRef.current();
    }
  }, []); // No dependencies needed since we use refs

  useEffect(() => {
    if (!submissionId) {
      console.log('No submission ID provided for WebSocket');
      return;
    }

    // Prevent multiple setups for the same submission
    if (isSetupRef.current) {
      console.log('WebSocket already set up for submission:', submissionId);
      return;
    }

    // Check if feedback is already available (no need for WebSocket)
    if (feedbackReadyRef.current) {
      console.log('Feedback already available, skipping WebSocket setup');
      return;
    }

    console.log('Setting up WebSocket connection for submission:', submissionId);
    isSetupRef.current = true;

    // Set up realtime subscription for section_feedback changes
    const channel = supabase
      .channel(`submission-feedback-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionId}`,
        },
        handleFeedbackUpdate
      )
      .subscribe((status) => {
        console.log('WebSocket subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Cleanup subscription
    return () => {
      console.log('Cleaning up WebSocket connection for submission:', submissionId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSetupRef.current = false;
      setIsConnected(false);
    };
  }, [submissionId, handleFeedbackUpdate]);

  return {
    isConnected,
    feedbackReady
  };
}; 