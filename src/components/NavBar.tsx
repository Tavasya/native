// src/components/DashboardHeader.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { signOut } from '@/features/auth/authThunks';
import NativeLogo from '@/lib/images/Native Logo.png';

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
    <header className="bg-white border-b border-gray-200 py-4 relative z-50">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">

        {/* ----------------------------------------------------------------
           *  LEFT — brand + nav links
           * ---------------------------------------------------------------- */}
        <div className="flex items-end gap-6">
          <h1 className="text-xl font-semibold text-gray-900">
            <img src={NativeLogo} alt="Native" className="h-6" />
          </h1>

          {user && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-bold text-[#272A69]">
              <Link 
                to={`/${role}/dashboard`} 
                className="hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                onClick={() => setMenuOpen(false)}
              >
                {role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
              </Link>
            </nav>
          )}
        </div>

        {/* ----------------------------------------------------------------
           *  RIGHT — avatar + dropdown
           * ---------------------------------------------------------------- */}
        {user && (
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center space-x-2 select-none focus:outline-none"
            >
              <span className="hidden md:block text-sm font-medium text-[#272A69]">
                {user.name}
              </span>

              <Avatar className="h-9 w-9">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-[#EF5136] text-white">
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
