import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useNavigate } from "react-router-dom";
import { useAppSelector } from '@/app/hooks';
import NativeLogo from '@/lib/images/Native Logo.png';

interface NavBarProps {
  hideNavItems?: boolean;
}

const NavBar = ({ hideNavItems = false }: NavBarProps) => {
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleDashboardClick = () => {
    if (role) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return <header className="py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img src={NativeLogo} alt="Native" className="h-6" />
          </a>
        </div>

        {!hideNavItems && (
          <nav className="hidden md:flex items-center gap-8">
            <NavLink onClick={() => scrollToSection('features')}>Features</NavLink>
            <NavLink onClick={() => scrollToSection('value')}>How Native Works</NavLink>
            <NavLink onClick={() => scrollToSection('testimonials')}>Testimonials</NavLink>
            <NavLink onClick={() => scrollToSection('faq')}>FAQ</NavLink>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <Button
              onClick={handleDashboardClick}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-brand-primary hover:text-brand-primary/90 hover:bg-transparent"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/sign-up')}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>;
};

interface NavLinkProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const NavLink = ({
  onClick,
  children,
  className
}: NavLinkProps) => (
  <button 
    onClick={onClick} 
    className={cn("text-brand-text hover:text-brand-primary transition-colors font-medium text-sm bg-transparent border-none cursor-pointer", className)}
  >
    {children}
  </button>
);

export default NavBar;