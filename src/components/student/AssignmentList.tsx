import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Assignment, AssignmentStatus } from '@/features/assignments/types';
import { Card } from "@/components/ui/card";

interface AssignmentListProps {
  onAddClass: () => void;
}

const getButtonText = (status: AssignmentStatus) => {
  switch (status) {
    case 'not_started':
      return 'Start Assignment';
    case 'in_progress':
      return 'Continue Assignment';
    case 'completed':
      return 'Review Assignment';
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

  return (
    <div className="space-y-10">
      {/* Assignments Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Assignments</h2>
          
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
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join a Class</DialogTitle>
                      <DialogDescription>
                        Enter the class code provided by your teacher.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleJoinClass}>
                      <div className="py-4">
                        <Label htmlFor="class-code">Class Code</Label>
                        <Input 
                          id="class-code" 
                          value={joinCode} 
                          onChange={(e) => setJoinCode(e.target.value)} 
                          placeholder="Enter class code (e.g., XYZ123)"
                        />
                        {joinError && (
                          <p className="text-red-500 text-sm mt-2">{joinError}</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Join Class</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading assignments...
            </div>
          ) : assignments.length > 0 ? (
            assignments.map((assignment) => (
              <Card 
                key={assignment.id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col rounded-lg"
                onClick={() => handleViewAssignment(assignment.id)}
              >
                <div className="p-5 bg-white flex flex-col h-full">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{assignment.title}</h3>
                  <p className="text-xs font-medium text-gray-500 mb-4">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                  
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      className="w-full hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium rounded-lg"
                      onClick={() => handleViewAssignment(assignment.id)}
                    >
                      {getButtonText(assignment.status)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : selectedClassId ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No assignments available for this class
            </div>
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              Select a class to view assignments
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentList;
