import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import OverallScoring from '@/components/student/feedback/OverallScoring';
import TeacherComment from '@/components/student/feedback/TeacherComment';
import { AverageScores } from '@/types/feedback';

interface SubmissionInfoProps {
  assignmentTitle: string;
  studentName: string;
  submittedAt: string;
  averageScores: AverageScores;
  tempScores: AverageScores;
  isEditingOverall: boolean;
  canEdit: boolean;
  onEditOverall: () => void;
  onSaveOverall: () => void;
  onCancelOverall: () => void;
  onScoreChange: (field: keyof AverageScores, value: number | null) => void;
  teacherComment: string;
  isEditingComment: boolean;
  onEditComment: () => void;
  onSaveComment: () => void;
  onCancelComment: () => void;
  onCommentChange: (value: string) => void;
  isAutoGradeEnabled?: boolean;
  isTest?: boolean;
  grade?: number | null;
  audioUrl?: string;
}

const SubmissionInfo: React.FC<SubmissionInfoProps> = ({
  assignmentTitle,
  studentName,
  submittedAt,
  averageScores,
  tempScores,
  isEditingOverall,
  canEdit,
  onEditOverall,
  onSaveOverall,
  onCancelOverall,
  onScoreChange,
  teacherComment,
  isEditingComment,
  onEditComment,
  onSaveComment,
  onCancelComment,
  onCommentChange,
  isAutoGradeEnabled = true,
  isTest = false,
  grade,
  audioUrl,
}) => {
  // Create scores object with grade included
  const scoresWithGrade = {
    ...averageScores,
    overall_grade: grade
  };

  const tempScoresWithGrade = {
    ...tempScores,
    overall_grade: grade
  };

  return (
    <Card className="shadow-sm border-0 bg-white dark:bg-dark-card">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assignmentTitle}</h1>
            {audioUrl && (
              <a
                href={audioUrl}
                download={`${assignmentTitle}_${studentName}_audio.webm`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition-colors duration-200"
              >
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download audio file
              </a>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Submitted by {studentName} on {new Date(submittedAt || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <OverallScoring
          scores={scoresWithGrade}
          tempScores={tempScoresWithGrade}
          isEditing={isEditingOverall}
          canEdit={canEdit}
          onEdit={onEditOverall}
          onSave={onSaveOverall}
          onCancel={onCancelOverall}
          onScoreChange={onScoreChange}
          isAutoGradeEnabled={isAutoGradeEnabled}
          isTest={isTest}
        />

        <TeacherComment
          comment={teacherComment}
          isEditing={isEditingComment}
          isAwaitingReview={canEdit}
          onEdit={onEditComment}
          onSave={onSaveComment}
          onCancel={onCancelComment}
          onCommentChange={onCommentChange}
        />
      </CardContent>
    </Card>
  );
};

export default SubmissionInfo;