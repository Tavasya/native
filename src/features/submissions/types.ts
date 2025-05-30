import Submission from "@/pages/student/Submission";

export interface SectionFeedback {
    grade: number;
    feedback: string;
    audio_url?: string;
    transcript?: string;
    pronunciation?: {
        grade: number;
        issues: {
            type?: string;
            message?: string;
        }[];
        word_details: {
            word: string;
            accuracy_score: number;
            error_type: string;
            phoneme_details: {
                phoneme: string;
                accuracy_score: number;
            }[];
        }[];
        critical_errors: {
            word: string;
            score: number;
            timestamp: number;
            duration: number;
        }[];
    };
    grammar?: {
        grade: number;
        issues: {
            original?: string;
            correction: {
                suggested_correction: string;
                explanation: string;
            };
        }[];
    };
    lexical?: {
        grade: number;
        issues: {
            sentence?: string;
            suggestion: {
                suggested_phrase: string;
                explanation: string;
            };
        }[];
    };
    fluency?: {
        grade: number;
        issues: string[];
        wpm?: number;
        cohesive_device_feedback?: string;
        filler_words?: string[];
    };
}

export type SubmissionStatus = 'in_progress' | 'pending' | 'graded' | 'rejected';

export interface RecordingData {
    questionId: string;  // ID of the question this recording answers
    audioUrl: string;    // URL to the audio file in Supabase Storage
}

export interface CreateSubmissionWithRecordings {
    assignment_id: string;
    student_id: string;
    attempt?: number;
    recordings: Record<number, { blob: Blob, url: string, createdAt: Date } | null>;
    questions: { id: string }[];
}

//Data for supabase
export interface Submission {
    id: string;
    assignment_id: string;
    assignment_title?: string;
    student_id: string;
    student_name?: string;
    attempt: number;
    status: SubmissionStatus;
    section_feedback: {
        question_id: number;
        audio_url: string;
        transcript: string;
        section_feedback: SectionFeedback;
    }[];
    submitted_at: string;
    grade?: number; //overall grade
    recordings?: RecordingData[]; // New field for multiple recordings
    overall_assignment_score?: {
        avg_fluency_score: number;
        avg_grammar_score: number;
        avg_lexical_score: number;
        avg_pronunciation_score: number;
    };
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
}

// Redux state
export interface SubmissionsState {
    submissions: Submission[];
    loading: boolean;
    error: string | null;
    selectedSubmission?: Submission;
    recordings?: {
        [assignmentId: string]: {
            [questionIndex: string]: {
                url: string;
                createdAt: string;
                uploadedUrl?: string;
            }
        }
    };
}