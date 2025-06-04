import React, { useState } from 'react';
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

  const teacherAssignmentsWeekly = useSelector((state: RootState) => state.metrics.teacherAssignmentsWeekly);

  // Transform data for the graph
  const transformedData = React.useMemo(() => {
    console.log('Raw teacherAssignmentsWeekly data:', teacherAssignmentsWeekly);
    
    // Get the last 4 weeks of data
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      // Set to start of week (Sunday)
      date.setDate(date.getDate() - date.getDay());
      return date.toISOString().split('T')[0];
    }).reverse();

    console.log('Calculated weeks:', weeks);

    const transformed = weeks.map(week => {
      const weekData: any = { week: new Date(week).toLocaleDateString() };
      const weekStart = new Date(week);
      const weekEnd = new Date(week);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      data.forEach(teacher => {
        if (selectedTeachers.has(teacher.teacher_id)) {
          // Find all assignments for this teacher in this week
          const weekAssignments = teacherAssignmentsWeekly.filter(w => {
            const assignmentDate = new Date(w.week);
            return w.teacher_id === teacher.teacher_id && 
                   assignmentDate >= weekStart && 
                   assignmentDate <= weekEnd;
          });
          
          console.log(`Week ${week} assignments for ${teacher.name}:`, {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            assignments: weekAssignments
          });
          
          // Sum up all assignments for this week
          const totalAssignments = weekAssignments.reduce((sum, w) => sum + w.assignments, 0);
          weekData[teacher.name] = totalAssignments;
        }
      });
      return weekData;
    });

    console.log('Transformed data:', transformed);
    return transformed;
  }, [data, selectedTeachers, teacherAssignmentsWeekly]);

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

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
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