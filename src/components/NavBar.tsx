// src/components/DashboardHeader.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signOut } from '@/features/auth/authThunks';

const Navbar: React.FC = () => {
  /* ------------------------------------------------------ hooks ---- */
  const { user, role } = useAppSelector((s) => s.auth);   // <-- from Redux
  const dispatch        = useAppDispatch();
  const navigate        = useNavigate();

  /* ------------------------------------------------ local state ---- */
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '';

  /* -------------------------------------------- event handlers ---- */
  const toggleMenu  = () => setMenuOpen((o) => !o);
  const handleLogout = async () => {
    await signOut(dispatch);
    navigate('/login');
  };

  /* ----------------------------------------------------- render ---- */
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">

        {/* ----------------------------------------------------------------
           *  LEFT — brand + nav links
           * ---------------------------------------------------------------- */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Native
          </h1>

          {user && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-700">
            <Link to={`/${role}/dashboard`} className="hover:text-gray-900">
  {role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
</Link>
            </nav>
          )}
        </div>

        {/* ----------------------------------------------------------------
           *  RIGHT — avatar + dropdown
           * ---------------------------------------------------------------- */}
        {user && (
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center space-x-2 select-none focus:outline-none"
            >
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.name}
              </span>

              <Avatar className="h-9 w-9">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-blue-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            {menuOpen && (
        
             <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg z-10">
          
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Log&nbsp;out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
