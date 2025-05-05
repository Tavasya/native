
import React from 'react';
import { cn } from '@/lib/utils';

interface FluencyIssueCardProps {
  title: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  frequency: number;
  tips: string;
}

const FluencyIssueCard = ({ 
  title, 
  severity, 
  description, 
  frequency,
  tips
}: FluencyIssueCardProps) => {
  // Determine colors and labels based on severity
  const getSeverityDetails = () => {
    switch (severity) {
      case 'high':
        return { 
          color: 'bg-red-100 text-red-700', 
          border: 'border-red-200',
          label: 'High Priority' 
        };
      case 'medium':
        return { 
          color: 'bg-amber-100 text-amber-700', 
          border: 'border-amber-200',
          label: 'Medium' 
        };
      case 'low':
        return { 
          color: 'bg-green-100 text-green-700', 
          border: 'border-green-200',
          label: 'Low' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-700', 
          border: 'border-gray-200',
          label: 'Note' 
        };
    }
  };

  const severityDetails = getSeverityDetails();

  return (
    <div className={cn("bg-white rounded-xl p-4 shadow-sm border", severityDetails.border)}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-brand-dark">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {frequency}×
          </span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full", severityDetails.color)}>
            {severityDetails.label}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{description}</p>
      
      <div className="bg-gray-50 p-2 rounded-md text-xs">
        <span className="text-brand-dark">Tip:</span> {tips}
      </div>
    </div>
  );
};

export default FluencyIssueCard;
