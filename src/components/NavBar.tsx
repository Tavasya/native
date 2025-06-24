// src/components/DashboardHeader.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Play, X } from 'lucide-react';
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
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

  const handleHelpClick = () => {
    setIsVideoModalOpen(true);
    setMenuOpen(false);
  };

  /* ----------------------------------------------------- render ---- */
  return (
    <>
      <header className="bg-white border-b border-gray-200 py-4 relative z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">

          {/* ----------------------------------------------------------------
             *  LEFT — brand + nav links
             * ---------------------------------------------------------------- */}
          <div className="flex items-end gap-6">
            <h1 className="text-xl font-semibold text-gray-900">
              <img src={NativeLogo} alt="Native" className="h-6" />
            </h1>

            {user && role === 'teacher' && (
              <nav className="hidden md:flex items-center gap-4 text-sm font-bold text-[#272A69]">
                <Link 
                  to="/teacher/dashboard" 
                  className="hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  Classes
                </Link>
                <Link 
                  to="/teacher/library" 
                  className="hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  Library
                </Link>
              </nav>
            )}

            {user && role === 'student' && (
              <nav className="hidden md:flex items-center gap-4 text-sm font-bold text-[#272A69]">
                <Link 
                  to="/student/dashboard" 
                  className="hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  Student Dashboard
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
          
               <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg z-10">
                
                  {/* Help Video Button - Only for Teachers */}
                  {role === 'teacher' && (
                    <button
                      onClick={handleHelpClick}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Play className="h-4 w-4" />
                      Watch Help Video
                    </button>
                  )}
                  
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

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Help Video</DialogTitle>
            <DialogDescription>
              Instructional video to help you get started with the platform
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              onClick={() => setIsVideoModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <video
              controls
              className="w-full h-auto rounded-lg"
              src="/welcome.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
