// src/components/TeacherDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchClasses, createClass, deleteClass, fetchClassStatsByTeacher } from '@/features/class/classThunks';
import { fetchTeacherSubscription } from '@/features/subscriptions/subscriptionThunks';
import { useToast } from '@/hooks/use-toast';
import ClassTableActions from './ClassTableActions';
import ClassTable, { ClassData } from './ClassTable';

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { classes: classModels, classStats, loading, createClassLoading, statsLoading } = useAppSelector(state => state.classes);
  const { subscription, loading: subscriptionLoading } = useAppSelector(state => state.subscriptions);
  const { toast } = useToast();

  // Modal state + form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // Fetch on mount
  useEffect(() => {
    if (user) {
      Promise.all([
        dispatch(fetchClasses({ role: 'teacher', userId: user.id })),
        dispatch(fetchClassStatsByTeacher(user.id)),
        dispatch(fetchTeacherSubscription(user.id))
      ]);
    }
  }, [user, dispatch]);

  // Helpers
  const generateCode = useCallback((len = 6) => {
    // Using only characters that are clearly distinguishable in most fonts
    // Excluded: 0, O, 1, I, l, 5, S, 8, B, Z, 2
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3479';
    return Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }, []);

  // Create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const class_code = generateCode();
    try {
      await dispatch(createClass({ name: newName, teacher_id: user.id, class_code })).unwrap();
      toast({ title: 'Class created', description: `"${newName}" has been created.` });
      setNewName('');
      setIsModalOpen(false);
      // refresh both data sources
      Promise.all([
        dispatch(fetchClasses({ role: 'teacher', userId: user.id })),
        dispatch(fetchClassStatsByTeacher(user.id))
      ]);
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message });
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      if (user) {
        await dispatch(deleteClass(id)).unwrap();
        toast({ title: 'Deleted', description: 'Class removed.' });
        // refresh both data sources
        Promise.all([
          dispatch(fetchClasses({ role: 'teacher', userId: user.id })),
          dispatch(fetchClassStatsByTeacher(user.id))
        ]);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not delete.' });
    }
  };

  // Table data mapping
  const tableData: ClassData[] = classModels.map(cls => {
    const stats = classStats.find(s => s.id === cls.id);
    console.log('TeacherDash - Class data:', { id: cls.id, name: cls.name, stats });
    return {
      id: cls.id,
      name: cls.name,
      code: cls.class_code,
      students: stats?.student_count ?? 0,
      assignments: stats?.assignment_count ?? 0,
      avgGrade: stats?.avg_grade != null
        ? `${(stats.avg_grade * 100).toFixed(2)}%`
        : null,
    };
  });

  const handleAddClick = () => {
    console.log('TeacherDash - Opening create class modal');

    // Don't block if subscription is still loading
    if (subscriptionLoading) {
      setIsModalOpen(true);
      return;
    }

    // Check if user has an active subscription
    if (!subscription || subscription.status !== 'active') {
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to create classes. Redirecting to billing...',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/teacher/subscriptions'), 1500);
      return;
    }

    setIsModalOpen(true);
  };

  if (loading || statsLoading) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <ClassTableActions
          onAddClass={handleAddClick}
        />

        <ClassTable
          classes={tableData}
          onDelete={handleDelete}
        />
      </main>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <div className="mt-1 bg-gray-50 px-4 py-3 rounded-md">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    disabled={createClassLoading}
                    className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal"
                    placeholder="e.g. IELTS Speaking Class"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={createClassLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#272A69] border border-transparent rounded-md hover:bg-[#272A69]/90"
                  disabled={createClassLoading}
                >
                  {createClassLoading ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Teacher Dashboard. All rights reserved.
      </footer>
    </div>
  );
}
