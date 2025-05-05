
import React from 'react';
import { Button } from './ui/button';
import { Check, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface VocabPosition {
  sentence: number;
  word: string;
  occurrence: number;
}

interface VocabIssue {
  id: string;
  type: 'basic' | 'advanced' | 'academic' | 'technical' | 'formal' | 'informal' | 'precise' | 'idiomatic';
  position: VocabPosition;
  suggestion: string;
  explanation: string;
}

interface VocabSuggestionProps {
  issue: VocabIssue;
  originalText: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const VocabSuggestion = ({ 
  issue, 
  originalText, 
  onAccept, 
  onDismiss 
}: VocabSuggestionProps) => {
  // Get styling details based on issue type
  const getTypeDetails = () => {
    switch (issue.type) {
      case 'basic':
        return { 
          label: 'Basic Vocabulary', 
          color: 'bg-blue-100 text-blue-800', 
          borderColor: 'border-blue-300'
        };
      case 'advanced':
        return { 
          label: 'Advanced Vocabulary', 
          color: 'bg-purple-100 text-purple-800', 
          borderColor: 'border-purple-300'
        };
      case 'academic':
        return { 
          label: 'Academic Term', 
          color: 'bg-amber-100 text-amber-800', 
          borderColor: 'border-amber-300'
        };
      case 'technical':
        return { 
          label: 'Technical Term', 
          color: 'bg-emerald-100 text-emerald-800', 
          borderColor: 'border-emerald-300'
        };
      case 'formal':
        return { 
          label: 'Formal Language', 
          color: 'bg-indigo-100 text-indigo-800', 
          borderColor: 'border-indigo-300'
        };
      case 'informal':
        return { 
          label: 'Informal Language', 
          color: 'bg-orange-100 text-orange-800', 
          borderColor: 'border-orange-300'
        };
      case 'precise':
        return { 
          label: 'Word Precision', 
          color: 'bg-cyan-100 text-cyan-800', 
          borderColor: 'border-cyan-300'
        };
      case 'idiomatic':
        return { 
          label: 'Idiomatic Expression', 
          color: 'bg-rose-100 text-rose-800', 
          borderColor: 'border-rose-300'
        };
      default:
        return { 
          label: 'Vocabulary', 
          color: 'bg-gray-100 text-gray-800', 
          borderColor: 'border-gray-300'
        };
    }
  };
  
  const typeDetails = getTypeDetails();
  
  return (
    <Card 
      id={`issue-${issue.id}`}
      className={`border-l-4 ${typeDetails.borderColor} hover:shadow-md transition-shadow duration-200 mb-5`}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeDetails.color}`}>
            {typeDetails.label}
          </span>
        </div>
        
        <div className="mb-3 space-y-2.5">
          <div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <span className="text-gray-500 line-through">{originalText}</span>
              <span className="text-xs">→</span>
              <span className="font-medium">{issue.suggestion.split(' → ')[1] || issue.suggestion}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{issue.explanation}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDismiss}
            className="h-9 px-4"
          >
            <X className="mr-2 h-4 w-4" />
            Ignore
          </Button>
          <Button 
            size="sm" 
            onClick={onAccept}
            className="h-9 px-4 bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
