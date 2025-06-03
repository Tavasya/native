import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();

  return <header className="py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center font-display text-xl font-bold">
            <span className="text-brand-primary">Native</span>
            <span className="text-brand-primary"> Speaking</span>
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#testimonials">Testimonials</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </nav>

        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>;
};

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const NavLink = ({
  href,
  children,
  className
}: NavLinkProps) => <a href={href} className={cn("text-brand-text hover:text-brand-primary transition-colors font-medium text-sm", className)}>
    {children}
  </a>;

export default NavBar;