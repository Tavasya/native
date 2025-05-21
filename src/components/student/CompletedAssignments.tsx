import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface CompletedAssignment {
  id: string;
  title: string;
  grade: string;
  completedDate: string;
}

interface CompletedAssignmentsGroup {
  title: string;
  assignments: CompletedAssignment[];
}

// Sample completed assignments data
const completedAssignmentsGroups: CompletedAssignmentsGroup[] = [
  {
    title: "24 hrs ago",
    assignments: [
      { id: '4', title: 'IELTS Listening Section 2', grade: '6.0', completedDate: '05/03/2025' },
    ]
  },
  {
    title: "1 week ago",
    assignments: [
      { id: '5', title: 'IELTS Grammar Assessment', grade: '7.0', completedDate: '04/28/2025' },
      { id: '6', title: 'IELTS Vocabulary Test', grade: '6.5', completedDate: '04/27/2025' },
    ]
  },
  {
    title: "1 month ago",
    assignments: [
      { id: '7', title: 'IELTS Diagnostic Test', grade: '5.5', completedDate: '04/05/2025' },
    ]
  }
];

const CompletedAssignments: React.FC = () => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <div className="mb-8">
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-100 cursor-pointer" onClick={() => {}}>
          <CardTitle className="text-lg">Completed Assignments</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {completedAssignmentsGroups.map((group) => (
            <div key={group.title} className="border-t border-gray-200">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleGroup(group.title)}
              >
                <div className="flex items-center">
                  <h3 className="text-md font-medium text-gray-700">
                    {group.title}
                  </h3>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedGroups[group.title] ? 'transform rotate-180' : ''
                  }`} 
                />
              </div>
              
              {expandedGroups[group.title] && (
                <div className="p-4 pt-0 pl-8 space-y-3">
                  {group.assignments.map(assignment => (
                    <div key={assignment.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-gray-500">Completed on {assignment.completedDate}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-green-600">{assignment.grade}</span>
                        <Button variant="link" size="sm" className="block text-blue-500">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedAssignments;
