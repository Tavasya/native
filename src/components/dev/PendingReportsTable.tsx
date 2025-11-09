import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Play, Pause } from 'lucide-react';
import { submissionService } from '@/features/submissions/submissionsService';
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
  const [intervalSeconds, setIntervalSeconds] = useState(30);
  const [processedInSession, setProcessedInSession] = useState<Set<string>>(new Set());
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const autoPilotInterval = useRef<NodeJS.Timeout | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending reports');
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
      if (autoPilotInterval.current) {
        clearInterval(autoPilotInterval.current);
      }
    };
  }, []);

  const processNextSubmission = async () => {
    // Get unprocessed submissions (not in processedInSession)
    const unprocessed = pendingReports.filter(r => !processedInSession.has(r.id));

    if (unprocessed.length === 0) {
      console.log('No more unprocessed submissions');
      return;
    }

    // Get the first unprocessed submission
    const nextSubmission = unprocessed[0];
    setCurrentlyProcessing(nextSubmission.id);

    try {
      console.log(`Processing submission: ${nextSubmission.id}`);

      const response = await fetch("https://audio-analysis-api-115839253438.us-central1.run.app/api/v1/submissions/process-by-uid", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submission_uid: nextSubmission.id
        })
      });

      if (response.ok) {
        console.log(`Successfully sent ${nextSubmission.id} for processing`);
        // Mark as processed
        setProcessedInSession(prev => new Set([...prev, nextSubmission.id]));
        // Move to bottom by removing from pending list
        setPendingReports(prev => prev.filter(r => r.id !== nextSubmission.id));
      } else {
        console.error(`Failed to process ${nextSubmission.id}`);
      }
    } catch (error) {
      console.error(`Error processing ${nextSubmission.id}:`, error);
    } finally {
      setCurrentlyProcessing(null);
    }
  };

  const startAutoPilot = () => {
    setAutoPilotActive(true);
    setProcessedInSession(new Set()); // Reset processed set

    // Process first one immediately
    processNextSubmission();

    // Then process every X seconds
    autoPilotInterval.current = setInterval(() => {
      processNextSubmission();
    }, intervalSeconds * 1000);
  };

  const stopAutoPilot = () => {
    setAutoPilotActive(false);
    if (autoPilotInterval.current) {
      clearInterval(autoPilotInterval.current);
      autoPilotInterval.current = null;
    }
    setCurrentlyProcessing(null);
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
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Auto-Pilot Mode</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Interval:</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                    disabled={autoPilotActive}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>

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
                    Processed: <strong>{processedInSession.size}</strong> |
                    Remaining: <strong>{pendingReports.filter(r => !processedInSession.has(r.id)).length}</strong>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Auto-pilot will process one submission every {intervalSeconds} seconds, even if the previous one hasn't finished.
              </p>
            </div>

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