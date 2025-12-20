import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLastLogins,
  fetchAllLastLogins,
  fetchAssignmentMetrics,
  fetchTeacherLoginsWeekly,
  fetchTeacherAssignmentsWeekly,
  fetchStudentEngagement,
  fetchInactiveUsers,
  fetchUserCreationData,
  fetchSubmissionTrends,
  hideUserById,
  loadMoreUsers,
  setSelectedTeacher,
  clearSelectedTeacher,
} from '@/features/metrics/metricsSlice';
import { fetchClasses, fetchClassStatsByTeacher } from '@/features/class/classThunks';
import type { RootState, AppDispatch } from '@/app/store';
import type {
  LastLogin,
  AssignmentMetric
} from '@/features/metrics/metricsTypes';
import AssignmentAnalyticsGraph from '@/components/dev/AssignmentAnalyticsGraph';
import AssignmentListModal from '@/components/dev/AssignmentListModal';
import UserGrowthGraph from '@/components/dev/UserGrowthGraph';
import SubmissionTrendsGraph from '@/components/dev/SubmissionTrendsGraph';
import PendingReportsTable from '@/components/dev/PendingReportsTable';
import { SupportTicketList } from '@/components/support/SupportTicketList';
import { getTeacherUsageMetrics } from '@/features/metrics/metricsService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, FileText, Users, Coins } from 'lucide-react';

// Icon component types
interface IconProps {
  className?: string;
}

// Import icons (using simple SVG for demo)
const UserIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const BookIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.259 0 2.443.29 3.5.804V4.804zM11 4.804A7.968 7.968 0 0014.5 4c1.255 0 2.443.29 3.5.804v10A7.969 7.969 0 0014.5 14c-1.259 0-2.443.29-3.5.804V4.804z" />
  </svg>
);


const AlertIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const DevIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const CoinsIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
  </svg>
);

interface ErrorMessageProps {
  message: string;
}

interface DataTableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

interface RoleBadgeProps {
  role: 'teacher' | 'student' | 'admin';
}

interface StatusBadgeProps {
  verified: boolean;
}


// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Error Component
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
    <AlertIcon className="text-red-500 mr-2" />
    <span className="text-red-700">{message}</span>
  </div>
);

// Enhanced Table Component
const DataTable = <T,>({ headers, data, renderRow, emptyMessage = "No data available" }: DataTableProps<T>) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <React.Fragment key={`${index}-${JSON.stringify(item)}`}>
                {renderRow(item, index)}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Role Badge Component
const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const colors = {
    teacher: 'bg-purple-100 text-purple-800',
    student: 'bg-blue-100 text-blue-800',
    admin: 'bg-red-100 text-red-800'
  } as const;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

// Status Badge Component
const StatusBadge: React.FC<StatusBadgeProps> = ({ verified }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }`}>
    {verified ? '✓ Verified' : '⚠ Unverified'}
  </span>
);

// Main Dashboard Component
export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('devDashActiveTab') || 'overview';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUsageTeacherId, setSelectedUsageTeacherId] = useState('');
  const [usageMetrics, setUsageMetrics] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageTeacher, setUsageTeacher] = useState<any>(null);
  const [usageSubscription, setUsageSubscription] = useState<any>(null);
  const [latestSubmissions, setLatestSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [hasMoreSubmissions, setHasMoreSubmissions] = useState(true);
  const [submissionsFilter, setSubmissionsFilter] = useState<string>('graded');
  const [deletingSubmission, setDeletingSubmission] = useState<string | null>(null);
  const [selectedSubmissionTeacherId, setSelectedSubmissionTeacherId] = useState<string>('all');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [submissionsPerPage, setSubmissionsPerPage] = useState(20);
  const { selectedTeacher } = useSelector((state: RootState) => state.metrics);
  const { classes, classStats } = useSelector((state: RootState) => state.classes);

  const {
    allLastLogins,
    assignmentMetrics,
    loadingLastLogins,
    loadingAssignmentMetrics,
    errorLastLogins,
    errorAssignmentMetrics,
    hidingUser,
    errorHidingUser,
    hasMoreUsers,
    usersPage,
    usersPerPage,
  } = useSelector((state: RootState) => state.metrics);

  // Calculate visible and filtered users
  const visibleLastLogins = allLastLogins.filter(u => u.view !== false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');
  
  const filteredUsers = visibleLastLogins.filter(user => {
    // First apply search filter
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then apply teacher filter
    const matchesTeacher = selectedTeacherId === 'all' || 
      (user.role === 'student' && user.teacher_id === selectedTeacherId) ||
      (user.role === 'teacher' && user.user_id === selectedTeacherId);
    
    return matchesSearch && matchesTeacher;
  });

  // Update activeTab in sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('devDashActiveTab', activeTab);
  }, [activeTab]);

  // Fetch latest submissions when dev tab is active
  useEffect(() => {
    if (activeTab === 'dev') {
      fetchLatestSubmissions();
    }
  }, [activeTab, submissionsPage, submissionsFilter, selectedSubmissionTeacherId, submissionsPerPage]);

  const fetchLatestSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      setSelectedSubmissions(new Set()); // Clear selections when fetching new data

      let query = supabase
        .from('submissions')
        .select(`
          id,
          status,
          submitted_at,
          assignment:assignments(title, created_by),
          student:users!submissions_student_id_fkey(name, email)
        `);

      // Apply status filter
      if (submissionsFilter !== 'all') {
        query = query.eq('status', submissionsFilter);
      }

      const { data, error } = await query
        .order('submitted_at', { ascending: false })
        .range((submissionsPage - 1) * submissionsPerPage, submissionsPage * submissionsPerPage - 1);

      if (error) throw error;

      if (data) {
        // Filter by teacher if selected
        let filteredData = data;
        if (selectedSubmissionTeacherId !== 'all') {
          filteredData = data.filter((submission: any) =>
            submission.assignment?.created_by === selectedSubmissionTeacherId
          );
        }

        setLatestSubmissions(filteredData);
        setHasMoreSubmissions(data.length === submissionsPerPage);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingSubmission(submissionId);
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      // Refresh the list after deletion
      fetchLatestSubmissions();
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      alert(`Failed to delete submission: ${error.message}`);
    } finally {
      setDeletingSubmission(null);
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const toggleAllSubmissions = () => {
    if (selectedSubmissions.size === latestSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(latestSubmissions.map(s => s.id)));
    }
  };

  const exportSelectedToCSV = async () => {
    if (selectedSubmissions.size === 0) {
      alert('Please select at least one submission to export');
      return;
    }

    try {
      // Fetch full details for selected submissions including teacher info
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          submitted_at,
          grade,
          assignment:assignments(title, created_by),
          student:users!submissions_student_id_fkey(name, email)
        `)
        .in('id', Array.from(selectedSubmissions));

      if (error) throw error;

      // Fetch teacher names for the submissions
      const teacherIds = [...new Set(data.map((s: any) => s.assignment?.created_by).filter(Boolean))];
      const { data: teachers } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', teacherIds);

      const teacherMap = new Map(teachers?.map(t => [t.id, t]) || []);

      // Create CSV content
      const headers = ['Submission ID', 'Student Name', 'Student Email', 'Teacher Name', 'Teacher Email', 'Assignment', 'Status', 'Grade', 'Submitted At'];
      const rows = data.map((submission: any) => {
        const teacher = teacherMap.get(submission.assignment?.created_by);
        return [
          submission.id,
          submission.student?.name || 'N/A',
          submission.student?.email || 'N/A',
          teacher?.name || 'N/A',
          teacher?.email || 'N/A',
          submission.assignment?.title || 'N/A',
          submission.status,
          submission.grade || 'N/A',
          submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'
        ];
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `submissions_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${selectedSubmissions.size} submission(s) to CSV`);
    } catch (error: any) {
      console.error('Error exporting submissions:', error);
      alert(`Failed to export submissions: ${error.message}`);
    }
  };

  // Fetch usage metrics when teacher is selected
  useEffect(() => {
    if (!selectedUsageTeacherId) {
      setUsageMetrics(null);
      setUsageTeacher(null);
      setUsageSubscription(null);
      return;
    }

    const fetchUsageData = async () => {
      try {
        setUsageLoading(true);

        // Fetch teacher info
        const { data: teacherData } = await supabase
          .from('users')
          .select('id, name, email, credits')
          .eq('id', selectedUsageTeacherId)
          .single();

        setUsageTeacher(teacherData);

        // Fetch subscription info
        const { data: subscriptionData } = await supabase
          .from('teacher_subscriptions')
          .select('current_period_start, current_period_end')
          .eq('teacher_id', selectedUsageTeacherId)
          .single();

        setUsageSubscription(subscriptionData);

        // Fetch usage metrics
        const metricsData = await getTeacherUsageMetrics(selectedUsageTeacherId);
        setUsageMetrics(metricsData);
      } catch (err) {
        console.error('Error fetching usage data:', err);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsageData();
  }, [selectedUsageTeacherId]);

  // Load data when component mounts
  useEffect(() => {
    console.log('DevDash - Loading data, activeTab:', activeTab);
    dispatch(fetchLastLogins({ page: 1, perPage: 20 }));
    dispatch(fetchAllLastLogins());
    dispatch(fetchAssignmentMetrics());
    dispatch(fetchTeacherLoginsWeekly());
    dispatch(fetchTeacherAssignmentsWeekly());
    dispatch(fetchStudentEngagement());
    dispatch(fetchInactiveUsers());
    dispatch(fetchUserCreationData());
    dispatch(fetchSubmissionTrends());
  }, [dispatch, activeTab]);

  // Load class data separately
  useEffect(() => {
    if (allLastLogins.length > 0) {
      const teachers = allLastLogins.filter(user => user.role === 'teacher');
      teachers.forEach(teacher => {
        dispatch(fetchClasses({ role: 'teacher', userId: teacher.user_id }));
        dispatch(fetchClassStatsByTeacher(teacher.user_id));
      });
    }
  }, [dispatch, allLastLogins.length]);

  const handleHideUser = async (userId: string) => {
    dispatch(hideUserById(userId));
  };

  const handleLoadMoreUsers = () => {
    dispatch(loadMoreUsers());
    dispatch(fetchLastLogins({ page: usersPage + 1, perPage: usersPerPage }));
  };

  // Calculate stats from allLastLogins

  const tabs = [
    // { id: 'overview', name: 'Overview', icon: ChartIcon },
    { id: 'users', name: 'Users', icon: UserIcon },
    { id: 'assignments', name: 'Assignments', icon: BookIcon },
    { id: 'support', name: 'Support', icon: AlertIcon },
    { id: 'dev', name: 'Dev', icon: DevIcon },
    { id: 'usage', name: 'Usage', icon: CoinsIcon },
    // { id: 'engagement', name: 'Engagement', icon: ChartIcon },
  ] as const;

  // Helper function to get teacher name from class data
  const getTeacherName = (studentId: string) => {
    // First try to find the student's class
    const studentClass = classes.find(c => 
      classStats.some(s => s.id === c.id && s.student_count > 0)
    );

    if (studentClass) {
      // Find the teacher for this class
      const teacher = allLastLogins.find(t => t.user_id === studentClass.teacherId);
      if (teacher) {
        return teacher.name;
      }
    }

    // If we can't find through classes, try the direct teacher_id
    const student = allLastLogins.find(s => s.user_id === studentId);
    if (student?.teacher_id) {
      const teacher = allLastLogins.find(t => t.user_id === student.teacher_id);
      if (teacher) {
        return teacher.name;
      }
    }

    return 'No Teacher';
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-end">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
       
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-600">Total Users</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-600">Total Students</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.filter(user => user.role === 'student').length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-600">Total Teachers</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.filter(user => user.role === 'teacher').length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-600">Total Assignments</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentMetrics.reduce((sum, m) => sum + m.total_assignments, 0)}
                </p>
              </div>
            </div>

            {/* Teacher Filter and Metrics */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                  }}
                >
                  <option value="all">All Teachers</option>
                  {(() => {
                    const teachers = allLastLogins.filter(user => user.role === 'teacher' && user.view !== false);
                    return teachers
                      .sort((a, b) => {
                        const aStudents = allLastLogins.filter(u => u.role === 'student' && u.teacher_id === a.user_id && u.view !== false).length;
                        const bStudents = allLastLogins.filter(u => u.role === 'student' && u.teacher_id === b.user_id && u.view !== false).length;
                        return bStudents - aStudents;
                      })
                      .map(teacher => (
                        <option key={teacher.user_id} value={teacher.user_id}>
                          {teacher.name} ({allLastLogins.filter(u => u.role === 'student' && u.teacher_id === teacher.user_id && u.view !== false).length} students)
                        </option>
                      ));
                  })()}
                </select>
              </div>
            </div>

            {errorHidingUser && (
              <ErrorMessage message={errorHidingUser} />
            )}

            {loadingLastLogins ? (
              <LoadingSpinner />
            ) : errorLastLogins ? (
              <ErrorMessage message={errorLastLogins} />
            ) : (
              <DataTable<LastLogin>
                headers={['User', 'Role', 'Teacher', 'Status', 'Last Login', 'Actions']}
                data={filteredUsers}
                renderRow={(user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role as 'teacher' | 'student' | 'admin'} />
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'student' ? (
                        <div className="text-gray-600">
                          {getTeacherName(user.user_id)}
                        </div>
                      ) : (
                        <div className="text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge verified={user.email_verified} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">
                        {user.last_logged_in_at
                          ? new Date(user.last_logged_in_at).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleHideUser(user.user_id)}
                        disabled={hidingUser}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          hidingUser
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {hidingUser ? 'Hiding...' : 'Hide'}
                      </button>
                    </td>
                  </tr>
                )}
                emptyMessage="No users found"
              />
            )}

            {/* Only show Load More button when viewing all users */}
            {hasMoreUsers && !allLastLogins.some(user => user.teacher_id) && (
              <div className="text-center">
                <button 
                  onClick={handleLoadMoreUsers}
                  disabled={loadingLastLogins}
                  className={`px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors ${
                    loadingLastLogins ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loadingLastLogins ? 'Loading...' : 'Load More Users'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Assignment Analytics</h2>
            </div>

            {loadingAssignmentMetrics ? (
              <LoadingSpinner />
            ) : errorAssignmentMetrics ? (
              <ErrorMessage message={errorAssignmentMetrics} />
            ) : (
              <>
                <DataTable<AssignmentMetric>
                  headers={['Teacher Name', 'Total Assignments', 'Last Created', 'Activity Level', 'Actions']}
                  data={[...assignmentMetrics].sort((a, b) => b.total_assignments - a.total_assignments)}
                  renderRow={(metric) => (
                    <tr key={metric.teacher_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => dispatch(setSelectedTeacher(metric))}
                          className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {metric.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600">{metric.total_assignments}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">
                          {metric.last_assignment_created_at
                            ? new Date(metric.last_assignment_created_at).toLocaleDateString()
                            : 'No assignments'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metric.total_assignments >= 10 
                            ? 'bg-green-100 text-green-800' 
                            : metric.total_assignments >= 5 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : metric.total_assignments > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {metric.total_assignments >= 10 ? 'Very Active' : 
                           metric.total_assignments >= 5 ? 'Active' : 
                           metric.total_assignments > 0 ? 'Low Activity' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleHideUser(metric.teacher_id)}
                          disabled={hidingUser}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            hidingUser
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {hidingUser ? 'Hiding...' : 'Hide'}
                        </button>
                      </td>
                    </tr>
                  )}
                  emptyMessage="No assignment data available"
                />

                {/* Assignment Analytics Graph */}
                <AssignmentAnalyticsGraph
                  data={assignmentMetrics.map(metric => ({
                    teacher_id: metric.teacher_id,
                    name: metric.name,
                    assignments: [] // This is no longer used as we get data from Redux
                  }))}
                />

                {/* User Growth Graph */}
                <UserGrowthGraph />

                {/* Submission Trends Graph */}
                <SubmissionTrendsGraph />

                {/* Assignment List Modal */}
                {selectedTeacher && (
                  <AssignmentListModal
                    isOpen={!!selectedTeacher}
                    onClose={() => dispatch(clearSelectedTeacher())}
                    teacherId={selectedTeacher.teacher_id}
                    teacherName={selectedTeacher.name}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <SupportTicketList />
        )}

        {activeTab === 'dev' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Dev Tools</h2>
            </div>

            {/* Latest Submissions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Latest Submissions</h3>
                    <p className="text-sm text-gray-500 mt-1">Recent submissions with timestamps</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={exportSelectedToCSV}
                      disabled={selectedSubmissions.size === 0}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        selectedSubmissions.size === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Export Selected ({selectedSubmissions.size})
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="teacherFilter" className="text-sm font-medium text-gray-700">
                      Teacher:
                    </label>
                    <select
                      id="teacherFilter"
                      value={selectedSubmissionTeacherId}
                      onChange={(e) => {
                        setSelectedSubmissionTeacherId(e.target.value);
                        setSubmissionsPage(1);
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Teachers</option>
                      {allLastLogins
                        .filter(user => user.role === 'teacher' && user.view !== false)
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        .map(teacher => (
                          <option key={teacher.user_id} value={teacher.user_id}>
                            {teacher.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
                      Status:
                    </label>
                    <select
                      id="statusFilter"
                      value={submissionsFilter}
                      onChange={(e) => {
                        setSubmissionsFilter(e.target.value);
                        setSubmissionsPage(1); // Reset to page 1 when filter changes
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="graded">Graded</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              {submissionsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <span className="ml-2 text-gray-600">Loading submissions...</span>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedSubmissions.size === latestSubmissions.length && latestSubmissions.length > 0}
                              onChange={toggleAllSubmissions}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted At</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {latestSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                              No submissions found
                            </td>
                          </tr>
                        ) : (
                          latestSubmissions.map((submission: any) => (
                            <tr key={submission.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedSubmissions.has(submission.id)}
                                  onChange={() => toggleSubmissionSelection(submission.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-mono text-sm text-gray-900">{submission.id.slice(0, 8)}...</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{submission.student?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{submission.student?.email || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{submission.assignment?.title || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  submission.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {submission.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => {
                                      const url = `/student/submission/${submission.id}/feedback`;
                                      window.open(url, '_blank');
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Process this submission?')) return;

                                      try {
                                        setIsProcessing(true);
                                        console.log('Processing submission:', submission.id);

                                        // Fetch full submission data to get audio URLs
                                        const { data: fullSubmission, error: fetchError } = await supabase
                                          .from('submissions')
                                          .select('id, recordings, section_feedback')
                                          .eq('id', submission.id)
                                          .single();

                                        if (fetchError || !fullSubmission) {
                                          throw new Error('Failed to fetch submission data');
                                        }

                                        // Extract audio URLs from recordings or section_feedback
                                        let audioUrls: string[] = [];

                                        if (fullSubmission.recordings && fullSubmission.recordings.length > 0) {
                                          // V1 format: recordings array
                                          audioUrls = fullSubmission.recordings.map((r: any) => r.audioUrl).filter(Boolean);
                                        } else if (fullSubmission.section_feedback && fullSubmission.section_feedback.length > 0) {
                                          // V2 format: section_feedback array
                                          const sorted = [...fullSubmission.section_feedback]
                                            .filter((item: any) => item.audio_url)
                                            .sort((a: any, b: any) => (a.question_id || 0) - (b.question_id || 0));
                                          audioUrls = sorted.map((item: any) => item.audio_url);
                                        }

                                        if (audioUrls.length === 0) {
                                          throw new Error('No audio URLs found in submission');
                                        }

                                        console.log('Found audio URLs:', audioUrls.length);

                                        // Call the V2 processing endpoint
                                        const response = await fetch("https://audio-analysis-api-tplvyztxfa-uc.a.run.app/api/v1/submissions/process-by-uid", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "Accept": "application/json"
                                          },
                                          body: JSON.stringify({
                                            submission_uid: submission.id
                                          })
                                        });

                                        console.log('Response status:', response.status);

                                        if (response.ok) {
                                          const data = await response.json();
                                          console.log('Success:', data);
                                          alert(`Submission ${submission.id.slice(0, 8)}... sent for processing successfully!`);
                                          fetchLatestSubmissions();
                                        } else {
                                          const errorText = await response.text();
                                          console.error('Error response:', errorText);
                                          let errorMsg = 'Failed to process submission';
                                          try {
                                            const errorData = JSON.parse(errorText);
                                            errorMsg = errorData.detail || errorData.error || errorData.message || errorMsg;
                                          } catch {
                                            errorMsg = errorText || `Server error (${response.status})`;
                                          }
                                          alert(`Error: ${errorMsg}`);
                                        }
                                      } catch (error: any) {
                                        console.error('Processing error:', error);
                                        alert(`Error: ${error.message || 'Unknown error occurred'}`);
                                      } finally {
                                        setIsProcessing(false);
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className={`text-sm font-medium ${
                                      isProcessing
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-blue-600 hover:text-blue-800'
                                    }`}
                                  >
                                    Process
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubmission(submission.id)}
                                    disabled={deletingSubmission === submission.id}
                                    className={`text-sm font-medium ${
                                      deletingSubmission === submission.id
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-red-600 hover:text-red-800'
                                    }`}
                                  >
                                    {deletingSubmission === submission.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Page {submissionsPage} • Showing {latestSubmissions.length} submissions
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Per page:</label>
                        <select
                          value={submissionsPerPage}
                          onChange={(e) => {
                            setSubmissionsPerPage(Number(e.target.value));
                            setSubmissionsPage(1);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSubmissionsPage(prev => Math.max(1, prev - 1))}
                        disabled={submissionsPage === 1}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          submissionsPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setSubmissionsPage(prev => prev + 1)}
                        disabled={!hasMoreSubmissions}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          !hasMoreSubmissions
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pending Reports Table */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Reports</h3>
              <PendingReportsTable
                onSelectReports={() => {}}
                refreshTrigger={0}
              />
            </div>

          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Teacher Usage & Credits</h2>
            </div>

            {/* Teacher Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label htmlFor="usageTeacher" className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher
              </label>
              <select
                id="usageTeacher"
                value={selectedUsageTeacherId}
                onChange={(e) => setSelectedUsageTeacherId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a teacher --</option>
                {allLastLogins
                  .filter(user => user.role === 'teacher' && user.view !== false)
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  .map(teacher => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Loading State */}
            {usageLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading usage data...</span>
              </div>
            )}

            {/* Usage Metrics Display */}
            {!usageLoading && usageMetrics && usageTeacher && (
              <>
                {/* Teacher Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{usageTeacher.name}</h3>
                  <p className="text-sm text-gray-600">{usageTeacher.email}</p>
                  {usageSubscription && (
                    <p className="text-sm text-gray-500 mt-2">
                      Billing Period: {new Date(usageSubscription.current_period_start).toLocaleDateString()} - {new Date(usageSubscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                  {!usageSubscription && (
                    <p className="text-sm text-gray-500 mt-2">
                      No active subscription (showing last 30 days)
                    </p>
                  )}
                </div>

                {/* Credit Summary */}
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg">Credit Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Allocated</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {((usageTeacher.credits || 0)).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Used</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(usageMetrics.totalMinutes / 60).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Remaining</p>
                        <p className={`text-2xl font-bold ${usageMetrics.remainingHours < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {usageMetrics.remainingHours.toFixed(1)}h
                          {usageMetrics.remainingHours < 0 && <span className="text-sm ml-2">(OVER)</span>}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Usage: {((usageMetrics.totalMinutes / 60) / (usageTeacher.credits || 1) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            usageMetrics.remainingHours < 0 ? 'bg-red-500' :
                            (usageMetrics.totalMinutes / 60) / (usageTeacher.credits || 1) > 0.75 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((usageMetrics.totalMinutes / 60) / (usageTeacher.credits || 1) * 100), 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Audio Minutes</CardTitle>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{usageMetrics.totalMinutes.toFixed(1)} min</div>
                      <p className="text-xs text-gray-500 mt-1">Total recorded audio</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{usageMetrics.totalSubmissions}</div>
                      <p className="text-xs text-gray-500 mt-1">Student submissions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Students</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{usageMetrics.activeStudents}</div>
                      <p className="text-xs text-gray-500 mt-1">Active this month</p>
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">{usageMetrics.totalStudents}</span> total enrolled
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Detailed Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Breakdown</CardTitle>
                    <CardDescription>
                      {usageSubscription
                        ? `Detailed view for current billing period (since ${new Date(usageSubscription.current_period_start).toLocaleDateString()})`
                        : 'Detailed view for last 30 days'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <p className="font-medium text-gray-900">Total Recordings</p>
                          <p className="text-sm text-gray-500">Audio files processed</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{usageMetrics.totalRecordings}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">Avg Recording Length</p>
                          <p className="text-sm text-gray-500">Average duration per recording</p>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {usageMetrics.avgRecordingLength.toFixed(1)} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* No teacher selected state */}
            {!selectedUsageTeacherId && !usageLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Teacher Selected</h3>
                <p className="text-gray-600">Select a teacher from the dropdown above to view their usage metrics</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}