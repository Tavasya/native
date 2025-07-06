export interface OnboardingAnswers {
  'target-score': string;
  'study-time': string;
  'test-timeline': string;
  'current-score': string;
}

export interface OnboardingMetrics {
  id: string;
  user_id: string;
  target_score: string;
  study_time: string;
  test_timeline: string;
  current_score: string;
  assessed_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  created_at: string;
  updated_at: string;
}

export interface RoadmapState {
  onboardingAnswers: OnboardingAnswers | null;
  onboardingMetrics: OnboardingMetrics | null;
  isLoading: boolean;
  error: string | null;
}

export interface SaveOnboardingRequest {
  answers: OnboardingAnswers;
  userId: string;
}

export interface SaveOnboardingResponse {
  success: boolean;
  data?: OnboardingMetrics;
  error?: string;
}