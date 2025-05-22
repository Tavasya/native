import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { joinClass, fetchClasses } from '@/features/class/classThunks';

const JoinClass: React.FC = () => {
  const [classCode, setClassCode] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { classes, loading } = useAppSelector(state => state.classes);

  // Check if user already has classes
  useEffect(() => {
    if (classes.length > 0) {
      navigate('/student/dashboard');
    }
  }, [classes, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await dispatch(joinClass({ studentId: user.id, classCode })).unwrap();
      // Fetch updated classes list after joining
      await dispatch(fetchClasses({ role: 'student', userId: user.id })).unwrap();
      
      toast({
        title: "Success",
        description: "You have successfully joined the class!",
      });
      navigate('/student/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join class",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6 flex items-center justify-center -mt-16">
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Join a Class</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class Code</label>
              <div className="mt-1 bg-gray-50 px-4 py-3 rounded-md">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full border-none text-base font-normal p-0 bg-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 placeholder:font-normal"
                  placeholder="Enter class code"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#272A69] border border-transparent rounded-md hover:bg-[#272A69]/90"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Class'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default JoinClass; 