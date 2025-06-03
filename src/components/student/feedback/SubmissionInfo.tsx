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
  onScoreChange: (field: keyof AverageScores, value: number) => void;
  teacherComment: string;
  isEditingComment: boolean;
  onEditComment: () => void;
  onSaveComment: () => void;
  onCancelComment: () => void;
  onCommentChange: (value: string) => void;
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
}) => {
  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{assignmentTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
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
          scores={averageScores}
          tempScores={tempScores}
          isEditing={isEditingOverall}
          canEdit={canEdit}
          onEdit={onEditOverall}
          onSave={onSaveOverall}
          onCancel={onCancelOverall}
          onScoreChange={onScoreChange}
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