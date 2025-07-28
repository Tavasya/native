import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

export interface ProcessedReport {
  id: string;
  processedAt: string;
  status: 'success' | 'error';
  error?: string;
  mode: 'localhost' | 'trigger';
  submissionData?: {
    student_name?: string;
    assignment_title?: string;
    submitted_at?: string;
  };
}

interface ProcessedReportsTableProps {
  reports: ProcessedReport[];
  onClearReports?: () => void;
}

const ProcessedReportsTable: React.FC<ProcessedReportsTableProps> = ({ 
  reports,
  onClearReports 
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const handleViewReport = (submissionId: string) => {
    const url = `/student/submission/${submissionId}/feedback`;
    window.open(url, '_blank');
  };

  const toggleErrorExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedErrors(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: 'success' | 'error') => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: 'success' | 'error') => {
    return status === 'success' ? (
      <Badge variant="outline" className="text-green-700 border-green-300">
        Success
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-700 border-red-300">
        Failed
      </Badge>
    );
  };

  const getModeBadge = (mode: 'localhost' | 'trigger') => {
    return mode === 'localhost' ? (
      <Badge variant="secondary" className="text-blue-700 bg-blue-100">
        Localhost
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-purple-700 bg-purple-100">
        Trigger
      </Badge>
    );
  };

  const successCount = reports.filter(r => r.status === 'success').length;
  const errorCount = reports.filter(r => r.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Processed Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                {successCount} success
              </Badge>
              {errorCount > 0 && (
                <Badge variant="outline" className="text-red-700 border-red-300">
                  {errorCount} failed
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {reports.length} total
            </Badge>
            {reports.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearReports}
                className="flex items-center gap-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">📊 No processed reports yet</div>
            <p className="text-sm">Reports will appear here after processing.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
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
                      Mode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Processed At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <React.Fragment key={report.id}>
                      <tr className={`hover:bg-gray-50 ${
                        report.status === 'error' ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            {getStatusBadge(report.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono text-gray-900 max-w-xs break-all">
                            {report.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {report.submissionData?.student_name || 'Unknown Student'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {report.submissionData?.assignment_title || 'Unknown Assignment'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getModeBadge(report.mode)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {formatDate(report.processedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(report.id)}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                            {report.status === 'error' && report.error && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleErrorExpansion(report.id)}
                                className="flex items-center gap-1 text-red-600"
                              >
                                {expandedErrors.has(report.id) ? 'Hide' : 'Show'} Error
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Error Details Row */}
                      {report.status === 'error' && report.error && expandedErrors.has(report.id) && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-red-50 border-t border-red-200">
                            <div className="text-sm">
                              <div className="font-medium text-red-800 mb-1">Error Details:</div>
                              <div className="text-red-700 font-mono text-xs bg-red-100 p-2 rounded">
                                {report.error}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessedReportsTable;