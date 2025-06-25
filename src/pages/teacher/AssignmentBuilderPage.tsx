import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, ChevronDown, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createAssignment } from '@/features/assignments/assignmentThunks';
import { 
  fetchPublicParts, 
  fetchPublicCombinations,
  setSelectedTopic,
  setSelectedPartType,
  clearFilters
} from '@/features/assignmentParts/assignmentPartsThunks';
import { 
  setSelectedTopic as setTopic,
  setSelectedPartType as setPartType,
  clearFilters as clearFiltersAction
} from '@/features/assignmentParts/assignmentPartsSlice';
import AssignmentPractice from '@/pages/student/AssignmentPractice';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RootState } from '@/app/store';
import type { AssignmentPart, PartCombination, PartType } from '@/features/assignmentParts/types';
import PartSelector from '@/components/teacher/AssignmentBuilder/PartSelector';
import BuilderCanvas from '@/components/teacher/AssignmentBuilder/BuilderCanvas';

const AssignmentBuilderPage: React.FC = () => {
  const user = useAppSelector(state => state.auth.user?.id);
  const { parts, combinations, loading, selectedTopic, selectedPartType } = useAppSelector((state: RootState) => state.assignmentParts);

  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const location = useLocation();

  // State
  const [title, setTitle] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [selectedParts, setSelectedParts] = useState<(AssignmentPart | PartCombination)[]>([]);
  const [activeHeaderCard, setActiveHeaderCard] = useState(false);
  const [autoGrade, setAutoGrade] = useState(true);
  const [isTest, setIsTest] = useState(false);
  // Store the actual questions that were sent to create assignment page
  const [actualQuestions, setActualQuestions] = useState<Array<{
    partId: string;
    questions: Array<{question: string; isEdited?: boolean; isCustom?: boolean}>
  }>>([]);

  // Fetch parts on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchPublicParts());
      dispatch(fetchPublicCombinations());
    }
  }, [user, dispatch]);

  // Restore builder state when returning from edit
  useEffect(() => {
    const returnedData = location.state?.returnedData;
    
    if (returnedData) {
      setTitle(returnedData.title || '');
      setDueDate(returnedData.due_date || '');
      setDueTime(returnedData.due_time || '23:59');
      setAutoGrade(returnedData.metadata?.autoGrade ?? true);
      setIsTest(returnedData.metadata?.isTest ?? false);
      setSelectedParts(returnedData.selectedParts || []);
      
      // Restore actual questions if they were edited
      if (returnedData.actualQuestions) {
        setActualQuestions(returnedData.actualQuestions);
      }
      
      // Clear the navigation state to prevent re-population on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an assignment title",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Missing due date",
        description: "Please set a due date for the assignment",
      });
      return;
    }

    if (selectedParts.length === 0) {
      toast({
        title: "No parts selected",
        description: "Please add at least one part to your assignment",
      });
      return;
    }

    try {
      // Combine date and time into ISO string
      const dueDateTime = new Date(`${dueDate}T${dueTime}`);

      // Flatten parts into questions
      const questions = selectedParts.flatMap(part => {
        if ('part2' in part && 'part3' in part) {
          // This is a PartCombination
          return [...(part.part2?.questions || []), ...(part.part3?.questions || [])];
        } else {
          // This is an AssignmentPart
          return part.questions;
        }
      });

      const assignmentData = {
        class_id: classId!,
        created_by: user || '',
        title: title.trim(),
        due_date: dueDateTime.toISOString(),
        questions: questions.map((question, index) => ({
          ...question,
          id: `question-${index + 1}`,
          question: question.question.trim(),
          bulletPoints: question.bulletPoints?.map(bp => bp.trim()),
          timeLimit: isTest ? "30" : "30", // 30 seconds for both modes
          prepTime: isTest ? "5" : undefined // 5 seconds prep only for test mode
        })),
        metadata: { 
          autoGrade, 
          isTest,
          builtFromParts: true,
          partIds: selectedParts.map(part => part.id)
        },
        status: 'not_started' as const
      };

      await dispatch(createAssignment(assignmentData)).unwrap();

      // Increment usage counts for all parts
      selectedParts.forEach(part => {
        if ('part2' in part && 'part3' in part) {
          dispatch(incrementCombinationUsageCount(part.id));
        } else {
          dispatch(incrementPartUsage(part.id));
        }
      });

      toast({ title: 'Assignment published', description: 'The assignment has been published successfully' });
      navigate(`/class/${classId}`);
    } catch (err: any) {
      toast({
        title: 'Publish failed',
        description: err?.message || 'Could not create assignment',
        variant: 'destructive'
      });
    }
  };

  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    // Check if this is the new format with custom questions
    if (result.newSelectedParts && result.newActualQuestions) {
      setSelectedParts(result.newSelectedParts);
      setActualQuestions(result.newActualQuestions);
      return;
    }

    // Fallback to original logic
    const reorderedItems = Array.from(selectedParts);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setSelectedParts(reorderedItems);
  };

  // Add preview handler
  const handlePreview = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an assignment title",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Missing due date",
        description: "Please set a due date for the assignment",
      });
      return;
    }

    if (selectedParts.length === 0) {
      toast({
        title: "No parts selected",
        description: "Please add at least one part to your assignment",
      });
      return;
    }

    setIsPreviewMode(true);
  };

  // Filter handlers
  const handleTopicChange = (topic: string | undefined) => {
    dispatch(setTopic(topic));
  };

  const handlePartTypeChange = (partType: PartType | undefined) => {
    dispatch(setPartType(partType));
  };

  const handleClearFilters = () => {
    dispatch(clearFiltersAction());
  };

  // Add part to builder
  const handleAddPart = (part: AssignmentPart | PartCombination) => {
    setSelectedParts(prev => [...prev, part]);
  };

  // Remove part from builder
  const handleRemovePart = (index: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== index));
  };

  // Remove custom questions
  const handleRemoveCustomQuestions = () => {
    setActualQuestions(prev => prev.filter(aq => aq.partId !== 'custom'));
  };

  if (isPreviewMode) {
    // Flatten parts into questions for preview
    const questions = selectedParts.flatMap(part => {
      if ('part2' in part && 'part3' in part) {
        return [...(part.part2?.questions || []), ...(part.part3?.questions || [])];
      } else {
        return part.questions;
      }
    });

    return (
      <AssignmentPractice
        previewMode={true}
        previewData={{
          title,
          due_date: dueDate,
          questions: questions.map((question, index) => ({
            ...question,
            id: `question-${index + 1}`
          })),
          id: 'preview',
          metadata: {
            autoGrade,
            isTest
          }
        }}
        onBack={() => setIsPreviewMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F9FF]">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header with back button and publish button */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/class/${classId}`)}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to class
          </Button>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={handlePreview}
              className="text-[#272A69] hover:text-[#272A69]/90"
            >
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Validation - ensure required fields are filled
                if (!title.trim()) {
                  toast({
                    title: "Missing title",
                    description: "Please enter an assignment title before editing",
                  });
                  return;
                }

                if (!dueDate) {
                  toast({
                    title: "Missing due date",
                    description: "Please set a due date before editing",
                  });
                  return;
                }

                if (selectedParts.length === 0) {
                  toast({
                    title: "No parts selected",
                    description: "Please add at least one part before editing",
                  });
                  return;
                }

                // Prepare assignment data for editing
                const assignmentData = {
                  title: title.trim(),
                  due_date: dueDate, // This should already be in YYYY-MM-DD format
                  due_time: dueTime,
                  questions: (() => {
                    // Use actual questions if available, otherwise use original part questions
                    if (actualQuestions.length > 0) {
                      const allQuestions: any[] = [];
                      
                      actualQuestions.forEach(aq => {
                        aq.questions.forEach(q => {
                          allQuestions.push({
                            id: `question-${allQuestions.length + 1}`,
                            type: 'normal',
                            question: q.question,
                            bulletPoints: [],
                            speakAloud: false,
                            timeLimit: isTest ? "30" : "30",
                            prepTime: isTest ? "5" : undefined
                          });
                        });
                      });
                      
                      return allQuestions;
                    } else {
                      // Fallback to original part questions
                      return selectedParts.flatMap(part => {
                        if ('part2' in part && 'part3' in part) {
                          return [...(part.part2?.questions || []), ...(part.part3?.questions || [])];
                        } else {
                          return part.questions;
                        }
                      }).map((question, index) => ({
                        ...question,
                        id: `question-${index + 1}`,
                        question: question.question.trim(),
                        bulletPoints: question.bulletPoints?.map(bp => bp.trim()),
                        timeLimit: isTest ? "30" : "30", // 30 seconds for both modes
                        prepTime: isTest ? "5" : undefined // 5 seconds prep only for test mode
                      }));
                    }
                  })(),
                  metadata: { 
                    autoGrade, 
                    isTest,
                    builtFromParts: true,
                    partIds: selectedParts.map(part => part.id),
                    selectedParts: selectedParts // Store full part objects for restoration
                  }
                };

                // Store the actual questions for display in builder
                const questionsMap = selectedParts.map(part => ({
                  partId: part.id,
                  questions: part.questions.map(q => ({
                    question: q.question.trim(),
                    isEdited: false,
                    isCustom: false
                  }))
                }));
                setActualQuestions(questionsMap);

                // Navigate to create assignment page with the data
                navigate(`/class/${classId}/create-assignment`, {
                  state: { 
                    editData: assignmentData,
                    isEditing: true
                  }
                });
              }}
              className="border-[#272A69] text-[#272A69] hover:bg-[#272A69] hover:text-white"
            >
              Edit Assignment
            </Button>
            <div className="flex">
              <Button
                onClick={handleSubmit}
                className="bg-[#272A69] hover:bg-[#272A69]/90 text-white rounded-r-none border-r border-[#1f2251]"
              >
                Publish
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-[#272A69] hover:bg-[#272A69]/90 text-white px-2 rounded-l-none">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    // TODO: Implement save as template
                    toast({
                      title: 'Coming soon',
                      description: 'Save as template feature will be available soon',
                    });
                  }}>
                    Save as Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Header Card with title, description, settings */}
          <Card
            className={cn(
              "border border-gray-200 shadow-md overflow-hidden mb-6",
              activeHeaderCard && (isTest ? "ring-2 ring-orange-500 border-orange-500" : "ring-2 ring-[#272A69] border-[#272A69]"),
              !activeHeaderCard && "border-gray-200"
            )}
            onMouseDown={(e: React.MouseEvent) => {
              const target = e.target as HTMLElement;
              const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

              if (!isInput) {
                (document.activeElement as HTMLElement)?.blur();
                setActiveHeaderCard(true);
              }
            }}
          >
            <CardContent className="p-6">
              {/* Title and description */}
              <div className="space-y-2">
                <div className={cn(
                  "bg-gray-50 px-4 py-3 rounded-md transition-all duration-200",
                  activeHeaderCard ? "bg-gray-50" : "bg-transparent"
                )}>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setActiveHeaderCard(true)}
                    placeholder="Assignment Title"
                    className="border-none text-xl font-medium p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Settings - Only show if header card is active */}
              <AnimatePresence>
                {activeHeaderCard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Due Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Due Date</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full"
                        />
                      </div>

                      {/* Due Time */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Due Time</Label>
                        <Input
                          type="time"
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Auto Grade */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Auto Grade</Label>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-md border border-gray-200">
                          <Switch
                            id="auto-grade"
                            checked={autoGrade}
                            onCheckedChange={setAutoGrade}
                          />
                          <Label htmlFor="auto-grade" className="text-sm text-gray-600">
                            {autoGrade ? "Enabled" : "Disabled"}
                          </Label>
                        </div>
                      </div>

                      {/* Test Mode */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Test Mode</Label>
                        <div className="flex items-center space-x-2 bg-white p-2 rounded-md border border-gray-200">
                          <Switch
                            id="test-mode"
                            checked={isTest}
                            onCheckedChange={setIsTest}
                          />
                          <Label htmlFor="test-mode" className="text-sm text-gray-600">
                            {isTest ? "Enabled" : "Disabled"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Builder Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Part Selection Panel */}
            <div className="lg:col-span-1">
              <PartSelector
                parts={parts}
                combinations={combinations}
                loading={loading}
                selectedTopic={selectedTopic}
                selectedPartType={selectedPartType}
                onTopicChange={handleTopicChange}
                onPartTypeChange={handlePartTypeChange}
                onClearFilters={handleClearFilters}
                onAddPart={handleAddPart}
              />
            </div>

            {/* Builder Canvas */}
            <div className="lg:col-span-2">
              <BuilderCanvas
                selectedParts={selectedParts}
                onRemovePart={handleRemovePart}
                onDragEnd={onDragEnd}
                actualQuestions={actualQuestions}
                onRemoveCustomQuestions={handleRemoveCustomQuestions}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentBuilderPage; 