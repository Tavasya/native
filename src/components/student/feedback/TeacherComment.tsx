// components/student/feedback/TeacherComment.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TeacherCommentProps {
  comment: string;
  isEditing: boolean;
  isAwaitingReview: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCommentChange: (value: string) => void;
}

const TeacherComment: React.FC<TeacherCommentProps> = ({
  comment,
  isEditing,
  isAwaitingReview,
  onEdit,
  onSave,
  onCancel,
  onCommentChange
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Teacher's Comment</h3>
        {isAwaitingReview && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={onSave}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
      <Separator className="my-4" />
      {isEditing ? (
        <div className={cn(
          "bg-gray-50 rounded-md transition-all duration-200"
        )}>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Enter your feedback for the student..."
            className="border-none text-base font-medium bg-transparent min-h-[100px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md"
          />
        </div>
      ) : (
        <div className="min-h-[100px] p-3">
          {comment || (
            <span className="text-gray-500 italic">No comment provided</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherComment;