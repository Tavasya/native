import React, { useState } from 'react';
import { submissionService } from '@/features/submissions/submissionsService';
import type { QuestionFeedbackEntry } from '@/features/submissions/types';

const RedoV2: React.FC = () => {
  const [submissionId, setSubmissionId] = useState('');
  const [devMode, setDevMode] = useState<'localhost' | 'trigger'>('localhost');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState<QuestionFeedbackEntry[]>([]);

  const handleRedoV2 = async () => {
    if (!submissionId.trim()) {
      setError('Please enter a submission ID');
      return;
    }

    setIsProcessing(true);
    setMessage('');
    setError('');
    setSessionData([]);

    try {
      const submission = await submissionService.getSubmissionById(submissionId.trim());
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      if (!submission.section_feedback) {
        throw new Error('No session feedback found for this submission');
      }

      let feedbackData = submission.section_feedback;

      const questionsWithAudio = feedbackData.filter(item => 
        item.audio_url && typeof item.question_id === 'number'
      );

      const sortedData = questionsWithAudio.sort((a, b) => 
        (a.question_id || 0) - (b.question_id || 0)
      );

      setSessionData(sortedData);

      const audioUrls = sortedData.map(item => item.audio_url);

      if (devMode === 'localhost') {        
        const response = await fetch("http://localhost:8080/api/v1/submission/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            audio_urls: audioUrls,
            submission_url: submissionId.trim()
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reprocess submission');
        }

        setMessage(`Successfully called localhost API for ${audioUrls.length} recordings from session feedback (sorted by question ID)`);
      } else {
        // Trigger Mode: Call staging API with same schema as localhost
        const response = await fetch("https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            audio_urls: audioUrls,
            submission_url: submissionId.trim()
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reprocess submission');
        }
        
        setMessage(`Successfully called staging API for ${audioUrls.length} recordings from session feedback (sorted by question ID)`);
      }

    } catch (error: any) {
      setError(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Redo V2 - Session Feedback Processing
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="devModeV2" className="block text-sm font-medium text-gray-700 mb-2">
              Processing Mode
            </label>
            <select
              id="devModeV2"
              value={devMode}
              onChange={(e) => {
                setDevMode(e.target.value as 'localhost' | 'trigger');
                setMessage('');
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="localhost">Localhost Mode (Call API)</option>
              <option value="trigger">Trigger Mode (Supabase Trigger)</option>
            </select>
          </div>

          <div>
            <label htmlFor="submissionIdV2" className="block text-sm font-medium text-gray-700 mb-2">
              Submission ID
            </label>
            <input
              type="text"
              id="submissionIdV2"
              value={submissionId}
              onChange={(e) => {
                setSubmissionId(e.target.value);
                setMessage('');
                setError('');
                setSessionData([]);
              }}
              placeholder="Enter submission ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleRedoV2}
            disabled={isProcessing || !submissionId.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isProcessing || !submissionId.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isProcessing ? 'Processing V2...' : 'Redo V2 (Session Feedback)'}
          </button>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-700">{message}</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {sessionData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Found {sessionData.length} recordings (sorted by question ID):
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sessionData.map((item, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">Question {item.question_id}</div>
                    <div className="text-gray-600 truncate">
                      Audio: {item.audio_url?.split('/').pop()}
                    </div>
                    {item.transcript && (
                      <div className="text-gray-600 truncate mt-1">
                        Transcript: {item.transcript.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-700 mb-2">V2 Processing Details:</h4>
          <div className="space-y-3 text-sm text-purple-600">
            <div>• Pulls recordings from <code>section_feedback</code> column</div>
            <div>• Sorts recordings by <code>question_id</code> in numerical order</div>
            <div>• Filters out items without audio URLs</div>
            
            <div className="pt-2 border-t border-purple-200">
              <div className="font-medium text-purple-700 mb-2">Processing Modes:</div>
              <div>
                <strong>Localhost Mode:</strong> Calls localhost:8080 API with sorted audio URLs
              </div>
              <div>
                <strong>Trigger Mode:</strong> Calls staging API with sorted audio URLs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedoV2;