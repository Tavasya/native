import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';

const Layout: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign-up';

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