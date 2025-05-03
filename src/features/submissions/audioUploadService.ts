import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an audio blob to Supabase Storage
 */
export async function uploadAudioToStorage(
  blob: Blob, 
  assignmentId: string, 
  questionId: string, 
  studentId: string
): Promise<string> {
  // Create a unique filename to avoid collisions
  const timestamp = new Date().getTime();
  const filename = `${studentId}_${assignmentId}_${questionId}_${timestamp}.webm`;
  
  // Convert blob to File object
  const file = new File([blob], filename, { type: 'audio/webm' });
  
  // Define the storage path
  const filePath = `recordings/${assignmentId}/${filename}`;
  
  // Upload to Supabase Storage
  const { error } = await supabase
    .storage
    .from('recordings') // Your bucket name
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
): Promise<string[]> {
  // Array to store all uploaded URLs
  const uploadedUrls: string[] = [];
  
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
      
      // Add URL to the array
      uploadedUrls.push(publicUrl);
    }
  }
  
  if (uploadedUrls.length === 0) {
    throw new Error('No recordings selected for submission');
  }
  
  return uploadedUrls;
}