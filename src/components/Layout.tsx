import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClassStatsByTeacher } from '@/features/class/classThunks';
import styled from 'styled-components';
import { Toaster } from "@/components/ui/toaster";

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  transition: opacity 0.3s ease-in-out;
`;

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
    </LayoutContainer>
  );
};

export default Layout; 