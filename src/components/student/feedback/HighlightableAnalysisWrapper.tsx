import React, { useState, memo } from 'react';
import { useTextHighlighting } from '@/hooks/feedback/useTextHighlighting';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightableContent } from './HighlightableContent';

interface HighlightableAnalysisWrapperProps {
  children: React.ReactNode;
  submissionId: string;
  questionIndex: number;
  section: 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation' | 'overall';
  className?: string;
  isActive?: boolean; // Only render highlighting for active tab
}

export const HighlightableAnalysisWrapper: React.FC<HighlightableAnalysisWrapperProps> = memo(({
  children,
  submissionId,
  questionIndex,
  section,
  className,
  isActive = true,
}) => {
  const [hasSelection, setHasSelection] = useState(false);
  
  // Always call the hook to avoid hooks violation - but pass isActive to control behavior
  const {
    containerRef,
    activeColor,
    availableColors,
    createHighlight,
    setActiveColor,
    selectionPosition,
  } = useTextHighlighting(submissionId, questionIndex, section, isActive);

  if (!isActive) {
    // Return basic content without highlighting for inactive tabs
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="space-y-3">
      <HighlightToolbar
        activeColor={activeColor}
        availableColors={availableColors}
        hasSelection={hasSelection}
        onColorChange={setActiveColor}
        onCreateHighlight={() => createHighlight()}
        onCreateHighlightWithComment={() => createHighlight()}
        selectionPosition={selectionPosition}
      />
      
      <HighlightableContent
        ref={containerRef}
        onSelectionChange={setHasSelection}
        className={className}
      >
        {children}
      </HighlightableContent>
    </div>
  );
});

HighlightableAnalysisWrapper.displayName = 'HighlightableAnalysisWrapper';

export default HighlightableAnalysisWrapper;