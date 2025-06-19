import { supabase } from "@/integrations/supabase/client";
import { RecordingData } from "./types";
import { validateAudioBlob } from "@/utils/webm-diagnostics";

/**
 * Gets the appropriate file extension based on MIME type
 */
function getFileExtension(mimeType: string): string {
  // Handle codec-specific MIME types by checking the base type
  const baseType = mimeType.split(';')[0].toLowerCase();
  
  const extensionMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',  // Use .m4a for audio-only MP4
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg'
  };
  
  const extension = extensionMap[baseType];
  if (extension) {
    return extension;
  }
  
  // Try to infer from the full MIME type if base type didn't match
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('ogg')) return 'ogg';
  
  // Log unknown MIME type for debugging
  console.warn(`Unknown MIME type: ${mimeType}, defaulting to .m4a`);
  return 'm4a'; // Default to m4a instead of webm for better compatibility
}

/**
 * Uploads an audio blob to Supabase Storage
 */
export async function uploadAudioToStorage(
  blob: Blob, 
  assignmentId: string, 
  questionId: string, 
  studentId: string
): Promise<string> {
  // Validate the blob before uploading
  const validation = await validateAudioBlob(blob);
  if (!validation.valid) {
    throw new Error(`Invalid audio file: ${validation.error}`);
  }

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('Authentication error:', sessionError);
    throw new Error('User must be authenticated to upload recordings');
  }

  // Create a unique filename to avoid collisions
  const timestamp = new Date().getTime();
  const extension = getFileExtension(blob.type);
  const filename = `${studentId}_${assignmentId}_${questionId}_${timestamp}.${extension}`;
  
  // Convert blob to File object
  const file = new File([blob], filename, { type: blob.type });
  
  // Define the storage path - using a more structured path
  const filePath = `recordings/${studentId}/${assignmentId}/${filename}`;
  
  try {
    // Upload to Supabase Storage
    const { error } = await supabase
      .storage
      .from('recordings')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading recording:', error);
      throw new Error(`Failed to upload recording: ${error.message}`);
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('recordings')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload recording. Please try again.');
  }
}

/**
 * Prepares recordings for submission
 * Returns array of URLs for backend processing
 */
export async function prepareRecordingsForSubmission(
    recordings: Record<number, { blob: Blob, url: string, createdAt: Date } | null>,
    assignmentId: string,
    studentId: string,
    questions: { id: string }[]
  ): Promise<RecordingData[]> {
    // Array to store all uploaded recordings
    const recordingData: RecordingData[] = [];
    
    // Process each selected recording
    for (const [questionIdx, recording] of Object.entries(recordings)) {
      if (recording) {
        const idx = parseInt(questionIdx);
        const questionId = (questions[idx]?.id || idx).toString();
        
        // Validate the recording before uploading
        const validation = await validateAudioBlob(recording.blob);
        if (!validation.valid) {
          throw new Error(`Invalid recording for question ${questionId}: ${validation.error}`);
        }
        
        // Upload the recording to Supabase
        const publicUrl = await uploadAudioToStorage(
          recording.blob,
          assignmentId,
          questionId,
          studentId
        );
        
        // Add to the recording data array
        recordingData.push({
          questionId,
          audioUrl: publicUrl
        });
      }
    }
    
    if (recordingData.length === 0) {
      throw new Error('No recordings selected for submission');
    }
    
    return recordingData;
}