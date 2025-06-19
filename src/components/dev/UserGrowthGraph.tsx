import React, { useMemo, useState } from 'react';
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

const UserGrowthGraph: React.FC = () => {
  const userCreationData = useSelector((state: RootState) => state.metrics.userCreationData);
  const [timeline, setTimeline] = useState<TimelineOption>('weekly');

  // Transform data for the graph based on selected timeline
  const transformedData = useMemo(() => {
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

    // Separate users by role
    const teachers = userCreationData.filter(user => user.role === 'teacher' && user.view !== false);
    const students = userCreationData.filter(user => user.role === 'student' && user.view !== false);
    
    // Create growth data by using actual user creation data
    const transformed = periods.map((period, periodIndex) => {
      const periodData: any = { 
        period: '',
        Teachers: 0,
        Students: 0
      };

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

      // Count teachers who were created up to this period
      let teacherCount = 0;
      teachers.forEach(teacher => {
        const userCreatedDate = new Date(teacher.created_at);
        if (userCreatedDate < periodEnd) {
          teacherCount++;
        }
      });
      periodData.Teachers = teacherCount;

      // Count students who were created up to this period
      let studentCount = 0;
      students.forEach(student => {
        const userCreatedDate = new Date(student.created_at);
        if (userCreatedDate < periodEnd) {
          studentCount++;
        }
      });
      periodData.Students = studentCount;

      return periodData;
    });

    return transformed;
  }, [userCreationData, timeline]);

  // Calculate current totals
  const totalTeachers = userCreationData.filter(user => user.role === 'teacher' && user.view !== false).length;
  const totalStudents = userCreationData.filter(user => user.role === 'student' && user.view !== false).length;

  // Calculate recent growth based on timeline
  const getRecentGrowth = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeline) {
      case 'daily':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7); // Last 7 days
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 14); // Last 2 weeks
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1); // Last month
        break;
    }

    const recentTeachers = userCreationData.filter(user => 
      user.role === 'teacher' && 
      user.view !== false && 
      new Date(user.created_at) >= startDate
    ).length;
    
    const recentStudents = userCreationData.filter(user => 
      user.role === 'student' && 
      user.view !== false && 
      new Date(user.created_at) >= startDate
    ).length;

    return { recentTeachers, recentStudents };
  };

  const { recentTeachers, recentStudents } = getRecentGrowth();

  const getTimelineLabel = () => {
    switch (timeline) {
      case 'daily': return '7d';
      case 'weekly': return '2w';
      case 'monthly': return '1m';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Growth Trends</h3>
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
          
          {/* Legend */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Teachers ({totalTeachers})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Students ({totalStudents})</span>
            </div>
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
              label={{ value: 'Number of Users', angle: -90, position: 'insideLeft' }}
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
            <Line
              type="monotone"
              dataKey="Teachers"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              name="Teachers"
            />
            <Line
              type="monotone"
              dataKey="Students"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              name="Students"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800">Total Teachers</h4>
          <p className="text-2xl font-bold text-blue-900">{totalTeachers}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800">Total Students</h4>
          <p className="text-2xl font-bold text-green-900">{totalStudents}</p>
        </div>
        <div className="bg-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800">New Teachers ({getTimelineLabel()})</h4>
          <p className="text-2xl font-bold text-blue-900">{recentTeachers}</p>
        </div>
        <div className="bg-green-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800">New Students ({getTimelineLabel()})</h4>
          <p className="text-2xl font-bold text-green-900">{recentStudents}</p>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthGraph; 