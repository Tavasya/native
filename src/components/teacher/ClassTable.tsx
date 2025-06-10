import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ClassData {
  id: string;
  name: string;
  code: string;
  students: number;
  assignments: number;
  avgGrade: string | null;
}

interface ClassTableProps {
  classes: ClassData[];
  onDelete: (id: string) => void;
}

const ClassTable: React.FC<ClassTableProps> = ({ classes, onDelete }) => {
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleDelete = () => {
    if (classToDelete) {
      onDelete(classToDelete);
      toast({
        title: "Class deleted",
        description: "The class has been successfully removed",
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setClassToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `Class code ${text} has been copied to your clipboard`,
    });
  };

  return (
    <TooltipProvider>
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border shadow-subtle">
          <p className="text-gray-500">No classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <Card 
              key={classItem.id} 
              className="overflow-hidden hover:shadow-md transition-shadow duration-200 rounded-md cursor-pointer relative"
            >
              <Link to={`/class/${classItem.id}`} className="block">
                <CardContent className="p-5 pb-16">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{classItem.name}</h3>
                        <div className="flex items-center gap-3 text-gray-500">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">{classItem.students}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Students enrolled</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{classItem.assignments}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total assignments</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>

              {/* Class code badge moved outside Link */}
              <div 
                className="absolute bottom-4 left-4 z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyToClipboard(classItem.code);
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      {classItem.code}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy class code</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                className="absolute top-4 right-4 text-gray-500 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDeleteDialog(classItem.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ClassTable;
