import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { joinClass } from '@/features/class/classThunks';
import { fetchAssignmentByClass } from '@/features/assignments/assignmentThunks';
import { AssignmentStatus } from '@/features/assignments/types';
import { Card } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentListProps {
  onAddClass: () => void;
}

const getButtonText = (status: AssignmentStatus, hasInProgressSubmission: boolean) => {
  if (hasInProgressSubmission) {
    return 'Resume Assignment';
  }
  
  switch (status) {
    case 'not_started':
      return 'Start Assignment';
    case 'in_progress':
      return 'Start Assignment';
    case 'completed':
      return 'View Submission';
    default:
      return 'View Assignment';
  }
};

const AssignmentList: React.FC<AssignmentListProps> = ({ onAddClass }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { classes } = useAppSelector(state => state.classes);
  const { assignments, loading } = useAppSelector(state => state.assignments);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, { isCompleted: boolean; isInProgress: boolean }>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      dispatch(fetchAssignmentByClass(selectedClassId));
    }
  }, [selectedClassId, dispatch]);

  // Updated effect to check submission status
  useEffect(() => {
    const checkSubmissions = async () => {
      if (!user || !assignments.length) return;
      
      setIsLoadingSubmissions(true);
      const submissions: Record<string, { isCompleted: boolean; isInProgress: boolean }> = {};
      
      try {
        for (const assignment of assignments) {
          const { data, error } = await supabase
            .from('submissions')
            .select('status')
            .eq('assignment_id', assignment.id)
            .eq('student_id', user.id)
            .order('submitted_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) {
            const status = data[0].status;
            submissions[assignment.id] = {
              isCompleted: ['pending', 'graded', 'awaiting_review'].includes(status),
              isInProgress: status === 'in_progress'
            };
          } else {
            submissions[assignment.id] = {
              isCompleted: false,
              isInProgress: false
            };
          }
        }
      } finally {
        setAssignmentSubmissions(submissions);
        setIsLoadingSubmissions(false);
      }
    };

    checkSubmissions();
  }, [user, assignments]);

  // Filter assignments to only show those that are not completed
  const activeAssignments = assignments.filter(assignment => {
    const submission = assignmentSubmissions[assignment.id];
    return !submission?.isCompleted && (assignment.status === 'not_started' || assignment.status === 'in_progress');
  });

  const handleViewAssignment = (id: string) => {
    navigate(`/student/assignment/${id}/practice`);
    toast({
      title: "View Assignment",
      description: `Viewing assignment ${id}`,
    });
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setJoinError(null);
      await dispatch(joinClass({ studentId: user.id, classCode: joinCode })).unwrap();
      toast({
        title: "Class Joined",
        description: `Successfully joined class with code: ${joinCode}`,
      });
      setJoinCode('');
      setIsDialogOpen(false);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join class');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to join class',
        variant: "destructive",
      });
    }
  };

  const renderSkeletonLoader = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="overflow-hidden shadow-sm h-full flex flex-col rounded-lg">
        <div className="p-5 bg-white flex flex-col h-full">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="mt-auto">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Assignments Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Active Assignments</h2>
          
          <div className="flex items-center">
            <div className="relative">
              <div className="flex bg-gray-100 rounded-lg items-center">
                <Select 
                  value={selectedClassId} 
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger className="w-[180px] border-none bg-transparent">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 mr-1"
                      onClick={onAddClass}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Join a Class</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJoinClass} className="space-y-4">
                      <div>
                        <Label className="block text-sm font-medium text-gray-700">Class Code</Label>
                        <div className="mt-1 bg-gray-50 px-4 py-3 rounded-md">
                          <Input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            required
                            className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Enter class code"
                          />
                        </div>
                        {joinError && (
                          <p className="text-red-500 text-sm mt-2">{joinError}</p>
                        )}
                      </div>
                      <DialogFooter className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-[#272A69] border border-transparent rounded-md hover:bg-[#272A69]/90"
                        >
                          Join Class
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        
        {loading || isLoadingSubmissions ? (
          renderSkeletonLoader()
        ) : activeAssignments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAssignments.map((assignment) => (
              <Card 
                key={assignment.id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col rounded-lg"
                onClick={() => handleViewAssignment(assignment.id)}
              >
                <div className="p-5 bg-white flex flex-col h-full">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{assignment.title}</h3>
                  <p className="text-xs font-medium text-gray-500 mb-4">
                    Due: {new Date(assignment.due_date).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-[#272A69]/90 hover:text-white text-white border border-[#272A69] font-medium rounded-lg bg-[#272A69]"
                      onClick={() => handleViewAssignment(assignment.id)}
                    >
                      {getButtonText(assignment.status, assignmentSubmissions[assignment.id]?.isInProgress || false)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          ) : selectedClassId ? (
            <div className="col-span-full text-center py-8 text-gray-500">
            No active assignments available for this class
            </div>
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              Select a class to view assignments
            </div>
          )}
      </div>
    </div>
  );
};

export default AssignmentList;
