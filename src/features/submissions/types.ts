import Submission from "@/pages/student/Submission";

export interface SectionFeedback {
    grade: number;
    feedback: string
}

export type SubmissionStatus = 'pending' | 'graded' | 'rejected';

export interface RecordingData {
    questionId: string;  // ID of the question this recording answers
    audioUrl: string;    // URL to the audio file in Supabase Storage
}

export interface CreateSubmissionWithRecordings {
    assignment_id: string;
    student_id: string;
    attempt?: number;
    recordings: Record<number, { blob: Blob, url: string, createdAt: Date } | null>;
    questions: { id: string }[];  // We only need the id property
}

//Data for supabase
export interface Submission {
    id: string;
    assignment_id: string;
    student_id: string;
    attempt: number;
    status: SubmissionStatus;
    section_feedback: Record<string, SectionFeedback>;
    submitted_at: string;
    grade?: number; //overall grade
    valid_transcript: boolean;
    recordings?: RecordingData[]; // New field for multiple recordings
}

//data for backend api
export interface CreateSubmissionDto {
    assignment_id: string;
    student_id: string;
    attempt?: number;
    audio_url?: string;  // Made optional for backward compatibility
    recordings: RecordingData[]; // Made required since we're using this now
}

export interface UpdateSubmissionDto {
    id: string;
    status?: SubmissionStatus;
    grade?: number;
    feedback?: string;
    section_feedback?: Record<string, SectionFeedback>;
    valid_transcript?: boolean;
}

// Redux state
export interface SubmissionsState {
    submissions: Submission[];
    loading: boolean;
    error: string | null;
    selectedSubmission?: Submission;
}