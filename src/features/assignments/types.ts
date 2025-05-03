export interface Question {
    text: string;
    showExample: boolean;
    example: string;
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface Assignment {
    id: string;
    class_id: string;
    created_at: string;
    title: string;
    questions: Question[];
    due_date: string;
    topic: string;
    metadata: any;
    status: AssignmentStatus;
}

export interface CreateAssignmentDto {
    title: string;
    due_date: string;
    class_id: string;
    questions: Question[];
    topic?: string;
    metadata?: any;
}

export interface AssignmentState {
    assignments: Assignment[];
    loading: boolean;
    error: string | null;
    createAssignmentLoading: boolean;
    deletingAssignmentId: string | null;
}