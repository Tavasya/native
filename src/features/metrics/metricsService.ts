// src/services/metricsService.ts
import { supabase } from '@/integrations/supabase/client';
import {
  LastLogin,
  AssignmentMetric,
  TeacherLoginWeekly,
  TeacherAssignmentWeekly,
  StudentEngagement,
  InactiveUser,
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

  // Get the view status for these users
  const userIds = lastLoginsData.map(user => user.user_id);
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, view')
    .in('id', userIds);
  if (usersError) throw usersError;
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

  // Create a map of student IDs to their teacher IDs
  const studentTeacherMap = new Map<string, string>();
  if (studentClasses) {
    studentClasses.forEach(sc => {
      if (sc.classes?.teacher_id) {
        studentTeacherMap.set(sc.student_id, sc.classes.teacher_id);
      }
    });
  }

  // Deduplicate by email, prefer teacher role, and filter out hidden users
  const emailMap = new Map<string, LastLogin>();
  lastLoginsData.forEach(user => {
    const isHidden = viewStatusMap.get(user.user_id) === false;
    if (isHidden) return; // Skip hidden users

    const existingUser = emailMap.get(user.email);
    if (!existingUser) {
      emailMap.set(user.email, {
        ...user,
        view: viewStatusMap.get(user.user_id) ?? true,
        teacher_id: user.role === 'student' ? studentTeacherMap.get(user.user_id) : undefined
      });
    } else {
      if (user.role === 'teacher' && existingUser.role !== 'teacher') {
        emailMap.set(user.email, {
          ...user,
          view: viewStatusMap.get(user.user_id) ?? true,
          teacher_id: undefined
        });
      }
    }
  });

  return Array.from(emailMap.values());
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
