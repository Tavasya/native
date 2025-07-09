import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Flame } from 'lucide-react';
import { streakService, type ActivityLog, type StreakCalendarDay } from '@/features/streaks/streakService';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

interface StreakCalendarProps {
  className?: string;
}

export const StreakCalendar = ({ className = '' }: StreakCalendarProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [calendarDays, setCalendarDays] = useState<StreakCalendarDay[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Load data when user, year, or month changes
  useEffect(() => {
    if (!user?.id) return;
    
    loadMonthData();
  }, [user?.id, year, month]);

  const loadMonthData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load activity log for the month
      const logs = await streakService.getUserActivityLog(user.id, year, month);
      setActivityLog(logs);

      // Generate calendar data
      const calendar = streakService.getStreakCalendarData(logs, year, month);
      setCalendarDays(calendar);

      // Get current streak
      const streak = await streakService.getDailyPracticeStreak(user.id);
      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error loading streak calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayClasses = (day: StreakCalendarDay) => {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200';
    
    if (day.isInFuture) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    if (day.hasActivity) {
      return `${baseClasses} bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md transform hover:scale-110`;
    }
    
    if (day.isToday) {
      return `${baseClasses} bg-blue-100 text-blue-600 border-2 border-blue-300`;
    }
    
    return `${baseClasses} bg-gray-200 text-gray-600 hover:bg-gray-300`;
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get the first day of the month and pad with empty cells
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const paddedDays = Array(firstDayOfMonth).fill(null).concat(calendarDays);

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Streak</h3>
            <p className="text-sm text-gray-600">
              {currentStreak > 0 ? `${currentStreak} day${currentStreak === 1 ? '' : 's'} in a row!` : 'Start your streak today'}
            </p>
          </div>
        </div>
        
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-700">{currentStreak}</span>
          </div>
        )}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{monthName}</span>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {loading ? (
          // Loading skeleton
          Array(42).fill(null).map((_, index) => (
            <div key={index} className="w-8 h-8 rounded-full bg-gray-100 animate-pulse mx-auto" />
          ))
        ) : (
          paddedDays.map((day, index) => (
            <div key={index} className="flex justify-center">
              {day ? (
                <div
                  className={getDayClasses(day)}
                  title={
                    day.hasActivity 
                      ? `Completed practice on ${day.date.toLocaleDateString()}`
                      : day.isToday
                      ? 'Today - complete a practice to continue your streak!'
                      : day.isInFuture
                      ? 'Future date'
                      : `No practice on ${day.date.toLocaleDateString()}`
                  }
                >
                  {day.date.getDate()}
                </div>
              ) : (
                <div className="w-8 h-8" /> // Empty cell for padding
              )}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-500"></div>
          <span className="text-xs text-gray-600">Practice completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200"></div>
          <span className="text-xs text-gray-600">No practice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-300"></div>
          <span className="text-xs text-gray-600">Today</span>
        </div>
      </div>
    </div>
  );
};