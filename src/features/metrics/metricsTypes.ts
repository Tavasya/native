// src/types/metricsTypes.ts

export interface LastLogin {
    user_id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student' | string;
    email_verified: boolean;
    last_logged_in_at: string | null;
    view?: boolean;  // Optional boolean to track if user is hidden
    teacher_id?: string;  // Add this field for student-teacher relationship
  }
  
  export interface AssignmentMetric {
    teacher_id: string;
    name: string;
    total_assignments: number;
    last_assignment_created_at: string | null;
  }
  
  export interface TeacherLoginWeekly {
    teacher_id: string;
    name: string;
    week: string;         // e.g. "2025-06-02T00:00:00.000Z"
    logins: number;
  }
  
  export interface TeacherAssignmentWeekly {
    teacher_id: string;
    name: string;
    week: string;         // e.g. "2025-06-02T00:00:00.000Z"
    assignments: number;
  }
  
  export interface StudentEngagement {
    class_id: string;
    student_id: string;
    student_name: string;
    class_name: string;
    login_count: number;
    submission_count: number;
  }
  
  export interface InactiveUser {
    user_id: string;
    name: string;
    role: 'teacher' | 'student' | string;
    last_login: string | null;
  }

  export interface SubmissionTrend {
    submission_id: string;
    assignment_id: string;
    student_id: string;
    student_name: string;
    status: 'graded' | 'awaiting_review' | 'pending';
    submitted_at: string;
    assignment_title?: string;
  }

  export interface UsageMetrics {
    totalMinutes: number;
    analysisCosts: number;
    totalSubmissions: number;
    totalRecordings: number;
    activeStudents: number;
    avgRecordingLength: number;
    costPerMinute: number;
    costPerSubmission: number;
    remainingHours: number;
  }
  