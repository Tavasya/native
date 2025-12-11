import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Play, Pause } from 'lucide-react';
import { submissionService } from '@/features/submissions/submissionsService';
import { supabase } from '@/integrations/supabase/client';
import type { Submission } from '@/features/submissions/types';

interface PendingReportsTableProps {
  onSelectReports?: (submissionIds: string[]) => void;
  refreshTrigger?: number;
}

const PendingReportsTable: React.FC<PendingReportsTableProps> = ({
  onSelectReports,
  refreshTrigger = 0
}) => {
  const [pendingReports, setPendingReports] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [processedInSession, setProcessedInSession] = useState<Map<string, { timestamp: number; status: string }>>(new Map());
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0); // Use ref to avoid stale closure
  const autoPilotActiveRef = useRef(false); // Use ref to check if autopilot should continue

  const fetchPendingReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const submissions = await submissionService.getSubmissionsByStatus('pending');
      // Sort by most recent first
      const sortedSubmissions = submissions.sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
      setPendingReports(sortedSubmissions);
      return sortedSubmissions; // Return the fresh data
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending reports');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, [refreshTrigger]);

  // Cleanup autopilot on unmount
  useEffect(() => {
    return () => {
      autoPilotActiveRef.current = false;
    };
  }, []);

  // Poll submission status until it's graded or failed
  const waitForSubmissionComplete = async (submissionId: string): Promise<string> => {
    const maxAttempts = 60; // 30 minutes max (30 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts && autoPilotActiveRef.current) {
      const { data, error } = await supabase
        .from('submissions')
        .select('status, grade')
        .eq('id', submissionId)
        .single();

      if (error) {
        console.error(`Error checking status for ${submissionId}:`, error);
        return 'error';
      }

      // Update the status in real-time so user can see current state
      setProcessedInSession(prev => {
        const newMap = new Map(prev);
        newMap.set(submissionId, {
          timestamp: Date.now(),
          status: data.status // Show actual status: pending, in_progress, graded, failed
        });
        return newMap;
      });

      if (data.status === 'graded') {
        console.log(`✓ Submission ${submissionId} graded with score: ${data.grade}`);
        return 'graded';
      }

      if (data.status === 'failed') {
        console.log(`✗ Submission ${submissionId} failed`);
        return 'failed';
      }

      // Wait 30 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 30000));
      attempts++;

      if (attempts % 2 === 0) { // Log every minute
        console.log(`Still waiting for ${submissionId}... (${attempts * 30}s elapsed, status: ${data.status})`);
      }
    }

    // Return timeout if we exceeded max attempts, stopped if user stopped autopilot
    return attempts >= maxAttempts ? 'timeout' : 'stopped';
  };

  const processNextSubmission = async () => {
    // Check if autopilot is still active
    if (!autoPilotActiveRef.current) {
      console.log('Auto-pilot stopped');
      return;
    }

    // Check if we've reached the end of the list
    if (currentIndexRef.current >= pendingReports.length) {
      console.log('Reached end of list. All submissions processed!');
      autoPilotActiveRef.current = false;
      setAutoPilotActive(false);
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      return;
    }

    const idx = currentIndexRef.current;
    const nextSubmission = pendingReports[idx];

    setCurrentlyProcessing(nextSubmission.id);
    setLastProcessedId(nextSubmission.id);

    try {
      console.log(`Processing submission ${idx + 1}/${pendingReports.length}: ${nextSubmission.id}`);

      // Fetch full submission data to get audio URLs
      const { data: fullSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('id, recordings, section_feedback')
        .eq('id', nextSubmission.id)
        .single();

      if (fetchError || !fullSubmission) {
        throw new Error('Failed to fetch submission data');
      }

      // Extract audio URLs from recordings or section_feedback
      let audioUrls: string[] = [];

      if (fullSubmission.recordings && (fullSubmission.recordings as any[]).length > 0) {
        // V1 format: recordings array
        audioUrls = (fullSubmission.recordings as any[]).map((r: any) => r.audioUrl).filter(Boolean);
      } else if (fullSubmission.section_feedback && (fullSubmission.section_feedback as any[]).length > 0) {
        // V2 format: section_feedback array
        const sorted = [...(fullSubmission.section_feedback as any[])]
          .filter((item: any) => item.audio_url)
          .sort((a: any, b: any) => (a.question_id || 0) - (b.question_id || 0));
        audioUrls = sorted.map((item: any) => item.audio_url);
      }

      if (audioUrls.length === 0) {
        throw new Error('No audio URLs found in submission');
      }

      // Call the V2 processing endpoint
      const response = await fetch("https://audio-analysis-api-tplvyztxfa-uc.a.run.app/api/v1/submissions/process-by-uid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          submission_uid: nextSubmission.id
        })
      });

      if (response.ok) {
        console.log(`✓ Successfully sent ${nextSubmission.id} for processing, waiting for completion...`);
        setProcessedInSession(prev => {
          const newMap = new Map(prev);
          newMap.set(nextSubmission.id, {
            timestamp: Date.now(),
            status: 'sending'
          });
          return newMap;
        });

        // Wait for the submission to be fully graded
        const finalStatus = await waitForSubmissionComplete(nextSubmission.id);

        setProcessedInSession(prev => {
          const newMap = new Map(prev);
          newMap.set(nextSubmission.id, {
            timestamp: Date.now(),
            status: finalStatus
          });
          return newMap;
        });
      } else {
        console.error(`✗ Failed to send ${nextSubmission.id} for processing`);
        setProcessedInSession(prev => {
          const newMap = new Map(prev);
          newMap.set(nextSubmission.id, {
            timestamp: Date.now(),
            status: 'send_failed'
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error(`✗ Error processing ${nextSubmission.id}:`, error);
      setProcessedInSession(prev => {
        const newMap = new Map(prev);
        newMap.set(nextSubmission.id, {
          timestamp: Date.now(),
          status: 'error'
        });
        return newMap;
      });
    } finally {
      setCurrentlyProcessing(null);
      // Move to next submission
      currentIndexRef.current = idx + 1;
      setCurrentIndex(idx + 1);

      // Process next submission after this one is fully done
      if (autoPilotActiveRef.current && currentIndexRef.current < pendingReports.length) {
        // Small delay before starting next submission
        setTimeout(() => {
          processNextSubmission();
        }, 2000);
      } else if (currentIndexRef.current >= pendingReports.length) {
        console.log('All submissions processed!');
        autoPilotActiveRef.current = false;
        setAutoPilotActive(false);
      }
    }
  };

  const startAutoPilot = () => {
    setAutoPilotActive(true);
    autoPilotActiveRef.current = true;
    setProcessedInSession(new Map()); // Reset processed map
    setLastProcessedId(null);
    setCurrentIndex(0); // Start from the beginning
    currentIndexRef.current = 0; // Reset ref

    // Start sequential processing
    processNextSubmission();
  };

  const stopAutoPilot = () => {
    setAutoPilotActive(false);
    autoPilotActiveRef.current = false;
    setCurrentlyProcessing(null);
    setCurrentIndex(0);
    currentIndexRef.current = 0; // Reset ref
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingReports.length) {
      setSelectedIds(new Set());
      onSelectReports?.([]);
    } else {
      const allIds = new Set(pendingReports.map(r => r.id));
      setSelectedIds(allIds);
      onSelectReports?.(Array.from(allIds));
    }
  };

  const handleSelectReport = (submissionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedIds(newSelected);
    onSelectReports?.(Array.from(newSelected));
  };

  const handleViewReport = (submissionId: string) => {
    const url = `/student/submission/${submissionId}/feedback`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeSinceSubmission = (submittedAt: string) => {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const diffMs = now.getTime() - submitted.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              Pending Reports
              <Badge variant="secondary" className="ml-2">
                {pendingReports.length} pending
              </Badge>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Badge variant="outline" className="text-blue-600">
                {selectedIds.size} selected
              </Badge>
            )}
            {autoPilotActive && (
              <Badge variant="default" className="bg-green-600">
                Auto-Pilot Active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingReports}
              disabled={loading || autoPilotActive}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading pending reports...</span>
          </div>
        ) : pendingReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">🎉 No pending reports!</div>
            <p className="text-sm">All reports have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Auto-Pilot Controls */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Auto-Pilot Mode (Sequential)</h4>
              <div className="flex items-center gap-4">
                {!autoPilotActive ? (
                  <Button
                    onClick={startAutoPilot}
                    disabled={pendingReports.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Auto-Pilot
                  </Button>
                ) : (
                  <Button
                    onClick={stopAutoPilot}
                    variant="destructive"
                    size="sm"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Stop Auto-Pilot
                  </Button>
                )}

                {autoPilotActive && (
                  <div className="text-sm text-gray-700">
                    Progress: <strong>{currentIndex}/{pendingReports.length}</strong> |
                    Processed: <strong>{processedInSession.size}</strong>
                    {lastProcessedId && (
                      <span className="ml-2 text-blue-600">
                        | Last: {lastProcessedId.slice(0, 8)}...
                      </span>
                    )}
                    {currentlyProcessing && (
                      <span className="ml-2 text-yellow-600">
                        | Processing: {currentlyProcessing.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Auto-pilot processes submissions one at a time, waiting for each to be fully graded before moving to the next. Status updates every 30 seconds.
              </p>
            </div>

            {/* Processed Submissions Log */}
            {processedInSession.size > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Processed in This Session ({processedInSession.size})
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Array.from(processedInSession.entries())
                    .sort((a, b) => b[1].timestamp - a[1].timestamp)
                    .map(([id, info]) => (
                      <div key={id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded">
                        <span className="font-mono text-gray-700">{id.slice(0, 16)}...</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded ${
                            info.status === 'sending' ? 'bg-purple-100 text-purple-700' :
                            info.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            info.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            info.status === 'graded' ? 'bg-green-100 text-green-700' :
                            info.status === 'failed' ? 'bg-red-100 text-red-700' :
                            info.status === 'send_failed' ? 'bg-red-100 text-red-700' :
                            info.status === 'stopped' ? 'bg-gray-100 text-gray-700' :
                            info.status === 'error' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {info.status}
                          </span>
                          <span className="text-gray-500">
                            {new Date(info.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingReports.length && pendingReports.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({pendingReports.length} reports)
                </span>
              </div>
              {selectedIds.size > 0 && (
                <div className="text-sm text-blue-600">
                  {selectedIds.size} report{selectedIds.size !== 1 ? 's' : ''} selected for processing
                </div>
              )}
            </div>

            {/* Reports Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Assignment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Time Ago
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingReports.map((report) => (
                      <tr
                        key={report.id}
                        className={`hover:bg-gray-50 ${
                          selectedIds.has(report.id) ? 'bg-blue-50' : ''
                        } ${currentlyProcessing === report.id ? 'bg-yellow-100' : ''} ${
                          processedInSession.has(report.id) ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(report.id)}
                            onChange={() => handleSelectReport(report.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono text-gray-900 max-w-xs break-all">
                            {report.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {/* Use student_name if available, fallback to student_id */}
                            {report.student_name || report.student_id || 'Unknown Student'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {/* Use student_email if available, fallback to 'N/A' */}
                            {report.student_email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {report.assignment_title || 'Unknown Assignment'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {/* Use teacher_name if available, fallback to 'Unknown Teacher' */}
                            {report.teacher_name || 'Unknown Teacher'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {formatDate(report.submitted_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {getTimeSinceSubmission(report.submitted_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(report.id)}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingReportsTable;