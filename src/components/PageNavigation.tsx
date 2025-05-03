
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
}

const PageNavigation = ({ currentPage, totalPages, onNext, onPrev }: PageNavigationProps) => {
  const pageLabels = ['Overview', 'Pronunciation', 'Fluency', 'Grammar', 'Vocabulary'];
  
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-center gap-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div 
              className={cn(
                "page-indicator transition-all duration-300", 
                currentPage === i && "active"
              )} 
            />
            <span className={cn(
              "text-xs mt-1 transition-colors",
              currentPage === i ? "text-brand-blue font-medium" : "text-gray-400"
            )}>
              {pageLabels[i]}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between w-full">
        <button 
          onClick={onPrev}
          disabled={currentPage === 0} 
          className={cn(
            "rounded-full p-2 bg-gray-100 transition-opacity", 
            currentPage === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <button 
          onClick={onNext} 
          disabled={currentPage === totalPages - 1}
          className={cn(
            "rounded-full p-2 bg-gray-100 transition-opacity",
            currentPage === totalPages - 1 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default PageNavigation;
