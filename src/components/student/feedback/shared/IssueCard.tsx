// components/student/feedback/shared/IssueCard.tsx

import React from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface IssueCardProps {
  title: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  children: React.ReactNode;
}

const IssueCard: React.FC<IssueCardProps> = ({
  title,
  index,
  isOpen,
  onToggle,
  onDelete,
  isEditing = false,
  children
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-700">{title} {index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="bg-white p-4 rounded border">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default IssueCard;