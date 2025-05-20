import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  fetchClasses,
  fetchClassStatsByTeacher,
} from '@/features/class/classThunks';
import {
  deleteAssignment,
  fetchAssignmentByClass,
  fetchLatestSubmissionsByAssignment,
  fetchAssignmentCompletionStats,
} from '@/features/assignments/assignmentThunks';
import type {
  StudentSubmission,
} from '@/features/assignments/types';
import { useAppDispatch, useAppSelector } from '@/app/hooks';

/* ------------------------------------------------------------------ *
 *  Helpers / local types
 * ------------------------------------------------------------------ */
interface LocalAssignment {
  id: string;
  name: string;
  dueDate: string;
  submitted: number;
  totalStudents: number;
  inProgress: number;
  notStarted: number;
}

interface ClassDetailProps {
  onBack: () => void;
}

/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */
const ClassDetail: React.FC<ClassDetailProps> = ({ onBack }) => {
  /* ------------------------------ hooks / state -------------------- */
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { user } = useAppSelector((s) => s.auth);
  const {
    classes: classModels,
    classStats,
    loading: classLoading,
  } = useAppSelector((s) => s.classes);
  const {
    assignments,
    loading: assignmentsLoading,
    submissions,
    deletingAssignmentId,
  } = useAppSelector((s) => s.assignments);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  /* ------------------------------------------------------------------ *
   *  Fetch flow – first load basic slices, then per‑assignment data.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!user || !classId) return;

    setIsLoaded(false);
    Promise.all([
      dispatch(fetchClasses({ role: 'teacher', userId: user.id })).unwrap(),
      dispatch(fetchClassStatsByTeacher(user.id)).unwrap(),
      dispatch(fetchAssignmentByClass(classId)).unwrap(),
    ])
      .catch((err) => {
        console.error(err);
        toast({ title: 'Error loading data', variant: 'destructive' });
      })
      .finally(() => setIsLoaded(true));
  }, [user, classId, dispatch, toast]);

  /** once we know the assignment ids, fetch submissions & completion stats */
  useEffect(() => {
    if (!isLoaded || assignments.length === 0) return;

    assignments.forEach((a) => {
      dispatch(fetchLatestSubmissionsByAssignment(a.id));
      dispatch(fetchAssignmentCompletionStats(a.id));
    });
  }, [isLoaded, assignments, dispatch]);

  /* Don't render anything until *all* initial slices have loaded */
  if (classLoading || assignmentsLoading || !isLoaded) {
    return (
      <div className="p-8 text-center text-gray-500">Loading class details…</div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  Derived data
   * ------------------------------------------------------------------ */
  const cls = classModels.find((c) => c.id === classId);
  const stat = classStats.find((s) => s.id === classId);
  if (!cls || !stat) {
    return (
      <div className="p-8 text-center text-gray-500">Fetching details…</div>
    );
  }

  const classData = {
    name: cls.name,
    code: (cls as any).class_code,
    students: stat.student_count,
    assignments: stat.assignment_count,
  };

  /* map assignments -> rows, using stats already in the store */
  const assignmentRows: LocalAssignment[] = assignments.map((a) => {
    const subs = submissions[a.id] || [];
    const comp = {
      submitted: subs.filter(s => s.status === 'completed').length,
      inProgress: subs.filter(s => s.status === 'in_progress').length,
      notStarted: classData.students - subs.length,
      totalStudents: classData.students,
    };

    return {
      id: a.id,
      name: a.title,
      dueDate: new Date(a.due_date).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      submitted: comp.submitted,
      totalStudents: comp.totalStudents,
      inProgress: comp.inProgress,
      notStarted: comp.notStarted,
    };
  });

  /* ------------------------------------------------------------------ *
   *  UI helpers
   * ------------------------------------------------------------------ */
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });

  const openDel = (id: string) => {
    setToDelete(id);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await dispatch(deleteAssignment(toDelete)).unwrap();
      toast({ title: 'Deleted', description: 'Assignment removed.' });
      setConfirmOpen(false);
      if (classId) dispatch(fetchAssignmentByClass(classId));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    }
  };

  /* ------------------------------------------------------------------ *
   *  JSX
   * ------------------------------------------------------------------ */
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2 text-gray-600"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
      </Button>

      {/* Class header */}
      <Card className="bg-gray-100 mb-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {classData.name}
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Class Code: {classData.code}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ['Students', classData.students],
              ['Assignments', classData.assignments],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-4 rounded-lg shadow-sm text-center"
              >
                <p className="text-gray-500 text-sm">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create btn */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Assignments</h2>
        <Button
          onClick={() => navigate(`/class/${classId}/create-assignment`)}
          className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Assignment
        </Button>
      </div>

      {/* List */}
      {assignmentRows.map((a) => {
        const subs: StudentSubmission[] =
          submissions[a.id] || [];

        return (
          <Card key={a.id} className="mb-4 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    {a.name}
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                      {a.submitted}/{a.totalStudents} completed
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Due: {a.dueDate}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => openDel(a.id)}
                    disabled={deletingAssignmentId === a.id}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(a.id)}
                  >
                    {expanded.has(a.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expanded.has(a.id) && (
              <CardContent className="p-4 pt-0">
                <Separator className="my-2" />
                {subs.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            'Student',
                            'Status',
                            'Submitted At',
                            'Grade',
                            'Action',
                          ].map((h) => (
                            <th
                              key={h}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subs.map((st) => (
                          <tr key={st.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {st.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {st.status.charAt(0).toUpperCase() + st.status.slice(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {st.submitted_at
                                ? new Date(st.submitted_at).toLocaleString(undefined, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })
                                : 'Not submitted'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {st.grade !== null ? `${st.grade}%` : 'Not graded'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/assignment/${a.id}/submission/${st.student_id}`)
                                }
                              >
                                Review
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No submissions yet.</p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Delete dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doDelete}
              disabled={deletingAssignmentId === toDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassDetail;