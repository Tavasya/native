import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Users, FileText, UserMinus, Settings } from 'lucide-react';
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
  removeStudentFromClass,
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
  const [removeStudentOpen, setRemoveStudentOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{id: string, name: string} | null>(null);
  const [showStudentManagement, setShowStudentManagement] = useState(false);
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

  const openRemoveStudent = (studentId: string, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName });
    setRemoveStudentOpen(true);
  };

  const doRemoveStudent = async () => {
    if (!studentToRemove || !classId) return;
    try {
      await dispatch(removeStudentFromClass({ 
        studentId: studentToRemove.id, 
        classId: classId 
      })).unwrap();
      toast({ 
        title: 'Student removed', 
        description: `${studentToRemove.name} has been removed from the class.` 
      });
      setRemoveStudentOpen(false);
      setStudentToRemove(null);
      // Refresh class data to update student count and submissions
      if (effectiveUserId) {
        dispatch(fetchClassStatsByTeacher(effectiveUserId));
      }
      dispatch(fetchAssignmentByClass(classId));
    } catch (err: any) {
      toast({ 
        title: 'Error removing student', 
        description: err.message || 'Failed to remove student from class',
        variant: 'destructive'
      });
    }
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
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStudentManagement(!showStudentManagement)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage students</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Management Section */}
      {showStudentManagement && (
        <Card className="mb-6 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Student Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                 Select a student's name below to remove them from the class. This will remove their access to all assignments and their submission history.
              </p>
              
              {/* Get unique students from this class's submissions only */}
              {(() => {
                const uniqueStudents = new Map<string, { name: string, email: string }>();
                // Only look at submissions for assignments in this class
                assignmentRows.forEach(assignment => {
                  const subs = submissions[assignment.id] || [];
                  subs.forEach(sub => {
                    if (!uniqueStudents.has(sub.student_id)) {
                      uniqueStudents.set(sub.student_id, {
                        name: sub.student_name,
                        email: sub.student_email
                      });
                    }
                  });
                });
                
                const students = Array.from(uniqueStudents.entries());
                
                if (students.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No students have submitted assignments yet.</p>
                      <p className="text-sm">Students will appear here once they start working on assignments.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="grid gap-2">
                    {students.map(([studentId, studentInfo]) => (
                      <div 
                        key={studentId} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {studentInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{studentInfo.name}</p>
                            <p className="text-sm text-gray-500">{studentInfo.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRemoveStudent(studentId, studentInfo.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

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
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      const assignment = assignments.find(assignment => assignment.id === a.id);
                      if (assignment) {
                        navigate(`/class/${classId}/create-assignment`, {
                          state: {
                            isEditing: true,
                            assignmentId: a.id,
                            editData: {
                              title: assignment.title,
                              due_date: assignment.due_date.split('T')[0],
                              due_time: assignment.due_date.split('T')[1]?.substring(0, 5) || '23:59',
                              questions: assignment.questions,
                              metadata: assignment.metadata
                            }
                          }
                        });
                      }
                    }}
                  >
                    Edit
                  </Button>
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
                            { header: 'Student', width: 'w-1/6' },
                            { header: 'Status', width: 'w-1/8' },
                            { header: 'Attempts', width: 'w-1/12' },
                            { header: 'Last Updated', width: 'w-1/6' },
                            { header: 'Grade', width: 'w-1/8' },
                            { header: 'Actions', width: 'w-1/5' }
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/6">
                              {st.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm w-1/8">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/12">
                              {st.completed_attempts || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/6">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/8">
                              {st.status === 'graded' 
                                ? 'Graded'
                                : st.status === 'awaiting_review'
                                ? 'Awaiting Review'
                                : st.status === 'pending'
                                ? 'Pending'
                                : 'Not graded'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-1/5">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="secondary"
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRemoveStudent(st.student_id, st.student_name);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </div>
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

      {/* Remove Student dialog */}
      <Dialog open={removeStudentOpen} onOpenChange={setRemoveStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student from Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{studentToRemove?.name}</strong> from this class?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-3">This will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
              <li>Remove their access to all class assignments</li>
              <li>Remove them from the class roster</li>
              <li>They will no longer see this class in their dashboard</li>
            </ul>
            <p className="text-orange-600 font-medium text-sm mt-4">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveStudentOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doRemoveStudent}
            >
              <UserMinus className="h-4 w-4 mr-1" />
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassDetail;