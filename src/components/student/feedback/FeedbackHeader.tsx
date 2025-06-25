// components/student/feedback/FeedbackHeader.tsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface Submission {
  id: string;
  attempt: number;
  submitted_at: string;
  status: string;
}

interface FeedbackHeaderProps {
  assignmentTitle: string;
  submittedAt: string;
  studentName: string;
  isAwaitingReview: boolean;
  onBack: () => void;
  onSubmitAndSend: () => void;
  submissionId?: string;
  assignmentId?: string;
  studentId?: string;
  currentSubmission?: Submission;
  isStudent?: boolean;
  onRedo?: () => void;
  attempt?: number;
}

const FeedbackHeader: React.FC<FeedbackHeaderProps> = ({
  studentName,
  isAwaitingReview,
  onBack,
  onSubmitAndSend,
  assignmentId,
  studentId,
  currentSubmission,
  isStudent = false,
  onRedo,
  attempt
}) => {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      if (!assignmentId || !studentId || !isStudent) return;
      
      setLoading(true);
      try {
        const { submissionService } = await import('@/features/submissions/submissionsService');
        const submissions = await submissionService.getSubmissionsByAssignmentAndStudent(
          assignmentId,
          studentId
        );
        setAllSubmissions(submissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSubmissions();
  }, [assignmentId, studentId, isStudent]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewSubmission = (submissionId: string) => {
    // Find the submission to check its status
    const submission = allSubmissions.find(s => s.id === submissionId);
    
    if (submission?.status === 'in_progress') {
      // If in progress, go to practice page to continue recording
      window.location.href = `/student/assignment/${assignmentId}/practice`;
    } else {
      // If completed (pending, awaiting_review, graded), go to feedback page
      window.location.href = `/student/submission/${submissionId}/feedback`;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {attempt && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Attempt {attempt}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isStudent && allSubmissions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Redo Assignment
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Previous Attempts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allSubmissions.map((submission) => (
                <DropdownMenuItem
                  key={submission.id}
                  onClick={() => handleViewSubmission(submission.id)}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">
                      Attempt {submission.attempt}
                      {submission.status === 'in_progress' && ' (Continue)'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      submission.status === 'awaiting_review' ? 'bg-blue-100 text-blue-700' :
                      submission.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {submission.status === 'graded' ? 'Graded' :
                       submission.status === 'pending' ? 'Pending' :
                       submission.status === 'awaiting_review' ? 'Under Review' :
                       submission.status === 'in_progress' ? 'In Progress' :
                       submission.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(submission.submitted_at)}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRedo}
                className="text-blue-600 font-medium"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Attempt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isAwaitingReview && (
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={onSubmitAndSend}
          >
            Submit & Send to {studentName}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeedbackHeader;