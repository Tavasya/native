import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  updateHighlight, 
  removeHighlight, 
  hideCommentModal,
  selectHighlightById 
} from '@/features/highlights/highlightsSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MessageSquare } from 'lucide-react';

export const HighlightCommentModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showCommentModal, commentModalHighlightId } = useAppSelector(state => state.highlights);
  const highlight = useAppSelector(state => 
    commentModalHighlightId ? selectHighlightById(state, commentModalHighlightId) : null
  );
  
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (highlight) {
      setComment(highlight.comment || '');
    }
  }, [highlight]);

  const handleSave = () => {
    if (!highlight) return;
    
    dispatch(updateHighlight({
      id: highlight.id,
      updates: { comment: comment.trim() || undefined }
    }));
    
    dispatch(hideCommentModal());
  };

  const handleDelete = () => {
    if (!highlight) return;
    
    dispatch(removeHighlight(highlight.id));
    dispatch(hideCommentModal());
  };

  const handleClose = () => {
    dispatch(hideCommentModal());
  };

  if (!showCommentModal || !highlight) return null;

  return (
    <Dialog open={showCommentModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Highlight Comment
          </DialogTitle>
          <DialogDescription>
            Add or edit a comment for the selected highlighted text.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md border">
            <div className="text-sm text-gray-600 mb-1">Selected text:</div>
            <div 
              className="text-sm font-medium px-2 py-1 rounded"
              style={{ backgroundColor: highlight.color }}
            >
              "{highlight.text}"
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium text-gray-700">
              Comment (optional):
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your thoughts, notes, or observations about this highlight..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HighlightCommentModal;