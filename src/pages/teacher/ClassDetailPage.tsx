
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useToast } from '@/hooks/use-toast';
import ClassDetail from '@/components/teacher/ClassDetail';
import { isAdmin } from '@/utils/adminUtils';

const ClassDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useAppSelector(state => state.subscriptions);
  const { user } = useAppSelector(state => state.auth);
  const { toast } = useToast();

  // Check if user is admin (can bypass subscription check)
  const userIsAdmin = isAdmin(user);

  // Check subscription on mount (but only after loading completes)
  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Admins can bypass subscription check
    if (userIsAdmin) return;

    if (!subscription || subscription.status !== 'active') {
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to access classes. Redirecting to billing...',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/teacher/subscriptions'), 1500);
    }
  }, [subscription, loading, navigate, toast, userIsAdmin]);

  // If no active subscription AND not loading AND not admin, don't render the component
  if (!loading && !userIsAdmin && (!subscription || subscription.status !== 'active')) {
    return null;
  }

  const handleBack = () => {
    navigate('/teacher/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        <ClassDetail onBack={handleBack} />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Teacher Dashboard. All rights reserved.
      </footer>
    </div>
  );
};

export default ClassDetailPage;
