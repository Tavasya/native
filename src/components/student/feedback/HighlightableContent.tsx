import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface HighlightableContentProps {
  children: React.ReactNode;
  className?: string;
  onSelectionChange?: (hasSelection: boolean) => void;
}

export const HighlightableContent = forwardRef<HTMLDivElement, HighlightableContentProps>(
  ({ children, className, onSelectionChange }, ref) => {
    const handleMouseUp = () => {
      if (!onSelectionChange) return;
      const selection = window.getSelection();
      const hasSelection = !!(selection && selection.toString().trim());
      onSelectionChange(hasSelection);
    };

    const handleMouseDown = () => {
      if (!onSelectionChange) return;
      // Clear previous selection state
      onSelectionChange(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative select-text cursor-text",
          "prose prose-sm max-w-none",
          "[&_.text-highlight]:rounded-sm [&_.text-highlight]:px-1 [&_.text-highlight]:py-0.5",
          "[&_.text-highlight]:transition-all [&_.text-highlight]:duration-200",
          "[&_.text-highlight:hover]:shadow-sm [&_.text-highlight:hover]:scale-105",
          className
        )}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
        }}
      >
        {children}
      </div>
    );
  }
);

HighlightableContent.displayName = 'HighlightableContent';

export default HighlightableContent;