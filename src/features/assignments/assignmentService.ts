// src/features/assignments/assignmentService.ts
import {
    Assignment,
    AssignmentStatus,
    StudentSubmission,
    CreateAssignmentDto,
    SubmissionStatus,
  } from './types';
  import { supabase } from '@/integrations/supabase/client';
  
  // Used only by getClassDetailView
  interface AssignmentWithSubmissions extends Assignment {
    submissions: StudentSubmission[];
  }
  
  export const assignmentService = {
    /* ------------------------------------------------------------------ *
     *  CRUD
     * ------------------------------------------------------------------ */
    async createAssignment(
      dto: CreateAssignmentDto,
    ): Promise<Assignment> {
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            class_id:   dto.class_id,
            created_by: dto.created_by,
            title:      dto.title,
            topic:      dto.topic,
            due_date:   dto.due_date,
            questions:  dto.questions,
            metadata:   dto.metadata || {},
            status:     dto.status ?? 'not_started',
          },
        ])
        .select()
        .single();
  
      if (error) throw new Error(error.message);
      return data as Assignment;
    },
  
    async getAssignmentByClass(classId: string): Promise<Assignment[]> {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId);
  
      if (error) throw new Error(error.message);
      return data as Assignment[];
    },
  
    async getAssignmentById(id: string): Promise<Assignment> {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) throw new Error(error.message);
      
      // Parse the questions field if it's a string
      if (data && typeof data.questions === 'string') {
        try {
          data.questions = JSON.parse(data.questions);
        } catch (e) {
          console.error('Failed to parse questions JSON:', e);
          throw new Error('Invalid questions data format');
        }
      }
      
      return data as Assignment;
    },
  
    async updateAssignmentStatus(
      assignmentId: string,
      status: AssignmentStatus,
    ): Promise<void> {
      const { error } = await supabase
        .from('assignments')
        .update({ status })
        .eq('id', assignmentId);
  
      if (error) throw new Error(error.message);
    },
  
    async deleteAssignment(assignmentId: string): Promise<void> {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
  
      if (error) throw new Error(error.message);
    },
  
    /* ------------------------------------------------------------------ *
     *  Helpers
     * ------------------------------------------------------------------ */
    async getSubmissionStatusValues(): Promise<string[]> {
      const { data, error } = await supabase
        .from('submissions')
        .select('status')
        .limit(20);                 // small sample is enough
  
      if (error) return ['completed', 'in_progress', 'not_started'];
  
      return Array.from(
        new Set(
          data
            .map(r => (r.status ?? '').toLowerCase())
            .filter(Boolean),
        ),
      );
    },
  
    /* ------------------------------------------------------------------ *
     *  getLatestSubmissionsByAssignment  ( ✅ batched )
     * ------------------------------------------------------------------ */
    async getLatestSubmissionsByAssignment(
      assignmentId: string,
    ): Promise<StudentSubmission[]> {
      // 1. Get the class ID for this assignment
      const { data: asnRow, error: asnErr } = await supabase
        .from('assignments')
        .select('class_id')
        .eq('id', assignmentId)
        .single();
      if (asnErr) throw new Error(asnErr.message);
  
      // 2. Get all students in the class with their grades
      const { data: students, error: sErr } = await supabase
        .from('students_classes')
        .select(`
          student_id,
          overall_grade,
          users!inner(id, name, email)
        `)
        .eq('class_id', asnRow.class_id);
  
      if (sErr) throw new Error(sErr.message);
  
      // 3. Get all submissions for this assignment
      const { data: submissions, error: subErr } = await supabase
        .from('submissions')
        .select(`
          id, assignment_id, student_id, attempt,
          status, submitted_at, grade
        `)
        .eq('assignment_id', assignmentId);
  
      if (subErr) throw new Error(subErr.message);
  
      // 4. Create a map of latest submissions per student and track completion history
      const latestAttempt = new Map<string, (typeof submissions)[number]>();
      const completionHistory = new Map<string, { 
        hasEverCompleted: boolean; 
        totalAttempts: number; 
        completedAttempts: number;
        latestCompletedSubmissionId?: string;
        latestCompletedAttempt?: number;
      }>();
      
      submissions?.forEach(row => {
        const studentId = row.student_id;
        
        // Track latest attempt
        const prev = latestAttempt.get(studentId);
        if (!prev || prev.attempt < row.attempt) {
          latestAttempt.set(studentId, row);
        }
        
        // Track completion history
        if (!completionHistory.has(studentId)) {
          completionHistory.set(studentId, { 
            hasEverCompleted: false, 
            totalAttempts: 0, 
            completedAttempts: 0 
          });
        }
        
        const history = completionHistory.get(studentId)!;
        history.totalAttempts++;
        
        // Check if this attempt shows completion
        const completedStatuses = ['graded', 'pending', 'awaiting_review', 'completed'];
        if (completedStatuses.includes(row.status || '')) {
          history.hasEverCompleted = true;
          history.completedAttempts++;
          
          // Store the latest completed submission (highest attempt number)
          if (!history.latestCompletedAttempt || row.attempt > history.latestCompletedAttempt) {
            history.latestCompletedSubmissionId = row.id;
            history.latestCompletedAttempt = row.attempt;
          }
        }
      });
  
      // 5. Create final output including all students
      const result = students.map(student => {
        const submission = latestAttempt.get(student.student_id);
        const history = completionHistory.get(student.student_id);
        const user = Array.isArray(student.users) ? student.users[0] : student.users;
  
        if (!submission) {
          // Student hasn't started the assignment
          return {
            id: `not_started_${student.student_id}`,
            student_id: student.student_id,
            student_name: user?.name ?? 'Unknown',
            student_email: user?.email ?? 'Unknown',
            assignment_id: assignmentId,
            attempt: 0,
            status: 'not_started' as SubmissionStatus,
            submitted_at: null,
            grade: null,
            overall_grade: student.overall_grade,
            has_ever_completed: false,
            total_attempts: 0,
            completed_attempts: 0,
          };
        }
  
        // Student has submitted something
        
        return {
          id: submission.id,
          student_id: submission.student_id,
          student_name: user?.name ?? 'Unknown',
          student_email: user?.email ?? 'Unknown',
          assignment_id: submission.assignment_id,
          attempt: submission.attempt,
          status: (submission.status ?? 'not_started') as SubmissionStatus,
          submitted_at: submission.submitted_at,
          grade: submission.grade,
          overall_grade: student.overall_grade,
          has_ever_completed: history?.hasEverCompleted ?? false,
          total_attempts: history?.totalAttempts ?? 0,
          completed_attempts: history?.completedAttempts ?? 0,
          completed_submission_id: history?.latestCompletedSubmissionId,
        };
      });
  
      return result;
    },
  
    /* ------------------------------------------------------------------ *
     *  getClassStatistics           (batched submissions query)
     * ------------------------------------------------------------------ */
    async getClassStatistics(classId: string) {
      // assignments + students in single calls
      const [{ data: assignments, error: aErr }, { data: students, error: sErr }] =
        await Promise.all([
          supabase.from('assignments').select('id').eq('class_id', classId),
          supabase.from('students_classes')
            .select('student_id, overall_grade')
            .eq('class_id', classId),
        ]);
  
      if (aErr) throw new Error(aErr.message);
      if (sErr) throw new Error(sErr.message);
  
      // average grade
      const grades = students
        .map(s => s.overall_grade)
        .filter((g): g is number => g !== null);
      const avgGrade =
        grades.length ? grades.reduce((s, g) => s + g, 0) / grades.length : null;
  
      // submissions for **all** assignments in one go
      const assignmentIds = assignments.map(a => a.id);
      let completedAssignments = 0;
  
      if (assignmentIds.length) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('assignment_id, status')
          .in('assignment_id', assignmentIds);
  
        const grouped = new Map<string, string[]>();
        subs?.forEach(s => {
          if (!grouped.has(s.assignment_id)) grouped.set(s.assignment_id, []);
          grouped.get(s.assignment_id)!.push(s.status ?? '');
        });
  
        assignmentIds.forEach(id => {
          const statuses = grouped.get(id) ?? [];
          if (statuses.some(s => /complet/i.test(s))) completedAssignments++;
        });
      }
  
      return {
        avgGrade,
        completedAssignments,
        totalAssignments: assignments.length,
        studentCount: students.length,
      };
    },
  
    /* ------------------------------------------------------------------ *
     *  getAssignmentCompletionStats (unchanged logic, but batched statuses)
     * ------------------------------------------------------------------ */
    async getAssignmentCompletionStats(assignmentId: string) {
      const { data: asn, error: asnErr } = await supabase
        .from('assignments')
        .select('class_id')
        .eq('id', assignmentId)
        .single();
      if (asnErr) throw new Error(asnErr.message);
  
      const [{ count: total, error: cntErr }, { data: subs, error: subErr }] =
        await Promise.all([
          supabase
            .from('students_classes')
            .select('student_id', { count: 'exact' })
            .eq('class_id', asn.class_id),
          supabase
            .from('submissions')
            .select('status')
            .eq('assignment_id', assignmentId),
        ]);
  
      if (cntErr) throw new Error(cntErr.message);
      if (subErr) throw new Error(subErr.message);
      if (total === null) throw new Error('Could not determine student total');
  
      let submitted = 0;
      let inProgress = 0;
  
      subs.forEach(s => {
        const st = (s.status ?? '').toLowerCase();
        if (/complet/.test(st)) submitted++;
        else if (/progress|start/.test(st)) inProgress++;
      });
  
      return {
        submitted,
        inProgress,
        notStarted: total - submitted - inProgress,
        totalStudents: total,
      };
    },
  
    /* ------------------------------------------------------------------ *
     *  getClassDetailView      ( ✅ batched submissions query )
     * ------------------------------------------------------------------ */
    async getClassDetailView(classId: string) {
      /** 1️⃣  class + assignments + student grades in one query */
      const { data: cls, error } = await supabase
        .from('classes')
        .select(
          `
          id, name, class_code, created_at,
          assignments (
            id, title, created_at, due_date, topic, status, metadata
          ),
          students_classes (
            student_id, overall_grade
          )
        `,
        )
        .eq('id', classId)
        .single();
  
      if (error) throw new Error(error.message);
  
      const assignments = (cls.assignments ?? []) as AssignmentWithSubmissions[];
      const assignmentIds = assignments.map(a => a.id);
  
      /** 2️⃣  pull ALL submissions for those assignments at once */
      let groupedSubs: Map<string, StudentSubmission[]> = new Map();
      if (assignmentIds.length) {
        const { data: subs } = await supabase
          .from('submissions')
          .select(
            'id, student_id, attempt, status, submitted_at, grade, assignment_id',
          )
          .in('assignment_id', assignmentIds);
  
        subs?.forEach(sub => {
          if (!groupedSubs.has(sub.assignment_id)) groupedSubs.set(sub.assignment_id, []);
          groupedSubs.get(sub.assignment_id)!.push(sub as StudentSubmission);
        });
      }
  
      /** 3️⃣  attach submissions array to each assignment */
      assignments.forEach(a => (a.submissions = groupedSubs.get(a.id) ?? []));
  
      return cls;
    },
  
    async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
      console.log('Fetching assignments for teacher:', teacherId);
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          classes!inner(
            id,
            teacher_id
          )
        `)
        .eq('classes.teacher_id', teacherId)
        .order('created_at', { ascending: false });
  
      console.log('Raw assignments data from Supabase:', data);
      console.log('Supabase error if any:', error);
  
      if (error) throw new Error(error.message);
      return data as Assignment[];
    },
  };
  