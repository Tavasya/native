import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/app/hooks';
import { createSupportTicket } from '@/features/support/supportThunks';
import { useLocation } from 'react-router-dom';
import { captureScreenshot } from '@/utils/screenshotCapture';
import { uploadScreenshotToSupabase } from '@/utils/screenshotUpload';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    description: '',
    category: '' as 'bug_report' | 'feedback' | 'feature_request' | ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [errors, setErrors] = useState({
    description: '',
    category: ''
  });

  // Capture screenshot when modal opens (but don't upload yet)
  useEffect(() => {
    if (isOpen && !screenshot) {
      const captureScreen = async () => {
        setIsCapturingScreenshot(true);
        console.log('🔍 Starting screenshot capture...');
        try {
          const screenshotData = await captureScreenshot();
          console.log('🔍 Screenshot captured:', screenshotData ? 'Success' : 'Failed');
          setScreenshot(screenshotData);
        } catch (error) {
          console.error('Failed to capture screenshot:', error);
        } finally {
          setIsCapturingScreenshot(false);
        }
      };
      
      // Small delay to ensure modal is fully hidden before capture
      setTimeout(captureScreen, 100);
    }
  }, [isOpen, screenshot]);

  const validateForm = () => {
    const newErrors = {
      description: '',
      category: ''
    };

    if (!formData.description.trim()) {
      newErrors.description = isEnglish ? 'Description is required' : 'Vui lòng nhập nội dung';
    }
    if (!formData.category) {
      newErrors.category = isEnglish ? 'Please select a category' : 'Vui lòng chọn hạng mục';
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
      // Upload screenshot only when submitting
      let finalScreenshotUrl = screenshotUrl;
      if (screenshot && !screenshotUrl) {
        setIsUploadingScreenshot(true);
        console.log('🔍 Uploading screenshot to Supabase...');
        finalScreenshotUrl = await uploadScreenshotToSupabase(screenshot);
        console.log('🔍 Screenshot uploaded:', finalScreenshotUrl ? 'Success' : 'Failed');
        setScreenshotUrl(finalScreenshotUrl);
        setIsUploadingScreenshot(false);
      }

      // Auto-generate title based on category
      const categoryTitles = {
        bug_report: isEnglish ? 'Bug Report' : 'Báo cáo lỗi',
        feedback: isEnglish ? 'Feedback' : 'Phản hồi',
        feature_request: isEnglish ? 'Feature Request' : 'Yêu cầu tính năng'
      };
      
      const title = categoryTitles[formData.category as keyof typeof categoryTitles] || 'Support Request';
      
      await dispatch(createSupportTicket({
        title: title,
        description: formData.description,
        category: formData.category as 'bug_report' | 'feedback' | 'feature_request',
        current_page: location.pathname,
        screenshot_url: finalScreenshotUrl || undefined
      })).unwrap();
      
      // Reset form and close modal
      setFormData({ description: '', category: '' });
      setErrors({ description: '', category: '' });
      setScreenshot(null); // Reset screenshot
      setScreenshotUrl(null); // Reset screenshot URL
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

  const content = {
    title: isEnglish ? 'Contact Support' : 'Liên hệ hỗ trợ',
    description: isEnglish 
      ? "Native will receive your feedback and contact you via email as soon as possible" 
      : "Native sẽ tiếp nhận phản hồi và liên hệ lại qua email trong thời gian sớm nhất",
    categoryLabel: isEnglish ? 'Select support category' : 'Chọn hạng mục hỗ trợ',
    categoryPlaceholder: isEnglish ? 'Select a category' : 'Chọn hạng mục',
    categories: {
      bug_report: isEnglish ? 'Report Technical Issue' : 'Báo cáo lỗi kĩ thuật',
      feedback: isEnglish ? 'Send Feedback' : 'Gửi phản hồi',
      feature_request: isEnglish ? 'Request for Feature' : 'Yêu cầu tính năng'
    },
    descriptionLabel: isEnglish ? 'Detailed Content' : 'Nội dung chi tiết',
    descriptionPlaceholder: isEnglish 
      ? 'Please provide specific information for Native!' 
      : 'Cung cấp thông tin cụ thể cho Native nhé!',
    cancel: isEnglish ? 'Cancel' : 'Huỷ phản hồi',
    submit: isEnglish ? 'Submit Feedback' : 'Gửi phản hồi',
    submitting: isEnglish ? 'Submitting...' : 'Đang gửi...'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{content.title}</DialogTitle>
            <button
              type="button"
              onClick={() => setIsEnglish(!isEnglish)}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 shrink-0"
            >
              {isEnglish ? 'VI' : 'EN'}
            </button>
          </div>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        {(isCapturingScreenshot || isUploadingScreenshot) && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
            <span className="text-sm text-gray-600">
              {isCapturingScreenshot 
                ? (isEnglish ? 'Capturing page screenshot...' : 'Đang chụp ảnh màn hình...')
                : (isEnglish ? 'Uploading screenshot...' : 'Đang tải lên ảnh chụp màn hình...')
              }
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">{content.categoryLabel}</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder={content.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug_report">{content.categories.bug_report}</SelectItem>
                  <SelectItem value="feedback">{content.categories.feedback}</SelectItem>
                  <SelectItem value="feature_request">{content.categories.feature_request}</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{content.descriptionLabel}</Label>
              <div className={`mt-1 bg-gray-50 px-4 py-3 rounded-md ${errors.description ? 'ring-2 ring-red-500' : ''}`}>
                <textarea
                  id="description"
                  placeholder={content.descriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal resize-none"
                />
              </div>
              {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            {screenshot && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  {isEnglish ? 'Page Screenshot Preview' : 'Xem trước ảnh chụp màn hình'}
                </label>
                <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                  <img 
                    src={screenshot} 
                    alt="Screenshot preview" 
                    className="w-full max-h-48 object-contain rounded cursor-pointer hover:opacity-90"
                    onClick={() => window.open(screenshot, '_blank')}
                    title={isEnglish ? 'Click to view full size' : 'Nhấp để xem kích thước đầy đủ'}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                {content.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? content.submitting : content.submit}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
};