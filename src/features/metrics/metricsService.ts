// src/services/metricsService.ts
import { supabase } from '@/integrations/supabase/client';
import {
  LastLogin,
  AssignmentMetric,
  TeacherLoginWeekly,
  TeacherAssignmentWeekly,
  StudentEngagement,
  InactiveUser,
  SubmissionTrend,
} from './metricsTypes';

interface StudentClass {
  student_id: string;
  class_id: string;
  classes: {
    teacher_id: string;
  };
}

/**
 * Fetches one row per user with their latest login timestamp.
 */
export async function getLastLogins(page: number = 1, perPage: number = 20): Promise<LastLogin[]> {
  console.log('Fetching last logins with page:', page, 'perPage:', perPage);
  
  // First get the last logins
  const { data: lastLoginsData, error: lastLoginsError } = await supabase
    .from('last_logins')
    .select('*')
    .range((page - 1) * perPage, page * perPage - 1)
    .order('last_logged_in_at', { ascending: false });

  if (lastLoginsError) {
    console.error('Error fetching last logins:', lastLoginsError);
    throw lastLoginsError;
  }

  console.log('Raw last logins data:', lastLoginsData);

  // Then get the view status for these users
  const userIds = lastLoginsData.map(user => user.user_id);
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, view')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching users:', usersError);
    throw usersError;
  }

  console.log('Users data:', usersData);

  // Create a map of user IDs to their view status
  const viewStatusMap = new Map(
    usersData.map(user => [user.id, user.view])
  );

  // Create a map to track unique emails
  const emailMap = new Map<string, LastLogin>();

  // Combine the data and filter duplicates
  lastLoginsData.forEach(user => {
    const existingUser = emailMap.get(user.email);
    if (!existingUser) {
      emailMap.set(user.email, {
        ...user,
        view: viewStatusMap.get(user.user_id) ?? true // Default to true if not found
      });
    } else {
      // If we find a duplicate, keep the teacher role if one exists
      if (user.role === 'teacher' && existingUser.role !== 'teacher') {
        emailMap.set(user.email, {
          ...user,
          view: viewStatusMap.get(user.user_id) ?? true
        });
      }
    }
  });

  const uniqueUsers = Array.from(emailMap.values());
  console.log('Unique users:', uniqueUsers);
  console.log('Teacher count:', uniqueUsers.filter(u => u.role === 'teacher').length);
  console.log('Student count:', uniqueUsers.filter(u => u.role === 'student').length);
  return uniqueUsers;
}

/**
 * Fetches all users' latest login timestamps for dashboard stats (no pagination).
 */
export async function getAllLastLogins(): Promise<LastLogin[]> {
  // First get all users with their last login
  const { data: lastLoginsData, error: lastLoginsError } = await supabase
    .from('last_logins')
    .select('*')
    .order('last_logged_in_at', { ascending: false });

  if (lastLoginsError) throw lastLoginsError;
  console.log('Raw last logins data:', lastLoginsData);

  // Get the view status for these users
  const userIds = lastLoginsData.map(user => user.user_id);
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, view')
    .in('id', userIds);
  if (usersError) throw usersError;
  console.log('Users data:', usersData);
  const viewStatusMap = new Map(usersData.map(user => [user.id, user.view]));

  // Get teacher-student relationships
  const { data: studentClasses, error: studentClassesError } = await supabase
    .from('students_classes')
    .select(`
      student_id,
      class_id,
      classes (
        teacher_id
      )
    `) as { data: StudentClass[] | null, error: any };
  if (studentClassesError) throw studentClassesError;
  console.log('Student classes data:', studentClasses);

  // Create a map of student IDs to their teacher IDs
  const studentTeacherMap = new Map<string, string>();
  if (studentClasses) {
    studentClasses.forEach(sc => {
      if (sc.classes?.teacher_id) {
        studentTeacherMap.set(sc.student_id, sc.classes.teacher_id);
      }
    });
  }
  console.log('Student teacher map:', Object.fromEntries(studentTeacherMap));

  // First, collect all teachers
  const teachers = lastLoginsData.filter(user => user.role === 'teacher');
  console.log('All teachers before filtering:', teachers);

  // Then handle students and deduplication
  const emailMap = new Map<string, LastLogin>();
  
  // First add all teachers
  teachers.forEach(teacher => {
    const isHidden = viewStatusMap.get(teacher.user_id) === false;
    if (!isHidden) {
      emailMap.set(teacher.email, {
        ...teacher,
        view: viewStatusMap.get(teacher.user_id) ?? true,
        teacher_id: undefined
      });
    }
  });

  // Then add students
  lastLoginsData.forEach(user => {
    if (user.role === 'student') {
      const isHidden = viewStatusMap.get(user.user_id) === false;
      if (!isHidden) {
        emailMap.set(user.email, {
          ...user,
          view: viewStatusMap.get(user.user_id) ?? true,
          teacher_id: studentTeacherMap.get(user.user_id)
        });
      }
    }
  });

  const result = Array.from(emailMap.values());
  console.log('Final result:', {
    total: result.length,
    teachers: result.filter(u => u.role === 'teacher').length,
    students: result.filter(u => u.role === 'student').length,
    teacherEmails: result.filter(u => u.role === 'teacher').map(t => t.email)
  });
  return result;
}

/**
 * Fetches total assignments created per teacher.
 */
export async function getAssignmentMetrics(): Promise<AssignmentMetric[]> {
  const { data, error } = await supabase
    .from('assignment_metrics')
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Fetches teacher login counts per week.
 */
export async function getTeacherLoginsWeekly(): Promise<TeacherLoginWeekly[]> {
  const { data, error } = await supabase
    .from('teacher_logins_weekly')
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Fetches teacher assignment counts per week.
 */
export async function getTeacherAssignmentsWeekly(): Promise<TeacherAssignmentWeekly[]> {
  const { data, error } = await supabase
    .from('teacher_assignments_weekly')
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Fetches student engagement stats per class.
 */
export async function getStudentEngagement(): Promise<StudentEngagement[]> {
  const { data, error } = await supabase
    .from('student_engagement')
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Fetches users who have not logged in in the last 14 days.
 */
export async function getInactiveUsers(): Promise<InactiveUser[]> {
  const { data, error } = await supabase
    .from('inactive_users')
    .select('*');
  if (error) throw error;
  return data;
}

/**
 * Sets `view = FALSE` on a given user ID.
 */
export async function hideUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ view: false })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Sets `view = FALSE` on a given assignment ID.
 */
export async function hideAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({ view: false })
    .eq('id', assignmentId);

  if (error) throw error;
}

/**
 * Fetches user creation data for growth analytics.
 */
export async function getUserCreationData(): Promise<{
  user_id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | string;
  created_at: string;
  onboarding_completed_at?: string;
  view?: boolean;
}[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      role,
      created_at,
      onboarding_completed_at,
      view
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map(user => ({
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    onboarding_completed_at: user.onboarding_completed_at,
    view: user.view
  }));
}

/**
 * Fetches submission trends data for analytics.
 */
export async function getSubmissionTrends(): Promise<SubmissionTrend[]> {
  // First, let's check all submissions to debug
  const { data: allSubmissions, error: allError } = await supabase
    .from('submissions')
    .select('status, submitted_at')
    .limit(100);
    
  if (!allError && allSubmissions) {
    console.log('Debug - All submission statuses:', {
      total: allSubmissions.length,
      statuses: allSubmissions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withSubmittedAt: allSubmissions.filter(s => s.submitted_at).length,
      nullSubmittedAt: allSubmissions.filter(s => !s.submitted_at).length,
      sampleSubmissions: allSubmissions.slice(0, 5).map(s => ({
        status: s.status,
        submitted_at: s.submitted_at
      }))
    });
  }

  // Let's get ALL submissions - need to handle Supabase's 1000 row limit
  let allData: any[] = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  while (hasMore) {
    const { data: batch, error: batchError } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_id,
        status,
        submitted_at,
        assignments (
          title
        ),
        users (
          name
        )
      `)
      .range(offset, offset + limit - 1);

    if (batchError) {
      console.error('Error fetching submissions batch:', batchError);
      throw batchError;
    }

    if (batch) {
      allData = [...allData, ...batch];
      hasMore = batch.length === limit;
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allData.length} total submissions in ${Math.ceil(offset / limit)} batches`);

  console.log('All submissions data:', {
    totalFound: allData.length,
    statusBreakdown: allData.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    submittedAtBreakdown: {
      withSubmittedAt: allData.filter(s => s.submitted_at !== null).length,
      nullSubmittedAt: allData.filter(s => s.submitted_at === null).length
    },
    targetStatusesCount: allData.filter(s => 
      ['graded', 'awaiting_review', 'pending', 'rejected'].includes(s.status)
    ).length,
    sampleSubmissions: allData.slice(0, 10).map(s => ({
      id: s.id,
      status: s.status,
      submitted_at: s.submitted_at,
      assignment_title: (s.assignments as any)?.title,
      student_name: (s.users as any)?.name
    }))
  });

  // Now filter for the statuses we want
  const statusFiltered = allData.filter(submission => 
    ['graded', 'awaiting_review', 'pending'].includes(submission.status)
  );

  const filteredData = statusFiltered.filter(submission => 
    submission.submitted_at !== null
  );

  console.log('Detailed filtering breakdown:', {
    totalSubmissions: allData.length,
    afterStatusFilter: statusFiltered.length,
    afterNullFilter: filteredData.length,
    filteredOutByStatus: allData.length - statusFiltered.length,
    filteredOutByNullSubmittedAt: statusFiltered.length - filteredData.length,
    statusesFilteredOut: allData
      .filter(s => !['graded', 'awaiting_review', 'pending'].includes(s.status))
      .reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    finalBreakdown: {
      graded: filteredData.filter(s => s.status === 'graded').length,
      awaitingReview: filteredData.filter(s => s.status === 'awaiting_review').length,
      pending: filteredData.filter(s => s.status === 'pending').length
    }
  });
  
  const result = filteredData.map(submission => ({
    submission_id: submission.id,
    assignment_id: submission.assignment_id,
    student_id: submission.student_id,
    student_name: (submission.users as any)?.name || 'Unknown Student',
    status: submission.status as 'graded' | 'awaiting_review' | 'pending',
    submitted_at: submission.submitted_at,
    assignment_title: (submission.assignments as any)?.title
  }));

  console.log('getSubmissionTrends returning:', {
    totalRecords: result.length,
    byStatus: {
      graded: result.filter(r => r.status === 'graded').length,
      awaiting_review: result.filter(r => r.status === 'awaiting_review').length,
      pending: result.filter(r => r.status === 'pending').length
    },
    sampleRecords: result.slice(0, 5)
  });

  return result;
}
