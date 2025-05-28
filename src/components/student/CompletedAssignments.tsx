import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "../ui/button";
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionsByAssignmentAndStudent } from '@/features/submissions/submissionThunks';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SubmissionStatus } from '@/features/submissions/types';
import { ArrowRight } from "lucide-react";

interface CompletedAssignment {
  id: string;
  title: string;
  grade: string | 'Pending';
  completedDate: string;
  status: SubmissionStatus;
}

const CompletedAssignments: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const submissions = useAppSelector(state => state.submissions.submissions);
  const assignments = useAppSelector(state => state.assignments.assignments);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch submissions for each assignment
        for (const assignment of assignments) {
          await dispatch(fetchSubmissionsByAssignmentAndStudent({
            assignment_id: assignment.id,
            student_id: user.id
          }));
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      }
    };

    fetchSubmissions();
  }, [dispatch, assignments]);

  const handleViewSubmission = (submission: CompletedAssignment) => {
    if (submission.status === 'graded') {
      navigate(`/student/submission/${submission.id}/feedback`);
    } else if (submission.status === 'pending') {
      navigate(`/student/submission/${submission.id}/feedback`);
    } else {
      navigate(`/student/assignment/${submission.id}/practice`);
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'graded':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: SubmissionStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'graded':
        return 'Graded';
      default:
        return status;
    }
  };

  // Filter and sort submissions
  const completedSubmissions = submissions
    .filter(submission => ['pending', 'graded'].includes(submission.status))
    .map(submission => {
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      return {
        id: submission.id,
        title: assignment ? assignment.title : `Assignment Attempt ${submission.attempt}`,
        grade: submission.grade !== undefined && submission.grade !== null 
          ? submission.grade.toString() 
          : 'Pending',
        completedDate: new Date(submission.submitted_at).toLocaleDateString(),
        status: submission.status
      };
    })
    .sort((a, b) => {
      // Sort by status priority: graded > pending
      const statusPriority: Record<SubmissionStatus, number> = {
        graded: 0,
        pending: 1,
        in_progress: 2,
        rejected: 3
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Completed Assignments</h2>
      
      {completedSubmissions.length === 0 ? (
        <div className="text-center text-gray-500">
          No completed assignments yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedSubmissions.map(assignment => (
            <Card 
              key={assignment.id}
              className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col rounded-lg"
            >
              <div className="p-5 bg-white flex flex-col h-full">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{assignment.title}</h3>
                <p className="text-xs font-medium text-gray-500 mb-2">Completed on {assignment.completedDate}</p>
                <span className={`text-sm font-semibold ${getStatusColor(assignment.status)} mb-4`}>
                  {getStatusText(assignment.status)}
                </span>
                
                <div className="mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium rounded-lg"
                    onClick={() => handleViewSubmission(assignment)}
                  >
                    {assignment.status === 'graded' ? 'View Feedback' : 'View'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedAssignments;
