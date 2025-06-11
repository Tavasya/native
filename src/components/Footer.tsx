
import React from 'react';
import { cn } from '@/lib/utils';

const Footer = () => {
  return (
    <footer className="bg-brand-secondary text-white pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="md:col-span-2">
            <div className="mb-4">
              <a href="/" className="flex items-center font-display text-2xl font-bold">
                <span className="text-white">Native</span>
                <span className="text-brand-primary">Speaking</span>
              </a>
            </div>
            <p className="text-white/70 mb-4 pr-8">
              Helping IELTS teachers save time and deliver personalized feedback with AI-powered speaking practice.
            </p>
            <div className="flex space-x-4">
              {["twitter", "facebook", "linkedin", "instagram"].map((social) => (
                <a key={social} href="#" className="text-white/70 hover:text-white">
                  <span className="sr-only">{social}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10z" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Product</h4>
            <ul className="space-y-2">
              {["Features", "How It Works", "Pricing", "FAQ", "Support"].map((item) => (
                <li key={item}>
                  <FooterLink href={`#${item.toLowerCase().replace(' ', '-')}`}>
                    {item}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              {["Careers", "Terms & Conditions", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <FooterLink href={
                    item === "Terms & Conditions" ? "/legal/terms-and-conditions" :
                    item === "Privacy Policy" ? "/legal/privacy-policy" : "#"
                  }>
                    {item}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm order-2 md:order-1">
            &copy; {new Date().getFullYear()} Native Speaking. All rights reserved.
          </p>
          <div className="flex space-x-4 mb-4 md:mb-0 order-1 md:order-2">
            <a href="#" className="text-white/60 hover:text-white text-sm">Terms</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Privacy</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const FooterLink = ({ href, children, className }: FooterLinkProps) => (
  <a 
    href={href} 
    className={cn(
      "text-white/70 hover:text-white transition-colors",
      className
    )}
  >
    {children}
  </a>
);

export default Footer;
