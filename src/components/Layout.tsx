import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClassStatsByTeacher } from '@/features/class/classThunks';
import styled from 'styled-components';
import { Toaster } from "@/components/ui/toaster";
import AssignmentPracticeModal from '@/components/assignment/AssignmentPracticeModal';
import PracticeSessionModal from '@/components/practice/PracticeSessionModal';
import PracticePart2Modal from '@/components/practice/PracticePart2Modal';
import { closePracticeSessionModal, selectPracticeSessionModal } from '@/features/practice/practiceSlice';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  transition: opacity 0.3s ease-in-out;
  padding-top: 64px; /* Account for fixed navbar height (py-4 + content) */
`;

// Redux-connected wrapper for PracticeSessionModal
const PracticeSessionModalWrapper: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, sessionId } = useAppSelector(selectPracticeSessionModal);

  const handleClose = () => {
    dispatch(closePracticeSessionModal());
  };

  // Only render the modal if we have a sessionId
  if (!sessionId) {
    return null;
  }

  return (
    <PracticeSessionModal
      isOpen={isOpen}
      onClose={handleClose}
      sessionId={sessionId}
    />
  );
};

const Layout: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector(state => state.auth);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign-up';

  // Fetch initial data when the app loads
  useEffect(() => {
    if (user && role === 'teacher') {
      dispatch(fetchClassStatsByTeacher(user.id));
    }
  }, [user, role, dispatch]);

  return (
    <LayoutContainer>
      {!isAuthPage && <NavBar />}
      <MainContent>
        <Outlet />
      </MainContent>
      <Toaster />
      <AssignmentPracticeModal />
      <PracticeSessionModalWrapper />
      <PracticePart2Modal />
    </LayoutContainer>
  );
};

export default Layout; 