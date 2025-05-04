import { supabase } from "@/integrations/supabase/client";
import { RecordingData } from "./types";

/**
 * Gets the appropriate file extension based on MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'audio/webm;codecs=opus': 'webm',
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav'
  };
  
  return extensionMap[mimeType] || 'webm';
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