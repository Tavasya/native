import { supabase } from '@/integrations/supabase/client';

export interface StreakCalendarDay {
  date: Date;
  hasActivity: boolean;
  isToday: boolean;
  isInFuture: boolean;
}

export const streakService = {
  // Get current daily practice streak from assignment completions
  async getDailyPracticeStreak(userId: string): Promise<number> {
    try {
      // First get the user's curriculum (take the first one if multiple exist)
      const { data: curricula, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (curriculumError || !curricula || curricula.length === 0) {
        console.error('No curriculum found for user:', curriculumError);
        return 0;
      }

      const curriculum = curricula[0];

      // Get all completed assignments for this curriculum, ordered by completion date
      const { data, error } = await supabase
        .from('curriculum_assignments')
        .select('completed_at')
        .eq('curriculum_id', curriculum.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignment completions:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      // Calculate streak from assignment completion dates
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Group completions by date
      const completionsByDate = new Map<string, number>();
      data.forEach(assignment => {
        const date = new Date(assignment.completed_at);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        completionsByDate.set(dateKey, (completionsByDate.get(dateKey) || 0) + 1);
      });

      // Calculate streak backwards from today
      let checkDate = new Date(today);
      
      while (true) {
        const dateKey = checkDate.toISOString().split('T')[0];
        
        if (completionsByDate.has(dateKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If this is today and no completions, that's okay, keep checking yesterday
          if (checkDate.getTime() === today.getTime()) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          // Otherwise break the streak
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error in getDailyPracticeStreak:', error);
      return 0;
    }
  },

  // Get calendar data for streak visualization from assignment completions
  async getUserActivityLog(userId: string, year: number, month: number): Promise<any[]> {
    try {
      // First get the user's curriculum (take the first one if multiple exist)
      const { data: curricula, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (curriculumError || !curricula || curricula.length === 0) {
        console.error('No curriculum found for user:', curriculumError);
        return [];
      }

      const curriculum = curricula[0];

      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('curriculum_assignments')
        .select('completed_at, assignment_id')
        .eq('curriculum_id', curriculum.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .gte('completed_at', startDate + 'T00:00:00')
        .lte('completed_at', endDate + 'T23:59:59')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignment completions:', error);
        return [];
      }

      // Convert to activity log format for calendar
      return (data || []).map(completion => ({
        id: completion.assignment_id,
        user_id: userId,
        activity_type: 'assignment_completed',
        activity_date: completion.completed_at.split('T')[0],
        activity_data: {},
        points_earned: 10,
        created_at: completion.completed_at
      }));
    } catch (error) {
      console.error('Error fetching user activity log:', error);
      return [];
    }
  },

  // Get calendar data for streak visualization
  getStreakCalendarData(activityLog: any[], year: number, month: number): StreakCalendarDay[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const calendarDays: StreakCalendarDay[] = [];

    // Create a set of dates with activities for fast lookup
    const activityDates = new Set(
      activityLog.map(log => log.activity_date)
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      calendarDays.push({
        date,
        hasActivity: activityDates.has(dateStr),
        isToday: date.toDateString() === today.toDateString(),
        isInFuture: date > today
      });
    }

    return calendarDays;
  },

  // Check if user has activity today
  async hasActivityToday(userId: string): Promise<boolean> {
    try {
      // First get the user's curriculum (take the first one if multiple exist)
      const { data: curricula, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (curriculumError || !curricula || curricula.length === 0) {
        console.error('No curriculum found for user:', curriculumError);
        return false;
      }

      const curriculum = curricula[0];

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('curriculum_assignments')
        .select('id')
        .eq('curriculum_id', curriculum.id)
        .eq('is_completed', true)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59')
        .limit(1);

      if (error) {
        console.error('Error checking today activity:', error);
        return false;
      }
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking today activity:', error);
      return false;
    }
  }
};