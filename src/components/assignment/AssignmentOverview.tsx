
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Assignment } from "@/features/assignments/types_practice";

interface AssignmentOverviewProps {
  assignment: Assignment;
  handleBeginPractice: () => void;
}

const AssignmentOverview: React.FC<AssignmentOverviewProps> = ({
  assignment,
  handleBeginPractice
}) => {
  return (
    <div className="bg-gray-100 rounded-2xl p-4 sm:p-6 shadow-md h-[600px] flex flex-col">
      <div className="mb-6 border-b border-gray-200 pb-3">
        <h2 className="font-semibold text-lg text-gray-800">{assignment.title}</h2>
        <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
      </div>
      
      {/* Overview Content */}
      <ScrollArea className="bg-white rounded-xl p-4 sm:p-6 mb-4 flex-grow overflow-auto" style={{ maxHeight: "420px" }}>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Assignment Overview</h2>
          <p className="text-gray-700">{assignment.description}</p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          {assignment.instructions && (
            <ul className="space-y-3 text-gray-700">
              {assignment.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">Time Required</h3>
          <p className="text-gray-700">{assignment.estimatedTime}</p>
        </div>
      </ScrollArea>
      
      {/* Begin Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleBeginPractice}
          className="px-6"
        >
          Start Assignment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AssignmentOverview;
