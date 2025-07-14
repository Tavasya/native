import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/app/hooks';
import { createSupportTicket } from '@/features/support/supportThunks';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as 'bug_report' | 'feedback' | ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    category: ''
  });

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      category: ''
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Subject is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dispatch(createSupportTicket({
        title: formData.title,
        description: formData.description,
        category: formData.category as 'bug_report' | 'feedback'
      })).unwrap();
      
      // Reset form and close modal
      setFormData({ title: '', description: '', category: '' });
      setErrors({ title: '', description: '', category: '' });
      onClose();
      
      // Trigger success callback
      onSuccess?.();
    } catch (error) {
      console.error('Error creating support ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Let us know how we can help you. We'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">What can we help you with?</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug_report">Report a Bug</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Subject</Label>
              <div className={`mt-1 bg-gray-50 px-4 py-3 rounded-md ${errors.title ? 'ring-2 ring-red-500' : ''}`}>
                <input
                  id="title"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal"
                />
              </div>
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className={`mt-1 bg-gray-50 px-4 py-3 rounded-md ${errors.description ? 'ring-2 ring-red-500' : ''}`}>
                <textarea
                  id="description"
                  placeholder="Please provide as much detail as possible..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal resize-none"
                />
              </div>
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
};