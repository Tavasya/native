import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';

interface AnalysisStatusProps {
  submissionUrl: string;
}

interface StatusResponse {
  status_logs: any;
}

const AnalysisStatus: React.FC<AnalysisStatusProps> = ({ submissionUrl }) => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionUrl) {
      setError('No submission URL provided');
      return;
    }

    // Initial fetch
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('status_logs')
          .eq('id', submissionUrl)
          .single();

        if (error) {
          throw new Error(`Failed to fetch status: ${error.message}`);
        }

        setStatus({ status_logs: data.status_logs });
        setError(null);
      } catch (err) {
        console.error('Error fetching status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      }
    };

    fetchStatus();

    // Set up realtime subscription specifically for status_logs
    const channel = supabase
      .channel(`submission-status-${submissionUrl}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionUrl}`,
        },
        (payload) => {
          console.log('Status logs updated:', payload.new.status_logs);
          setStatus({ status_logs: payload.new.status_logs });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionUrl]);

  if (error) {
    return (
      <Card className="shadow-sm border-0 bg-white">
        <CardContent className="p-4">
          <div className="text-red-600">
            <h3 className="font-semibold mb-2">Error Loading Status</h3>
            <pre className="bg-red-50 p-2 rounded text-sm overflow-auto">
              {error}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="shadow-sm border-0 bg-white">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <p>Loading status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Status Logs</h3>
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
          {JSON.stringify(status.status_logs, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default AnalysisStatus; 