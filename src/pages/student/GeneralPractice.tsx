import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

const GeneralPractice: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Redirect to student dashboard since practice is now assignment-specific
    if (!user) {
      navigate('/auth/login');
      return;
    }

    // Redirect to dashboard where they can access assignments and practice specific questions
    navigate('/student/dashboard');
  }, [user, navigate]);

  return null;
};

export default GeneralPractice; 