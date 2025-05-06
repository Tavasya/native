
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Users, FileText, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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

  return (
    <>
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border shadow-subtle">
          <p className="text-gray-500">No classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-500"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <Link to={`/class/${classItem.id}`} className="hover:underline">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{classItem.name}</h3>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2"
                    onClick={() => openDeleteDialog(classItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Badge variant="outline" className="font-mono bg-gray-100 text-gray-800 mb-3">
                  {classItem.code}
                </Badge>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <Users className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-500">Students</span>
                    <span className="font-semibold">{classItem.students}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <FileText className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-500">Assignments</span>
                    <span className="font-semibold">{classItem.assignments}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                    <GraduationCap className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-500">Avg Grade</span>
                    <span className="font-semibold">{classItem.avgGrade ?? 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
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
    </>
  );
};

export default ClassTable;
