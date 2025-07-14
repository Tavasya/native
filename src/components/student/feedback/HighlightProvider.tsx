import React, { createContext, useContext, ReactNode } from 'react';
import { useTextHighlighting } from '@/hooks/feedback/useTextHighlighting';

interface HighlightContextType {
  submissionId: string;
  questionIndex: number;
  activeSection: 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation' | 'overall';
}

const HighlightContext = createContext<HighlightContextType | null>(null);

interface HighlightProviderProps {
  children: ReactNode;
  submissionId: string;
  questionIndex: number;
  activeSection: 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation' | 'overall';
}

export const HighlightProvider: React.FC<HighlightProviderProps> = ({
  children,
  submissionId,
  questionIndex,
  activeSection,
}) => {
  const contextValue: HighlightContextType = {
    submissionId,
    questionIndex,
    activeSection,
  };

  return (
    <HighlightContext.Provider value={contextValue}>
      {children}
    </HighlightContext.Provider>
  );
};

export const useHighlightContext = () => {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error('useHighlightContext must be used within a HighlightProvider');
  }
  return context;
};

export default HighlightProvider;