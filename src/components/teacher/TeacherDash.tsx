// src/components/TeacherDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchClasses, createClass, deleteClass } from '@/features/class/classThunks';
import { useToast } from '@/hooks/use-toast';
import ClassTableActions from './ClassTableActions';
import ClassTable, { ClassData } from './ClassTable';

export default function TeacherDashboard() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { classes: classModels, classStats, loading, createClassLoading } = useAppSelector(state => state.classes);
  const { toast } = useToast();

  // Modal state + form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // Fetch on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
    }
  }, [user, dispatch]);

  // Helpers
  const generateCode = useCallback((len = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
      // refresh
      dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
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
        dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
      }
    } catch {
      toast({ title: 'Error', description: 'Could not delete.' });
    }
  };

  // Table data mapping
  const tableData: ClassData[] = classModels.map(cls => {
    const stats = classStats.find(s => s.id === cls.id);
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

  // Refresh / Add Class buttons
  const handleRefresh = () => {
    if (user) dispatch(fetchClasses({ role: 'teacher', userId: user.id }));
  };
  const handleAddClick = () => setIsModalOpen(true);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <ClassTableActions
          onAddClass={handleAddClick}
          onRefresh={handleRefresh}
        />

        {loading
          ? <div className="text-center py-12 text-gray-500">Loading classes…</div>
          : <ClassTable
              classes={tableData}
              onDelete={handleDelete}
            />
        }
      </main>

      {/* Create Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  disabled={createClassLoading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createClassLoading}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClassLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createClassLoading ? 'Creating…' : 'Create'}
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
