
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClassDetail from '@/components/teacher/ClassDetail';

const ClassDetailPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
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
