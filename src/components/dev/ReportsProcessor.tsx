import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';
import { submissionService } from '@/features/submissions/submissionsService';

import PendingReportsTable from './PendingReportsTable';
import ProcessedReportsTable, { type ProcessedReport } from './ProcessedReportsTable';

export type ProcessingMode = 'localhost' | 'trigger';

interface ReportsProcessorProps {
  onModeChange?: (mode: ProcessingMode) => void;
}

const ReportsProcessor: React.FC<ReportsProcessorProps> = ({ onModeChange }) => {
  const [mode, setMode] = useState<ProcessingMode>('localhost');
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(3);
  const [intervalMinutes, setIntervalMinutes] = useState(2);
  const [countdown, setCountdown] = useState(0);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [processedReports, setProcessedReports] = useState<ProcessedReport[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [customSubmissionIds, setCustomSubmissionIds] = useState('');
  const [customIdsList, setCustomIdsList] = useState<string[]>([]);
  const [processedIdsSet, setProcessedIdsSet] = useState<Set<string>>(new Set());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && isAutoRunning) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown, isAutoRunning]);

  const handleModeChange = (newMode: ProcessingMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const processReport = async (submissionId: string): Promise<ProcessedReport> => {
    try {
      const submission = await submissionService.getSubmissionById(submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      let audioUrls: string[];

      if (version === 'v1') {
        // V1: Use recordings array
        if (!submission.recordings || submission.recordings.length === 0) {
          throw new Error('No recordings found for this submission');
        }
        audioUrls = submission.recordings.map((recording: any) => recording.audioUrl);
      } else {
        // V2: Use section_feedback array, sorted by question_id
        if (!submission.section_feedback) {
          throw new Error('No session feedback found for this submission');
        }

        const questionsWithAudio = submission.section_feedback.filter(item => 
          item.audio_url && typeof item.question_id === 'number'
        );

        const sortedData = questionsWithAudio.sort((a, b) => 
          (a.question_id || 0) - (b.question_id || 0)
        );

        audioUrls = sortedData.map(item => item.audio_url);

        if (audioUrls.length === 0) {
          throw new Error('No audio URLs found in session feedback');
        }
      }

      // Call the V2 processing endpoint (same for both localhost and staging mode)
      const apiUrl = mode === 'localhost'
        ? "http://localhost:8080/api/v1/submissions/process-by-uid"
        : "https://audio-analysis-api-tplvyztxfa-uc.a.run.app/api/v1/submissions/process-by-uid";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          submission_uid: submissionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reprocess submission');
      }

      return {
        id: submissionId,
        processedAt: new Date().toISOString(),
        status: 'success',
        mode,
        submissionData: {
          student_name: submission.student_name,
          assignment_title: submission.assignment_title,
          submitted_at: submission.submitted_at
        }
      };
    } catch (error: any) {
      return {
        id: submissionId,
        processedAt: new Date().toISOString(),
        status: 'error',
        error: error.message,
        mode,
        submissionData: {
          student_name: 'Unknown',
          assignment_title: 'Unknown',
          submitted_at: new Date().toISOString()
        }
      };
    }
  };

  const processBatch = async (submissionIds: string[]) => {
    if (submissionIds.length === 0) return;
    
    setCurrentBatch(submissionIds);
    
    const results = await Promise.all(
      submissionIds.map(id => processReport(id))
    );
    
    setProcessedReports(prev => [...prev, ...results]);
    setCurrentBatch([]);
    
    // For v2, track processed IDs and remove from custom list
    if (version === 'v2') {
      setProcessedIdsSet(prev => new Set([...prev, ...submissionIds]));
      setCustomIdsList(prev => prev.filter(id => !submissionIds.includes(id)));
    }
    
    // Refresh the pending reports table
    setRefreshTrigger(prev => prev + 1);
  };

  const getNextBatch = async (): Promise<string[]> => {
    try {
      if (version === 'v2' && customIdsList.length > 0) {
        // V2: Use custom submission IDs list, excluding currently processing and already processed
        const availableIds = customIdsList.filter(id => 
          !currentBatch.includes(id) && !processedIdsSet.has(id)
        );
        return availableIds.slice(0, batchSize);
      } else {
        // V1: Use pending submissions from database
        const pendingSubmissions = await submissionService.getSubmissionsByStatus('pending');
        return pendingSubmissions.slice(0, batchSize).map(sub => sub.id);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  };

  const startAutoProcessing = async () => {
    setIsAutoRunning(true);
    const intervalSeconds = intervalMinutes * 60;
    setCountdown(intervalSeconds);
    
    // Process first batch immediately
    const firstBatch = await getNextBatch();
    if (firstBatch.length > 0) {
      await processBatch(firstBatch);
    }
    
    intervalRef.current = setInterval(async () => {
      const nextBatch = await getNextBatch();
      if (nextBatch.length > 0) {
        await processBatch(nextBatch);
      } else if (version === 'v2') {
        // For v2, stop auto-processing when custom list is empty
        stopAutoProcessing();
        return;
      }
      setCountdown(intervalSeconds); // Reset countdown
    }, intervalSeconds * 1000); // Convert to milliseconds
  };

  const stopAutoProcessing = () => {
    setIsAutoRunning(false);
    setCountdown(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcessSelected = async () => {
    if (selectedPendingIds.length === 0) return;
    await processBatch(selectedPendingIds);
    setSelectedPendingIds([]);
  };

  const handleClearProcessedReports = () => {
    setProcessedReports([]);
  };

  const handleAddCustomIds = () => {
    const ids = customSubmissionIds
      .split(/[,\n\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    setCustomIdsList(prev => [...new Set([...prev, ...ids])]);
    setCustomSubmissionIds('');
  };

  const handleClearCustomIds = () => {
    setCustomIdsList([]);
    setCustomSubmissionIds('');
    setProcessedIdsSet(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Reports Processor
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAutoRunning && countdown > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Next batch: {formatTime(countdown)}
                </Badge>
              )}
              {currentBatch.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Processing {currentBatch.length} reports
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Version Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Version:</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as 'v1' | 'v2')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRunning}
            >
              <option value="v1">V1 - Pending Submissions (recordings array)</option>
              <option value="v2">V2 - Custom List (section_feedback)</option>
            </select>
          </div>

          {/* Mode Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Processing Mode:</label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as ProcessingMode)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRunning}
            >
              <option value="localhost">Localhost Mode</option>
              <option value="trigger">Staging Mode</option>
            </select>
          </div>

          {/* V2 Custom Submission IDs */}
          {version === 'v2' && (
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-medium text-purple-700">Custom Submission IDs (V2)</h4>
              <div className="space-y-2">
                <textarea
                  value={customSubmissionIds}
                  onChange={(e) => setCustomSubmissionIds(e.target.value)}
                  placeholder="Enter submission IDs (comma, space, or newline separated)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  disabled={isAutoRunning}
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAddCustomIds}
                    disabled={!customSubmissionIds.trim() || isAutoRunning}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Add IDs to List
                  </Button>
                  <Button
                    onClick={handleClearCustomIds}
                    disabled={customIdsList.length === 0 || isAutoRunning}
                    variant="outline"
                    size="sm"
                  >
                    Clear List ({customIdsList.length})
                  </Button>
                </div>
                {customIdsList.length > 0 && (
                  <div className="text-xs text-purple-600">
                    <strong>Queued IDs ({customIdsList.length}):</strong> {customIdsList.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Size Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Batch Size:</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRunning}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                <option key={size} value={size}>{size} reports per batch</option>
              ))}
            </select>
          </div>

          {/* Interval Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Interval:</label>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRunning}
            >
              <option value={0.5}>30 seconds</option>
              <option value={1}>1 minute</option>
              <option value={2}>2 minutes</option>
              <option value={3}>3 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isAutoRunning ? (
              <Button 
                onClick={startAutoProcessing} 
                className="flex items-center gap-2"
                disabled={version === 'v2' && customIdsList.length === 0}
              >
                <Play className="h-4 w-4" />
                Start Auto Processing
                {version === 'v2' && customIdsList.length === 0 && (
                  <span className="text-xs">(Add IDs first)</span>
                )}
              </Button>
            ) : (
              <Button onClick={stopAutoProcessing} variant="destructive" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Stop Auto Processing
              </Button>
            )}
            
            {selectedPendingIds.length > 0 && !isAutoRunning && (
              <Button onClick={handleProcessSelected} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Process Selected ({selectedPendingIds.length})
              </Button>
            )}
          </div>

          {/* Mode Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            {mode === 'localhost' ? (
              <div>
                <strong className="text-blue-700">Localhost Mode:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                  <li>• Fetches submission recordings and extracts audio URLs</li>
                  <li>• Calls localhost:8080 API with audio URLs</li>
                  <li>• Best for developers with local API running</li>
                </ul>
              </div>
            ) : (
              <div>
                <strong className="text-green-700">Trigger Mode:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                  <li>• Fetches submission recordings and extracts audio URLs</li>
                  <li>• Calls staging API at classconnect-staging.us-west2.run.app</li>
                  <li>• Perfect for production-like testing environment</li>
                </ul>
              </div>
            )}
          </div>

          {/* Current Status */}
          {isAutoRunning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">Auto-processing active</span>
                <span className="text-blue-600">
                  Batch size: {batchSize} | Interval: {intervalMinutes >= 1 ? `${intervalMinutes}min` : `${intervalMinutes * 60}sec`} | Mode: {mode}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Reports Table */}
      <PendingReportsTable 
        onSelectReports={setSelectedPendingIds}
        refreshTrigger={refreshTrigger}
      />

      {/* Processed Reports Table */}
      <ProcessedReportsTable 
        reports={processedReports}
        onClearReports={handleClearProcessedReports}
      />
    </div>
  );
};

export default ReportsProcessor;