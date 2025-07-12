import { SaveOnboardingRequest, SaveOnboardingResponse } from './roadmapTypes';
import { supabase } from '@/integrations/supabase/client';

// Function to assess user level (matches SQL function)
export const assessUserLevel = (targetScore: string, currentScore: string, studyTime: string, timeline: string): string => {
  if (currentScore === '7.5+' || currentScore === '6.5-7.0' || 
      (targetScore === '8.0' || targetScore === '8.5+') && (studyTime === '15' || studyTime === '30')) {
    return 'ADVANCED';
  }
  
  if (currentScore === '4.0-5.0' || currentScore === 'not-sure' || 
      (studyTime === '5' && timeline === '1-month')) {
    return 'BEGINNER';
  }
  
  return 'INTERMEDIATE';
};

export const roadmapService = {
  async saveOnboarding(request: SaveOnboardingRequest): Promise<SaveOnboardingResponse> {
    try {
      const assessedLevel = assessUserLevel(
        request.answers['target-score'],
        request.answers['current-score'],
        request.answers['study-time'],
        request.answers['test-timeline']
      );

      // Save to Supabase with proper upsert
      const { data, error } = await supabase
        .from('practice_onboarding')
        .upsert({
          user_id: request.userId,
          target_score: request.answers['target-score'],
          study_time: request.answers['study-time'],
          test_timeline: request.answers['test-timeline'],
          current_score: request.answers['current-score'],
          assessed_level: assessedLevel,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          user_id: data.user_id,
          target_score: data.target_score,
          study_time: data.study_time,
          test_timeline: data.test_timeline,
          current_score: data.current_score,
          assessed_level: data.assessed_level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async getOnboardingMetrics(userId: string): Promise<SaveOnboardingResponse> {
    try {
      const { data, error } = await supabase
        .from('practice_onboarding')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found - return undefined
          return {
            success: true,
            data: undefined
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          user_id: data.user_id,
          target_score: data.target_score,
          study_time: data.study_time,
          test_timeline: data.test_timeline,
          current_score: data.current_score,
          assessed_level: data.assessed_level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};