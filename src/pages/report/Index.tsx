import React, { useState } from 'react';
import OverviewPage from '@/pages/report/OverviewPage';
import PronunciationPage from '@/pages/report/PronunciationPage';
import FluencyPage from '@/pages/report/FluencyPage';
import GrammarPage from '@/pages/report/GrammarPage';
import VocabularyPage from '@/pages/report/VocabularyPage';

const Index = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 5; 
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
    
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl p-8 shadow-sm relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
            }`}
          >
          
          Next
          </button>
        </div>
        
        {/* Main content */}
        {currentPage === 0 && <OverviewPage />}
        {currentPage === 1 && <PronunciationPage />}
        {currentPage === 2 && <FluencyPage />}
        {currentPage === 3 && <GrammarPage />}
        {currentPage === 4 && <VocabularyPage />}
      </div>
    </div>
  );
};

export default Index;
