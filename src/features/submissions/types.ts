import Submission from "@/pages/student/Submission";

export interface SectionFeedback {
    grade: number;
    feedback: string
}
export type SubmissionStatus = 'pending' | 'graded' | 'rejected';

//Data for supabase
export interface Submission {
    id: string;
    assignment_id: string;
    student_id: string;
    attempt: number;
    status: SubmissionStatus;
    section_feedback: Record<string, SectionFeedback>
    submitted_at: string;
    submission_uid?: string;
    grade?: number; //overall grade
    valid_transcript: boolean;
    audio_url?: string;
}

//data for backend api
export interface CreateSubmissionDto {
    assignment_id: string;
    student_id: string;
    attempt?: number;
    audio_url: string;
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