import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClassStatsByTeacher } from '@/features/class/classThunks';

const Layout: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign-up';

  // Fetch initial data when the app loads
  useEffect(() => {
    if (user && user.role === 'teacher') {
      dispatch(fetchClassStatsByTeacher(user.id));
    }
  }, [user, dispatch]);

  return (
    <div>
      {!isAuthPage && <NavBar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 