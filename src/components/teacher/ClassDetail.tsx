import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Users, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const location = useLocation();
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

  // Initialize expanded state from sessionStorage
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const savedState = sessionStorage.getItem(`expanded_assignments_${classId}`);
    console.log('ClassDetail - Loading expanded state from sessionStorage:', savedState);
    return new Set(savedState ? JSON.parse(savedState) : []);
  });

  // Save expanded state to sessionStorage whenever it changes
  useEffect(() => {
    console.log('ClassDetail - Saving expanded state to sessionStorage:', Array.from(expanded));
    sessionStorage.setItem(`expanded_assignments_${classId}`, JSON.stringify(Array.from(expanded)));
  }, [expanded, classId]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const fetchedAssignmentIds = useRef<Set<string>>(new Set());

  /* ------------------------------------------------------------------ *
   *  Fetch flow – first load basic slices, then per‑assignment data.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!user || !classId) return;

    console.log('ClassDetail - Fetching data for class:', classId);
    dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
    dispatch(fetchClassStatsByTeacher(user.id));
    dispatch(fetchAssignmentByClass(classId));
  }, [user, classId, dispatch]);

  useEffect(() => {
    if (!assignments.length) return;
    console.log('ClassDetail - Fetching submissions for assignments:', assignments.map(a => a.id));

    assignments.forEach((assignment) => {
      if (!fetchedAssignmentIds.current.has(assignment.id)) {
        dispatch(fetchLatestSubmissionsByAssignment(assignment.id));
        dispatch(fetchAssignmentCompletionStats(assignment.id));
        fetchedAssignmentIds.current.add(assignment.id);
      }
    });
  }, [assignments, dispatch]);

  if (classLoading || assignmentsLoading) {
    return null;
  }

  /* ------------------------------------------------------------------ *
   *  Derived data
   * ------------------------------------------------------------------ */
  const cls = classModels.find((c) => c.id === classId);
  const stat = classStats.find((s) => s.id === classId);
  if (!cls || !stat) {
    return null;
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
    console.log('ClassDetail - Assignment submissions:', { 
      assignmentId: a.id, 
      title: a.title, 
      submissions: subs,
      expanded: expanded.has(a.id)
    });
    const comp = {
      submitted: subs.filter(s => s.status === 'graded' || s.status === 'pending').length,
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
  const toggle = (id: string) => {
    console.log('ClassDetail - Toggling assignment:', id, 'Current expanded:', Array.from(expanded));
    setExpanded((prev) => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `Class code ${text} has been copied to your clipboard`,
    });
  };

  const handleBackToDashboard = () => {
    console.log('ClassDetail - Going back to dashboard, clearing session storage');
    sessionStorage.removeItem(`expanded_assignments_${classId}`);
    onBack();
  };

  /* ------------------------------------------------------------------ *
   *  JSX
   * ------------------------------------------------------------------ */
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={handleBackToDashboard}
        className="mb-4 -ml-2 text-gray-600"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
      </Button>

      {/* Class header */}
      <Card className="bg-gray-100 mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {classData.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-gray-500">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{classData.students}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Students enrolled</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{classData.assignments}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total assignments</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(classData.code)}
                      >
                        {classData.code}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy class code</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create btn */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Assignments</h2>
        <Button
          onClick={() => navigate(`/class/${classId}/create-assignment`)}
          className="bg-[#272A69] hover:bg-[#272A69]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Assignment
        </Button>
      </div>

      {/* List */}
      {assignmentRows.map((a) => {
        const subs: StudentSubmission[] = submissions[a.id] || [];

        return (
          <Card 
            key={a.id} 
            className="mb-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => toggle(a.id)}
          >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openDel(a.id);
                    }}
                    disabled={deletingAssignmentId === a.id}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(a.id);
                    }}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(() => {
                                console.log('Rendering status for:', st.student_name, 'Status:', st.status, 'Grade:', st.grade);
                                const isCompleted = st.status === 'graded' || st.status === 'pending';
                                return (
                                  <span className={`px-2 py-1 rounded-full ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-800'
                                      : st.status === 'in_progress'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {isCompleted
                                      ? 'Completed'
                                      : st.status === 'in_progress'
                                      ? 'In Progress'
                                      : 'Not Started'}
                                  </span>
                                );
                              })()}
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
                              {st.status === 'graded' ? 'Graded' : 'Not graded'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('ClassDetail - Navigating to submission:', st.id);
                                  console.log('ClassDetail - Current expanded state:', Array.from(expanded));
                                  navigate(`/student/submission/${st.id}/feedback`, { 
                                    state: { 
                                      fromClassDetail: true
                                    } 
                                  });
                                }}
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