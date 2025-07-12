import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RefreshCw, Timer, Settings } from 'lucide-react';
import { submissionService } from '@/features/submissions/submissionsService';
import type { Submission } from '@/features/submissions/types';
import PendingReportsTable from './PendingReportsTable';
import ProcessedReportsTable, { type ProcessedReport } from './ProcessedReportsTable';

export type ProcessingMode = 'localhost' | 'trigger';

interface ReportsProcessorProps {
  onModeChange?: (mode: ProcessingMode) => void;
}

const ReportsProcessor: React.FC<ReportsProcessorProps> = ({ onModeChange }) => {
  const [mode, setMode] = useState<ProcessingMode>('localhost');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(3);
  const [intervalMinutes, setIntervalMinutes] = useState(2);
  const [countdown, setCountdown] = useState(0);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [processedReports, setProcessedReports] = useState<ProcessedReport[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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

      if (mode === 'localhost') {
        // Localhost Mode: Call API with audio URLs
        if (!submission.recordings || submission.recordings.length === 0) {
          throw new Error('No recordings found for this submission');
        }

        const audioUrls = submission.recordings.map((recording: any) => recording.audioUrl);

        const response = await fetch("http://localhost:8080/api/v1/submission/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            audio_urls: audioUrls,
            submission_url: submissionId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reprocess submission');
        }
      } else {
        // Trigger Mode: Call staging API with same schema as localhost
        if (!submission.recordings || submission.recordings.length === 0) {
          throw new Error('No recordings found for this submission');
        }

        const audioUrls = submission.recordings.map((recording: any) => recording.audioUrl);

        const response = await fetch("https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            audio_urls: audioUrls,
            submission_url: submissionId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reprocess submission');
        }
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
    
    // Refresh the pending reports table
    setRefreshTrigger(prev => prev + 1);
  };

  const getNextBatch = async (): Promise<string[]> => {
    try {
      const pendingSubmissions = await submissionService.getSubmissionsByStatus('pending');
      // Get the top N submissions based on batch size
      return pendingSubmissions.slice(0, batchSize).map(sub => sub.id);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
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
          {/* Mode Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Processing Mode:</label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value as ProcessingMode)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRunning}
            >
              <option value="localhost">Localhost Mode (Call API)</option>
              <option value="trigger">Trigger Mode (Supabase Trigger)</option>
            </select>
          </div>

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
              <Button onClick={startAutoProcessing} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Auto Processing
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