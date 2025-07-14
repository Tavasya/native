import React from 'react';
import { Button } from '@/components/ui/button';

interface HighlightToolbarProps {
  activeColor: string;
  availableColors: string[];
  hasSelection: boolean;
  onColorChange: (color: string) => void;
  onCreateHighlight: () => void;
  onCreateHighlightWithComment: () => void;
  selectionPosition?: { x: number; y: number } | null;
}

export const HighlightToolbar: React.FC<HighlightToolbarProps> = ({
  activeColor,
  hasSelection,
  onCreateHighlight,
  selectionPosition,
}) => {
  if (!hasSelection || !selectionPosition) return null;

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2"
      style={{
        left: selectionPosition.x,
        top: selectionPosition.y - 50,
        transform: 'translateX(-50%)'
      }}
    >
      <Button
        size="sm"
        onClick={onCreateHighlight}
        className="text-xs px-3 py-1"
        style={{ backgroundColor: activeColor }}
      >
        Highlight
      </Button>
    </div>
  );
};

export default HighlightToolbar;