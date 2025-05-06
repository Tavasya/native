
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";

interface ClassTableActionsProps {
  onAddClass?: () => void;
  onRefresh?: () => void;
}

const ClassTableActions: React.FC<ClassTableActionsProps> = ({ 
  onAddClass, 
  onRefresh 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
        <p className="text-gray-500 mt-1">Manage your classes and student information</p>
      </div>
      
      <div className="flex items-center space-x-3 self-end sm:self-auto">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        
        <Button size="sm" onClick={onAddClass}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>
    </div>
  );
};

export default ClassTableActions;
