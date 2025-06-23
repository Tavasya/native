import { RecordingData } from '@/features/submissions/types';

/**
 * Normalizes recording data to consistent Format 1 (object with audioUrl and questionId)
 * Handles both Format 1 (objects) and Format 2 (string URLs)
 */
export const normalizeRecordingFormat = (recordings: (string | RecordingData)[]): RecordingData[] => {
  if (!Array.isArray(recordings)) return [];
  
  return recordings.map((item, index) => {
    if (typeof item === 'string') {
      // Convert Format 2 (string URL) to Format 1 (object)
      return {
        audioUrl: item,
        questionId: `card-${index + 1}` // Generate questionId based on index
      };
    } else if (typeof item === 'object' && item !== null && item.audioUrl) {
      // Already Format 1 (object), ensure it has required fields
      return {
        audioUrl: item.audioUrl,
        questionId: item.questionId || `card-${index + 1}`
      };
    }
    
    // Invalid format, return null to be filtered out
    return null;
  }).filter((item): item is RecordingData => item !== null);
};

/**
 * Extracts audio URL from recording data regardless of format
 */
export const getRecordingUrl = (recording: string | RecordingData): string => {
  if (typeof recording === 'string') {
    return recording;
  }
  
  if (typeof recording === 'object' && recording !== null && recording.audioUrl) {
    return recording.audioUrl;
  }
  
  return '';
};

/**
 * Validates if recording data is in a supported format
 */
export const validateRecordingFormat = (recordings: (string | RecordingData)[]): boolean => {
  if (!Array.isArray(recordings)) return false;
  
  return recordings.every(item => {
    // Format 2: string URL
    if (typeof item === 'string') return true;
    
    // Format 1: object with audioUrl
    if (typeof item === 'object' && item !== null && item.audioUrl) return true;
    
    return false;
  });
};

/**
 * Gets the question ID from recording data, generating one if necessary
 */
export const getRecordingQuestionId = (recording: string | RecordingData, index: number): string => {
  if (typeof recording === 'object' && recording !== null && recording.questionId) {
    return recording.questionId;
  }
  
  return `card-${index + 1}`;
};

/**
 * Detects if recordings are in legacy string format and logs for debugging
 */
export const detectRecordingFormatIssues = (recordings: unknown[], context: string = ''): { hasIssues: boolean; analysis: Record<string, number> } => {
  if (!Array.isArray(recordings)) return { hasIssues: false, analysis: {} };
  
  const formatAnalysis = {
    total: recordings.length,
    stringFormat: recordings.filter(r => typeof r === 'string').length,
    objectFormat: recordings.filter(r => typeof r === 'object' && r !== null && (r as RecordingData).audioUrl).length,
    invalid: recordings.filter(r => typeof r !== 'string' && (typeof r !== 'object' || !(r as RecordingData)?.audioUrl)).length
  };
  
  const hasIssues = formatAnalysis.stringFormat > 0 || formatAnalysis.invalid > 0;
  
  if (hasIssues) {
    console.warn(`🔍 Recording Format Detection ${context}:`, {
      ...formatAnalysis,
      hasStringFormat: formatAnalysis.stringFormat > 0,
      hasObjectFormat: formatAnalysis.objectFormat > 0,
      needsNormalization: formatAnalysis.stringFormat > 0,
      recordings: recordings.slice(0, 2) // Show first 2 for debugging
    });
  }
  
  return { hasIssues, analysis: formatAnalysis };
};

/**
 * Safely gets playable URL from recording regardless of format
 */
export const getPlayableRecordingUrl = (recording: string | RecordingData | null | undefined): string => {
  if (typeof recording === 'string') {
    return recording;
  }
  
  if (typeof recording === 'object' && recording !== null && recording.audioUrl) {
    return recording.audioUrl;
  }
  
  return '';
};