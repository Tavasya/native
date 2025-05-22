import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionsByAssignmentAndStudent } from '@/features/submissions/submissionThunks';
import { supabase } from '@/integrations/supabase/client';

interface CompletedAssignment {
  id: string;
  title: string;
  grade: string | 'Pending';
  completedDate: string;
}

interface CompletedAssignmentsGroup {
  title: string;
  assignments: CompletedAssignment[];
}

const CompletedAssignments: React.FC = () => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupedAssignments, setGroupedAssignments] = useState<CompletedAssignmentsGroup[]>([]);
  
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

  useEffect(() => {
    console.log('Debug - All submissions:', submissions);
    console.log('Debug - All assignments:', assignments);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('Debug - Time thresholds:', {
      now: now.toISOString(),
      twentyFourHoursAgo: twentyFourHoursAgo.toISOString(),
      oneWeekAgo: oneWeekAgo.toISOString(),
      oneMonthAgo: oneMonthAgo.toISOString()
    });

    const groups: CompletedAssignmentsGroup[] = [
      { title: "24 hrs ago", assignments: [] },
      { title: "1 week ago", assignments: [] },
      { title: "1 month ago", assignments: [] }
    ];

    // Filter for graded or pending submissions
    const completedSubmissions = submissions.filter(submission => {
      console.log('Debug - Checking submission:', {
        id: submission.id,
        status: submission.status,
        submitted_at: submission.submitted_at,
        grade: submission.grade
      });
      return submission.status === 'graded' || submission.status === 'pending';
    });

    console.log('Debug - Filtered completed submissions:', completedSubmissions);

    completedSubmissions.forEach(submission => {
      const submissionDate = new Date(submission.submitted_at);
      // Find the corresponding assignment
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      
      console.log('Debug - Processing submission:', {
        submissionId: submission.id,
        submissionDate: submissionDate.toISOString(),
        assignmentFound: !!assignment,
        assignmentTitle: assignment?.title
      });
      
      const completedAssignment: CompletedAssignment = {
        id: submission.id,
        title: assignment ? assignment.title : `Assignment Attempt ${submission.attempt}`,
        grade: submission.grade !== undefined && submission.grade !== null 
          ? submission.grade.toString() 
          : 'Pending',
        completedDate: submissionDate.toLocaleDateString()
      };

      if (submissionDate >= twentyFourHoursAgo) {
        console.log('Debug - Adding to 24hrs ago:', completedAssignment);
        groups[0].assignments.push(completedAssignment);
      } else if (submissionDate >= oneWeekAgo) {
        console.log('Debug - Adding to 1 week ago:', completedAssignment);
        groups[1].assignments.push(completedAssignment);
      } else if (submissionDate >= oneMonthAgo) {
        console.log('Debug - Adding to 1 month ago:', completedAssignment);
        groups[2].assignments.push(completedAssignment);
      } else {
        console.log('Debug - Submission too old:', completedAssignment);
      }
    });

    // Filter out empty groups and sort assignments by date (newest first)
    const filteredGroups = groups
      .filter(group => group.assignments.length > 0)
      .map(group => ({
        ...group,
        assignments: group.assignments.sort((a, b) => 
          new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
        )
      }));

    console.log('Debug - Final grouped assignments:', filteredGroups);

    setGroupedAssignments(filteredGroups);
  }, [submissions, assignments]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <div className="mb-8">
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-100">
          <CardTitle className="text-lg">Completed Assignments</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {groupedAssignments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No completed assignments yet
            </div>
          ) : (
            groupedAssignments.map((group) => (
              <div key={group.title} className="border-t border-gray-200">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleGroup(group.title)}
                >
                  <div className="flex items-center">
                    <h3 className="text-md font-medium text-gray-700">
                      {group.title}
                    </h3>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedGroups[group.title] ? 'transform rotate-180' : ''
                    }`} 
                  />
                </div>
                
                {expandedGroups[group.title] && (
                  <div className="p-4 pt-0 pl-8 space-y-3">
                    {group.assignments.map(assignment => (
                      <div key={assignment.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-gray-500">Completed on {assignment.completedDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${
                            assignment.grade === 'Pending' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {assignment.grade}
                          </span>
                          <Button variant="link" size="sm" className="block text-[#272A69]">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedAssignments;
