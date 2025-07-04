import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { setSelectedTeacher } from '@/features/metrics/metricsSlice';
import { useClassDetailWebSocket } from '@/hooks/teacher/useClassDetailWebSocket';

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

  const { assignmentMetrics } = useAppSelector((state) => state.metrics);

  // Get the override teacher ID from sessionStorage
  const overrideTeacherId = sessionStorage.getItem('overrideTeacherId');
  const effectiveUserId = overrideTeacherId || user?.id;

  // State for tracking back button clicks
  const [backButtonClicked, setBackButtonClicked] = useState(false);

  // Clear override if we're in a normal view (not injected)
  useEffect(() => {
    // If we have a user ID and it matches the override, we're in a normal view
    if (user?.id && overrideTeacherId === user.id) {
      sessionStorage.removeItem('overrideTeacherId');
    }

    // Cleanup when navigating away
    return () => {
      // If we're not in an injected view (override doesn't match current user)
      // AND the back button wasn't clicked, then clear the overrideTeacherId
      if (user?.id && overrideTeacherId !== user.id && !backButtonClicked) {
        sessionStorage.removeItem('overrideTeacherId');
      }
    };
  }, [overrideTeacherId, user?.id, backButtonClicked]);

  // Initialize expanded state from sessionStorage
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const savedState = sessionStorage.getItem(`expanded_assignments_${classId}`);
    return new Set(savedState ? JSON.parse(savedState) : []);
  });

  // Sorting state for each assignment
  const [sortingState, setSortingState] = useState<Record<string, 'completed' | 'in_progress' | 'not_started' | 'all'>>({});

  // Save expanded state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(`expanded_assignments_${classId}`, JSON.stringify(Array.from(expanded)));
  }, [expanded, classId]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const fetchedAssignmentIds = useRef<Set<string>>(new Set());

  // Set up real-time WebSocket connection for assignment updates
  useClassDetailWebSocket({
    classId: classId || undefined,
    assignmentIds: assignments.map(a => a.id),
    enabled: !!classId && assignments.length > 0
  });


  /* ------------------------------------------------------------------ *
   *  Fetch flow – first load basic slices, then per‑assignment data.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!effectiveUserId || !classId) {
      return;
    }

    // Load basic data in parallel
    Promise.all([
      dispatch(fetchClasses({ role: 'teacher', userId: effectiveUserId })),
      dispatch(fetchClassStatsByTeacher(effectiveUserId)),
      dispatch(fetchAssignmentByClass(classId))
    ]).catch(error => {
      console.error('Error loading class data:', error);
    });
  }, [effectiveUserId, classId, dispatch]);

  useEffect(() => {
    if (!assignments.length) return;

    // Batch fetch all assignment data in parallel
    const newAssignments = assignments.filter(a => !fetchedAssignmentIds.current.has(a.id));
    if (newAssignments.length === 0) return;

    const fetchPromises = newAssignments.flatMap(assignment => [
      dispatch(fetchLatestSubmissionsByAssignment(assignment.id)),
      dispatch(fetchAssignmentCompletionStats(assignment.id))
    ]);

    Promise.all(fetchPromises).catch(error => {
      console.error('Error loading assignment data:', error);
    });

    // Mark all new assignments as fetched
    newAssignments.forEach(assignment => {
      fetchedAssignmentIds.current.add(assignment.id);
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
    const comp = {
      submitted: subs.filter(s => s.has_ever_completed === true).length,
      inProgress: subs.filter(s => s.status === 'in_progress' && s.has_ever_completed !== true).length,
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

  // Helper function to get submission status category
  const getSubmissionStatusCategory = (st: StudentSubmission) => {
    const hasEverCompleted = st.has_ever_completed === true;
    const currentStatus = st.status;
    
    if (hasEverCompleted) return 'completed';
    if (currentStatus === 'in_progress') return 'in_progress';
    return 'not_started';
  };

  // Helper function to sort and filter submissions by status
  const getSortedSubmissions = (subs: StudentSubmission[], assignmentId: string) => {
    const sortBy = sortingState[assignmentId] || 'all';
    
    // Create a copy of the array to avoid mutating the original
    let filteredSubs = [...subs];
    if (sortBy !== 'all') {
      filteredSubs = subs.filter(st => getSubmissionStatusCategory(st) === sortBy);
    }
    
    // Sort by status priority: completed first, then in_progress, then not_started
    return filteredSubs.sort((a, b) => {
      const statusOrder = { 'completed': 0, 'in_progress': 1, 'not_started': 2 };
      const aStatus = getSubmissionStatusCategory(a);
      const bStatus = getSubmissionStatusCategory(b);
      return statusOrder[aStatus] - statusOrder[bStatus];
    });
  };


  const handleBackToDashboard = () => {
    sessionStorage.removeItem(`expanded_assignments_${classId}`);
    
    // Check if we're viewing as another teacher
    const overrideTeacherId = sessionStorage.getItem('overrideTeacherId');
    if (overrideTeacherId) {
      // Set the back button clicked flag to prevent cleanup from clearing overrideTeacherId
      setBackButtonClicked(true);
      
      // Get the teacher's name from the metrics data
      const teacherMetric = assignmentMetrics.find(m => m.teacher_id === overrideTeacherId);
      const teacherName = teacherMetric?.name || '';
      
      // Store the selected teacher in Redux for the dev dashboard
      dispatch(setSelectedTeacher({
        teacher_id: overrideTeacherId,
        name: teacherName,
        total_assignments: teacherMetric?.total_assignments || 0,
        last_assignment_created_at: teacherMetric?.last_assignment_created_at || null
      }));

      // Store the active tab in sessionStorage
      sessionStorage.setItem('devDashActiveTab', 'assignments');
      
      // Navigate back to dev dashboard
      navigate('/dev-dash');
    } else {
      // Normal back navigation
      onBack();
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
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/class/${classId}/create-assignment`)}
            className="bg-[#272A69] hover:bg-[#272A69]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Assignment
          </Button>
        </div>
      </div>

      {/* Global Sort Filter */}
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <div className="flex items-center gap-2">
          <label htmlFor="globalSort" className="text-sm font-medium text-gray-700">
            Filter students by status:
          </label>
          <select
            id="globalSort"
            value={Object.values(sortingState)[0] || 'all'}
            onChange={(e) => {
              const value = e.target.value as 'completed' | 'in_progress' | 'not_started' | 'all';
              // Apply the same filter to all assignments
              const newSortingState: Record<string, 'completed' | 'in_progress' | 'not_started' | 'all'> = {};
              assignmentRows.forEach(assignment => {
                newSortingState[assignment.id] = value;
              });
              setSortingState(newSortingState);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Students</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
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
                            { header: 'Student', width: 'w-1/5' },
                            { header: 'Status', width: 'w-1/6' },
                            { header: 'Attempts', width: 'w-1/8' },
                            { header: 'Last Updated', width: 'w-1/5' },
                            { header: 'Grade', width: 'w-1/6' },
                            { header: 'Action', width: 'w-1/6' }
                          ].map(({ header, width }) => (
                            <th
                              key={header}
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${width}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedSubmissions(subs, a.id).map((st) => (
                          <tr key={st.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/5">
                              {st.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm w-1/6">
                              {(() => {
                                const hasEverCompleted = st.has_ever_completed === true;
                                const currentStatus = st.status;
                                
                                return (
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    hasEverCompleted
                                      ? 'bg-green-100 text-green-800'
                                      : currentStatus === 'in_progress'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {hasEverCompleted
                                      ? 'Completed'
                                      : currentStatus === 'in_progress'
                                      ? 'In Progress'
                                      : 'Not Started'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/8">
                              {st.completed_attempts || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/5">
                              {st.status === 'in_progress' 
                                ? 'Not Submitted'
                                : st.submitted_at
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/6">
                              {st.status === 'graded' 
                                ? 'Graded'
                                : st.status === 'awaiting_review'
                                ? 'Awaiting Review'
                                : st.status === 'pending'
                                ? 'Pending'
                                : 'Not graded'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/6">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const submissionId = st.has_ever_completed && st.completed_submission_id 
                                    ? st.completed_submission_id 
                                    : st.id;
                                  navigate(`/student/submission/${submissionId}/feedback`, { 
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