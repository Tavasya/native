//what crud operations are needed
//Create: submissions
//Read: Fetch all submission and single submissions
//update: submissions can be updated with grading and feedback
//Delete : is deletion needed: maybe

import { supabase } from "@/integrations/supabase/client";
import { Submission, CreateSubmissionDto, UpdateSubmissionDto, RecordingData } from "./types";

interface AudioAnalysisResponse {
  success: boolean;
  data?: {
    transcription?: string;
    analysis?: any;
  };
  error?: string;
}

// Validation helper functions
const validateUUID = (id: string, fieldName: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid ${fieldName}: Must be a valid UUID`);
  }
};

const validateAudioUrl = async (url: string): Promise<void> => {
  try {
    // First check if the URL is valid
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid audio URL format');
    }

    // Check if the URL is from our Supabase storage
    if (!url.includes('supabase.co/storage/v1')) {
      throw new Error('Audio URL must be from Supabase storage');
    }

    // Make a HEAD request to check if the file exists
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Audio file not accessible: ${response.status} ${response.statusText}`);
    }

    // Check file size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > 10) { // 10MB limit
        throw new Error(`Audio file too large: ${sizeInMB.toFixed(2)}MB`);
      }
    }

    // For Supabase storage, we'll accept application/octet-stream
    const contentType = response.headers.get('content-type');
    const validContentTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'application/octet-stream'];
    if (!contentType || !validContentTypes.some(type => contentType.includes(type))) {
      throw new Error(`Invalid content type for audio file: ${contentType}`);
    }

    // Verify the file extension
    const fileExtension = url.split('.').pop()?.toLowerCase();
    const validExtensions = ['webm', 'mp4', 'mp3', 'wav'];
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file extension: ${fileExtension}`);
    }

  } catch (error) {
    throw new Error(`Failed to validate audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const validateRecordingData = async (recording: RecordingData) => {
  console.log("Validating recording data:", recording);
  
  if (!recording.questionId) throw new Error('Question ID is required for recording');
  if (!recording.audioUrl) throw new Error('Audio URL is required for recording');
  
  // Only validate UUID for assignment_id and student_id
  // Question IDs might be in a different format
  if (typeof recording.questionId !== 'string') {
    throw new Error('Question ID must be a string');
  }
  
  // Validate audio URL and file
  await validateAudioUrl(recording.audioUrl);
};

const validateSubmissionData = async (data: CreateSubmissionDto) => {
  console.log("Validating submission data:", {
    assignment_id: data.assignment_id,
    student_id: data.student_id,
    recordings_count: data.recordings?.length,
    recordings: data.recordings
  });

  if (!data.assignment_id) throw new Error('Assignment ID is required');
  if (!data.student_id) throw new Error('Student ID is required');
  if (!data.recordings || !Array.isArray(data.recordings) || data.recordings.length === 0) {
    throw new Error('At least one recording is required');
  }

  validateUUID(data.assignment_id, 'Assignment ID');
  validateUUID(data.student_id, 'Student ID');

  // Validate each recording
  for (const [index, recording] of data.recordings.entries()) {
    try {
      await validateRecordingData(recording);
    } catch (error: any) {
      throw new Error(`Invalid recording at index ${index}: ${error.message}`);
    }
  }
};

const formatSubmissionData = async (data: CreateSubmissionDto) => {
  console.log("Formatting submission data:", data);
  
  // Ensure all required fields are present and properly formatted
  const formattedData = {
    assignment_id: data.assignment_id.trim(),
    student_id: data.student_id.trim(),
    attempt: data.attempt || 1,
    recordings: data.recordings.map(recording => {
      console.log("Formatting recording:", recording);
      return {
        questionId: String(recording.questionId).trim(),
        audioUrl: recording.audioUrl.trim()
      };
    }),
    status: 'pending' as const,
    submitted_at: new Date().toISOString()
  };

  console.log("Formatted data:", formattedData);

  // Validate the formatted data
  await validateSubmissionData({
    ...formattedData,
    recordings: formattedData.recordings
  });

  return formattedData;
};

export const submissionService = {

  // Create new Submission
  async createSubmission(data: CreateSubmissionDto): Promise<Submission> {
    try {
      console.log("Starting submission creation with data:", {
        assignment_id: data.assignment_id,
        student_id: data.student_id,
        recordings_count: data.recordings?.length,
        recordings: data.recordings
      });

      // Format and validate the data
      const formattedData = await formatSubmissionData(data);
      console.log("Formatted submission data:", formattedData);

      // If attempt is not provided, calculate it based on existing submissions
      if (formattedData.attempt === 1) {
        console.log("Calculating attempt number for submission");
        const { data: existingSubmissions, error: fetchError } = await supabase
          .from("submissions")
          .select("attempt")
          .eq("assignment_id", formattedData.assignment_id)
          .eq("student_id", formattedData.student_id)
          .order("attempt", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("Error fetching existing submissions:", fetchError);
          throw new Error(`Failed to check existing submissions: ${fetchError.message}`);
        }

        formattedData.attempt = existingSubmissions && existingSubmissions.length > 0 
          ? existingSubmissions[0].attempt + 1 
          : 1;
        
        console.log("Calculated attempt number:", formattedData.attempt);
      }

      console.log("Inserting submission into Supabase:", formattedData);

      const { data: submission, error } = await supabase
        .from("submissions")
        .insert([formattedData])
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Handle specific Supabase error codes
        switch (error.code) {
          case '23505': // unique_violation
            throw new Error('A submission for this assignment already exists');
          case '23503': // foreign_key_violation
            throw new Error('Invalid assignment or student ID');
          case '22P02': // invalid_text_representation
            throw new Error('Invalid ID format provided');
          default:
            throw new Error(`Failed to create submission: ${error.message}`);
        }
      }

      if (!submission) {
        throw new Error("No submission returned from Supabase");
      }

      console.log("Successfully created submission:", {
        id: submission.id,
        status: submission.status,
        attempt: submission.attempt,
        recordings_count: submission.recordings?.length,
        recordings: submission.recordings
      });

      return submission;
    } catch (error) {
      console.error("Error in createSubmission:", error);
      throw error;
    }
  },

  //Fetch all submisions
  async getSubmissionsByAssignmentAndStudent(assignment_id: string, student_id: string): Promise<Submission[]> {
    try {
      validateUUID(assignment_id, 'Assignment ID');
      validateUUID(student_id, 'Student ID');

      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignment_id)
        .eq("student_id", student_id)
        .order("attempt", { ascending: false });
    
      if (error) {
        console.error("Error fetching submissions:", error);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in getSubmissionsByAssignmentAndStudent:", error);
      throw error;
    }
  },

  //Fetch single submission
  async getSubmissionById(id: string): Promise<Submission> {
    try {
      validateUUID(id, 'Submission ID');

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          assignments!inner(title),
          users!inner(name)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching submission:", error);
        if (error.code === 'PGRST116') {
          throw new Error('Submission not found');
        }
        throw new Error(`Failed to fetch submission: ${error.message}`);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      // Transform the data to include assignment_title and student_name
      const transformedData = {
        ...data,
        assignment_title: data.assignments?.title,
        student_name: data.users?.name
      };

      return transformedData;
    } catch (error) {
      console.error("Error in getSubmissionById:", error);
      throw error;
    }
  },

  
  //Update Submission
  async updateSubmission(id: string, updates: UpdateSubmissionDto): Promise<Submission> {
    try {
      validateUUID(id, 'Submission ID');

      const { data, error } = await supabase
        .from("submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating submission:", error);
        if (error.code === 'PGRST116') {
          throw new Error('Submission not found');
        }
        throw new Error(`Failed to update submission: ${error.message}`);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      return data;
    } catch (error) {
      console.error("Error in updateSubmission:", error);
      throw error;
    }
  },

  async deleteSubmission(id: string): Promise<void> {
    try {
      validateUUID(id, 'Submission ID');

      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting submission:", error);
        if (error.code === 'PGRST116') {
          throw new Error('Submission not found');
        }
        throw new Error(`Failed to delete submission: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deleteSubmission:", error);
      throw error;
    }
  },


  async analyzeAudio(urls: string[], submission_id: string): Promise<AudioAnalysisResponse> {
    try {
      console.log('=== AUDIO ANALYSIS DEBUG START ===');
      console.log('Submission ID:', submission_id);
      console.log('Number of audio URLs:', urls.length);
      console.log('Audio URLs:', urls);
      console.log('Sending to /analyze endpoint:', {
        audio_urls: urls,
        submission_url: submission_id
      });
      // const response = await fetch("", {
      
      const response = await fetch("https://classconnect-staging-107872842385.us-west2.run.app/api/v1/submission/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          audio_urls: urls,
          submission_url: submission_id
        }),
      });

      console.log('Analysis response status:', response.status);
      console.log('Analysis response headers:', Object.fromEntries(response.headers.entries()));
      const data = await response.json();
      console.log('Analysis response data:', data);

      if (!response.ok) {
        console.error('Analysis request failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.error || 'Failed to analyze audio');
      }

      console.log('=== AUDIO ANALYSIS DEBUG END ===');
      return data;
    } catch (error) {
      console.error('=== AUDIO ANALYSIS ERROR ===');
      console.error('Error in analyzeAudio:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  // Add this new function to verify submission details
  async verifySubmission(id: string): Promise<{
    exists: boolean;
    details?: Submission;
    error?: string;
  }> {
    try {
      console.log("Verifying submission:", id);
      
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error verifying submission:", error);
        return {
          exists: false,
          error: error.message
        };
      }

      if (!data) {
        console.log("Submission not found");
        return {
          exists: false,
          error: "Submission not found"
        };
      }

      console.log("Submission verified:", {
        id: data.id,
        status: data.status,
        attempt: data.attempt,
        recordings_count: data.recordings?.length
      });

      return {
        exists: true,
        details: data
      };
    } catch (error) {
      console.error("Error in verifySubmission:", error);
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  },
};