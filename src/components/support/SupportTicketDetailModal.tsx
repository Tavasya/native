import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupportTicket } from '@/features/support/types';

interface SupportTicketDetailModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
}) => {
  if (!ticket) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug_report':
        return 'bg-red-100 text-red-800';
      case 'feedback':
        return 'bg-blue-100 text-blue-800';
      case 'feature_request':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'bug_report':
        return 'Bug Report';
      case 'feedback':
        return 'Feedback';
      case 'feature_request':
        return 'Feature Request';
      default:
        return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Support Ticket Details</DialogTitle>
          <DialogDescription>
            View detailed information about this support ticket including user details and description.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {ticket.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>ID: {ticket.id}</span>
                <span>•</span>
                <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                {ticket.updated_at !== ticket.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">Category:</span>
              <Badge className={getCategoryColor(ticket.category)}>
                {getCategoryLabel(ticket.category)}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Screenshot */}
          {ticket.screenshot_url && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Page Screenshot</h4>
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <img 
                  src={ticket.screenshot_url} 
                  alt="Page screenshot when ticket was created" 
                  className="w-full rounded shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(ticket.screenshot_url, '_blank')}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Click to view full size • Page: {ticket.current_page || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">User Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-sm text-gray-900">{ticket.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="text-sm text-gray-900">{ticket.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Role:</span>
                <span className="text-sm text-gray-900 capitalize">{ticket.user?.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};