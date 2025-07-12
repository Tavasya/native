import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, ExternalLink } from 'lucide-react';
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingReports}
              disabled={loading}
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
                        Assignment
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
                            {report.student_name || 'Unknown Student'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {report.assignment_title || 'Unknown Assignment'}
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