import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Users, FileText, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from '@/app/hooks';
import { isAdmin } from '@/utils/adminUtils';
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscription, loading } = useAppSelector(state => state.subscriptions);
  const { user } = useAppSelector(state => state.auth);

  // Check if user is admin (can bypass subscription check)
  const userIsAdmin = isAdmin(user);

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

  const handleClassClick = (e: React.MouseEvent) => {
    // Don't block if subscription is still loading
    if (loading) return;

    // Admins can bypass subscription check
    if (userIsAdmin) return;

    // Check if user has an active subscription
    if (!subscription || subscription.status !== 'active') {
      e.preventDefault();
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to access classes. Redirecting to billing...',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/teacher/subscriptions'), 1500);
      return;
    }
  };

  return (
    <TooltipProvider>
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-dark-card rounded-lg border dark:border-dark-border shadow-subtle">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              No Classes Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first class, or watch our help video to learn how to use the platform effectively.
            </p>
            <Button 
              onClick={() => setIsVideoModalOpen(true)}
              className="bg-[#272A69] hover:bg-[#272A69]/90 text-white px-6 py-3 rounded-md flex items-center gap-2 mx-auto"
            >
              <Play className="h-5 w-5" />
              Watch Tutorial Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <Card
              key={classItem.id}
              className="overflow-hidden hover:shadow-md transition-shadow duration-200 rounded-md cursor-pointer relative bg-white dark:bg-dark-card"
            >
              <Link
                to={`/class/${classItem.id}`}
                className="block"
                onClick={handleClassClick}
              >
                <CardContent className="p-5 pb-16">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{classItem.name}</h3>
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
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
                      className="font-semibold bg-gray-100 dark:bg-dark-card text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-dark-border transition-colors cursor-pointer"
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

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Help Video</DialogTitle>
            <DialogDescription>
              Instructional video to help you get started with the platform
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              onClick={() => setIsVideoModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <video
              controls
              className="w-full h-auto rounded-lg"
              src="/welcome.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>

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
