import React from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  removeHighlight, 
  showCommentModal,
  selectHighlightsForQuestion 
} from '@/features/highlights/highlightsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, MessageSquare, Pen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HighlightsSidebarProps {
  submissionId: string;
  questionIndex: number;
  section?: string;
}

export const HighlightsSidebar: React.FC<HighlightsSidebarProps> = ({
  submissionId,
  questionIndex,
  section,
}) => {
  const dispatch = useAppDispatch();
  const highlights = useAppSelector(state => 
    selectHighlightsForQuestion(state, submissionId, questionIndex, section)
  );

  const handleDeleteHighlight = (highlightId: string) => {
    dispatch(removeHighlight(highlightId));
  };

  const handleEditComment = (highlightId: string) => {
    dispatch(showCommentModal(highlightId));
  };

  if (highlights.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pen className="w-4 h-4" />
            Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Pen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No highlights yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Select text and click highlight to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Pen className="w-4 h-4" />
          Highlights ({highlights.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="text-sm font-medium px-2 py-1 rounded text-black"
                    style={{ backgroundColor: highlight.color }}
                  >
                    "{highlight.text.length > 50 
                      ? highlight.text.substring(0, 50) + '...' 
                      : highlight.text}"
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {highlight.section}
                  </Badge>
                </div>
                
                {highlight.comment && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 border-l-4 border-blue-200">
                    {highlight.comment}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(highlight.createdAt).toLocaleDateString()} at{' '}
                    {new Date(highlight.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditComment(highlight.id)}
                      className="h-6 w-6 p-0"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteHighlight(highlight.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HighlightsSidebar;