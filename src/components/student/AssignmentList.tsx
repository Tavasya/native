import React, { useState } from 'react';
import AssignmentCard, { AssignmentStatus } from './AssignmentCard';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
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

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  isPractice?: boolean;
  isUnread?: boolean;
}

// Sample assignment data - sorted by due date (most recent first)
const assignments: Assignment[] = [
  {
    id: '1',
    title: 'IELTS Writing Task 2',
    description: 'Write a 250-word essay on environmental challenges',
    dueDate: '05/21/2025',
    status: 'not started',
    isUnread: true
  },
  {
    id: '2',
    title: 'IELTS Speaking Practice',
    description: 'Record a 2-minute response to the provided speaking prompt',
    dueDate: '05/25/2025',
    status: 'in progress'
  },
  {
    id: '4',
    title: 'IELTS Reading Comprehension',
    description: 'Complete three academic reading passages with questions',
    dueDate: '05/30/2025',
    status: 'not started',
    isUnread: true
  },
  {
    id: '5',
    title: 'IELTS Listening Test Prep',
    description: 'Practice with four recorded listening passages and answer questions',
    dueDate: '06/05/2025',
    status: 'not started'
  },
  {
    id: '6',
    title: 'IELTS Academic Vocabulary',
    description: 'Complete vocabulary exercises focusing on academic word list',
    dueDate: '06/10/2025',
    status: 'not started'
  },

  // Practice assignment - always displayed and fixed
  {
    id: '3',
    title: 'Practice',
    description: 'Practice your IELTS writing with AI feedback and corrections',
    dueDate: 'Ongoing',
    status: 'in progress',
    isPractice: true
  },
];

interface AssignmentListProps {
  onAddClass: () => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({ onAddClass }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewAssignment = (id: string) => {
    // Navigate to the practice page directly instead of the overview
    navigate(`/student/assignment/${id}/practice`);
    toast({
      title: "View Assignment",
      description: `Viewing assignment ${id}`,
    });
  };

  const handleJoinClass = () => {
    if (joinCode.trim()) {
      toast({
        title: "Class Joined",
        description: `Successfully joined class with code: ${joinCode}`,
      });
      setJoinCode('');
      setIsDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid class code",
        variant: "destructive",
      });
    }
  };

  // Sort all non-practice assignments by due date (most recent first)
  const regularAssignments = assignments
    .filter(assignment => !assignment.isPractice)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Get practice assignment
  const practiceAssignment = assignments.find(assignment => assignment.isPractice);

  // Get assignments to display - always exactly 3 (or less if there aren't 3)
  const displayedRegularAssignments = showAllAssignments 
    ? regularAssignments 
    : regularAssignments.slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Upcoming Assignments Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Upcoming Assignments</h2>
          
          <div className="flex items-center">
            <div className="relative">
              <div className="flex bg-gray-100 rounded-lg items-center">
                <Select defaultValue="class1">
                  <SelectTrigger className="w-[180px] border-none bg-transparent">
                    <SelectValue placeholder="Biology 101" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class1">Biology 101</SelectItem>
                    <SelectItem value="class2">Mathematics 202</SelectItem>
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
                    <div className="py-4">
                      <Label htmlFor="class-code">Class Code</Label>
                      <Input 
                        id="class-code" 
                        value={joinCode} 
                        onChange={(e) => setJoinCode(e.target.value)} 
                        placeholder="Enter class code (e.g., XYZ123)"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleJoinClass}>Join Class</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Always display practice assignment first with special styling */}
          {practiceAssignment && (
            <AssignmentCard
              key={practiceAssignment.id}
              id={practiceAssignment.id}
              title={practiceAssignment.title}
              description={practiceAssignment.description}
              dueDate={practiceAssignment.dueDate}
              status={practiceAssignment.status}
              isPractice={true}
              onView={() => navigate('/student/practice')}
            />
          )}
          
          {/* Display regular assignments */}
          {displayedRegularAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              id={assignment.id}
              title={assignment.title}
              description={assignment.description}
              dueDate={assignment.dueDate}
              status={assignment.status}
              isUnread={assignment.isUnread}
              onView={() => handleViewAssignment(assignment.id)}
            />
          ))}
        </div>
        
        {/* See more button - only if there are more than 3 assignments */}
        {regularAssignments.length > 3 && (
          <div className="flex justify-end mt-4">
            <Button 
              variant="link" 
              className="text-blue-600 font-medium"
              onClick={() => setShowAllAssignments(!showAllAssignments)}
            >
              {showAllAssignments ? 'Show less' : 'See more'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
