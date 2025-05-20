import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export type AssignmentStatus = 'not started' | 'in progress' | 'completed';

interface AssignmentCardProps {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  onView?: () => void;
  isPractice?: boolean;
  isUnread?: boolean;
}

// Map status to appropriate button text
const getButtonText = (status: AssignmentStatus) => {
  switch (status) {
    case 'not started':
      return 'Start Assignment';
    case 'in progress':
      return 'Continue Assignment';
    case 'completed':
      return 'Review Assignment';
    default:
      return 'View Assignment';
  }
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  id,
  title,
  description,
  dueDate,
  status,
  onView,
  isPractice = false,
  isUnread = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onView) {
      onView();
      return;
    }

    if (isPractice) {
      navigate(`/student/practice`);
      return;
    }

    // For regular assignments - show overview for 'not started' status
    if (status === 'not started') {
      // Navigate to practice but with a query parameter to show overview first
      navigate(`/student/assignment/${id}/practice?showOverview=true`);
    } else {
      // Otherwise directly go to practice without showing overview
      navigate(`/student/assignment/${id}/practice`);
    }
  };

  if (isPractice) {
    return (
      <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col border-2 border-dashed border-indigo-300 bg-indigo-50/30 rounded-xl`}>
        <div className="p-5 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xl font-medium text-indigo-700">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          <p className="text-sm font-medium text-indigo-600">{dueDate}</p>
          
          <div className="mt-auto pt-4">
            <Button 
              variant="default" 
              className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200 font-medium rounded-lg py-2"
              onClick={handleClick}
            >
              Start Practicing Corrections
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col rounded-lg">
      <div className="p-5 bg-white flex flex-col h-full">
        {isUnread && <span className="absolute top-3 right-3 h-3 w-3 bg-blue-500 rounded-full" />}
        <h3 className="text-lg font-medium text-gray-800 mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <p className="text-xs font-medium text-gray-500 mb-4">Due: {dueDate}</p>
        
        <div className="mt-auto">
          <Button 
            variant="outline" 
            className="w-full hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium rounded-lg"
            onClick={handleClick}
          >
            {getButtonText(status)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AssignmentCard;
