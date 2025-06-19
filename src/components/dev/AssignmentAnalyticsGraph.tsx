import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';

type TimelineOption = 'daily' | 'weekly' | 'monthly';

interface AssignmentAnalyticsGraphProps {
  data: {
    teacher_id: string;
    name: string;
    assignments: {
      week: number;
      count: number;
    }[];
  }[];
}

const COLORS = [
  '#2563eb', // blue-600
  '#7c3aed', // purple-600
  '#059669', // green-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#ea580c', // orange-600
];

const AssignmentAnalyticsGraph: React.FC<AssignmentAnalyticsGraphProps> = ({ data }) => {
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(
    new Set(data.map(teacher => teacher.teacher_id))
  );
  const [timeline, setTimeline] = useState<TimelineOption>('weekly');

  const teacherAssignmentsWeekly = useSelector((state: RootState) => state.metrics.teacherAssignmentsWeekly);

  // Transform data for the graph based on selected timeline
  const transformedData = useMemo(() => {
    console.log('Raw teacherAssignmentsWeekly data:', teacherAssignmentsWeekly);
    
    const now = new Date();
    let periods: string[] = [];
    let periodCount: number;

    // Generate periods based on timeline selection
    switch (timeline) {
      case 'daily':
        periodCount = 30; // Last 30 days
        periods = Array.from({ length: periodCount }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (periodCount - 1 - i));
          return date.toISOString().split('T')[0];
        });
        break;
      case 'weekly':
        periodCount = 8; // Last 8 weeks
        periods = Array.from({ length: periodCount }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          // Set to start of week (Sunday)
          date.setDate(date.getDate() - date.getDay());
          return date.toISOString().split('T')[0];
        }).reverse();
        break;
      case 'monthly':
        periodCount = 12; // Last 12 months
        periods = Array.from({ length: periodCount }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (periodCount - 1 - i), 1);
          return date.toISOString().split('T')[0];
        });
        break;
    }

    console.log('Calculated periods:', periods);

    const transformed = periods.map((period, periodIndex) => {
      const periodData: any = { period: '' };
      
      let periodEnd: Date;
      
      switch (timeline) {
        case 'daily':
          periodData.period = new Date(period).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          periodEnd = new Date(period);
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'weekly':
          periodData.period = `Week ${periodIndex + 1}`;
          periodEnd = new Date(period);
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'monthly':
          periodData.period = new Date(period).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          });
          periodEnd = new Date(period);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
      }
      
      data.forEach(teacher => {
        if (selectedTeachers.has(teacher.teacher_id)) {
          // Find all assignments for this teacher in this period
          const periodAssignments = teacherAssignmentsWeekly.filter(w => {
            const assignmentDate = new Date(w.week);
            return w.teacher_id === teacher.teacher_id && 
                   assignmentDate >= new Date(period) && 
                   assignmentDate < periodEnd;
          });
          
          console.log(`Period ${period} assignments for ${teacher.name}:`, {
            periodStart: new Date(period).toISOString(),
            periodEnd: periodEnd.toISOString(),
            assignments: periodAssignments
          });
          
          // Sum up all assignments for this period
          const totalAssignments = periodAssignments.reduce((sum, w) => sum + w.assignments, 0);
          periodData[teacher.name] = totalAssignments;
        }
      });
      return periodData;
    });

    console.log('Transformed data:', transformed);
    return transformed;
  }, [data, selectedTeachers, teacherAssignmentsWeekly, timeline]);

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Assignment Creation Trends</h3>
        <div className="flex items-center space-x-4">
          {/* Timeline Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Timeline:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as TimelineOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTimeline(option)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeline === option
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Teacher Toggle Buttons */}
          <div className="flex flex-wrap gap-2">
            {data.map((teacher) => (
              <button
                key={teacher.teacher_id}
                onClick={() => handleTeacherToggle(teacher.teacher_id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTeachers.has(teacher.teacher_id)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {teacher.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              angle={timeline === 'monthly' ? -45 : 0}
              textAnchor={timeline === 'monthly' ? 'end' : 'middle'}
              height={timeline === 'monthly' ? 80 : 60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Number of Assignments', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={(label) => {
                switch (timeline) {
                  case 'daily': return `Date: ${label}`;
                  case 'weekly': return `Period: ${label}`;
                  case 'monthly': return `Month: ${label}`;
                }
              }}
            />
            <Legend />
            {data.map((teacher, index) => (
              selectedTeachers.has(teacher.teacher_id) && (
                <Line
                  key={teacher.teacher_id}
                  type="monotone"
                  dataKey={teacher.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssignmentAnalyticsGraph; 