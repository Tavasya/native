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
  console.log('Raw allLastLogins data:', allLastLogins);

  const tabs = [
    // { id: 'overview', name: 'Overview', icon: ChartIcon },
    { id: 'users', name: 'Users', icon: UserIcon },
    { id: 'assignments', name: 'Assignments', icon: BookIcon },
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
                headers={['Name', 'Email', 'Role', 'Teacher', 'Status', 'Last Login', 'Actions']}
                data={filteredUsers}
                renderRow={(user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{user.email}</div>
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

      </div>
    </div>
  );
}