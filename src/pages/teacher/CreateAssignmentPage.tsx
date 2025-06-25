import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, ChevronDown, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createAssignment } from '@/features/assignments/assignmentThunks';
import { fetchAssignmentTemplates, createAssignmentTemplate, deleteAssignmentTemplate } from '@/features/assignmentTemplates/assignmentTemplateThunks';
import { 
  fetchPublicParts, 
  fetchPublicCombinations
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
import PartLibrary from '@/components/assignment/PartLibrary';
import type { RootState } from '@/app/store';
import type { AssignmentTemplate } from '@/features/assignmentTemplates/types';
import type { AssignmentPart, PartCombination, PartType } from '@/features/assignmentParts/types';

interface QuestionCard {
  id: string;
  type: 'normal' | 'bulletPoints';
  question: string;
  bulletPoints?: string[];
  speakAloud: boolean;
  timeLimit: string;
  prepTime?: string;          // in minutes, e.g. "2" - prep time for test mode
}

const CreateAssignmentPage: React.FC = () => {
  const user = useAppSelector(state => state.auth.user?.id);
  const { templates, loading: templatesLoading } = useAppSelector((state: RootState) => state.assignmentTemplates);
  const { parts, combinations, loading: partsLoading, selectedTopic, selectedPartType } = useAppSelector((state: RootState) => state.assignmentParts);

  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const location = useLocation();
  // State
  const [title, setTitle] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59'); // Default to end of day
  const [questionCards, setQuestionCards] = useState<QuestionCard[]>([
    {
      id: 'card-1',
      type: 'normal',
      question: '',
      speakAloud: false,
      timeLimit: '1',
      prepTime: '0:15'
    }
  ]);
  const [activeCardId, setActiveCardId] = useState('1');
  const [activeHeaderCard, setActiveHeaderCard] = useState(false);
  const [autoGrade, setAutoGrade] = useState(true);
  const [isTest, setIsTest] = useState(false);
  // Store original question mapping for tracking edits
  const [originalQuestionMapping, setOriginalQuestionMapping] = useState<Array<{
    questionId: string;
    partId: string;
    originalQuestion: string;
  }>>([]);
  
  // Part library state
  const [isPartLibraryOpen, setIsPartLibraryOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag and drop state
  const [isDraggingPart, setIsDraggingPart] = useState(false);
  const [draggedPart, setDraggedPart] = useState<AssignmentPart | PartCombination | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Time limit options in minutes
  const timeLimits = [
    { value: "0.25", label: "15 seconds" },
    { value: "0.333", label: "20 seconds" },
    { value: "0.417", label: "25 seconds" },
    { value: "0.5", label: "30 seconds" },
    { value: "1", label: "1 minute" },
    { value: "2", label: "2 minutes" },
    { value: "3", label: "3 minutes" },
  ];



  useEffect(() => {
    if (user) {
      dispatch(fetchAssignmentTemplates(user));
      dispatch(fetchPublicParts());
      dispatch(fetchPublicCombinations());
    }
  }, [user, dispatch]);

  // Handle edit data from navigation state
  useEffect(() => {
    const editData = location.state?.editData;
    const isEditing = location.state?.isEditing;
    
    if (editData && isEditing) {
      setTitle(editData.title || '');
      setDueDate(editData.due_date || '');
      setDueTime(editData.due_time || '23:59');
      setAutoGrade(editData.metadata?.autoGrade ?? true);
      setIsTest(editData.metadata?.isTest ?? false);
      
      // Restore the actual question cards that were edited
      if (editData.questions && editData.questions.length > 0) {
        setQuestionCards(editData.questions.map((q: any, index: number) => ({
          id: q.id || `card-${index + 1}`,
          type: q.type || 'normal',
          question: q.question || '',
          bulletPoints: q.bulletPoints || [],
          speakAloud: q.speakAloud || false,
          timeLimit: q.timeLimit || '1',
          prepTime: q.prepTime || '0:15'
        })));
        
        // Store original question mapping for tracking edits
        const mapping: Array<{questionId: string; partId: string; originalQuestion: string}> = [];
        let questionIndex = 0;
        
        editData.metadata?.selectedParts?.forEach((part: any) => {
          const partQuestions = part.questions || [];
          partQuestions.forEach((q: any) => {
            if (editData.questions[questionIndex]) {
              mapping.push({
                questionId: editData.questions[questionIndex].id || `card-${questionIndex + 1}`,
                partId: part.id,
                originalQuestion: q.question
              });
            }
            questionIndex++;
          });
        });
        
        setOriginalQuestionMapping(mapping);
      }
      
      // Clear the navigation state to prevent re-population on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Card operations
  const addQuestionCard = (type: 'normal' | 'bulletPoints' = 'normal') => {
    const newCard: QuestionCard = {
      id: `card-${Date.now().toString()}`,
      type,
      question: '',
      speakAloud: false,
      timeLimit: '1',
      prepTime: '0:15'
    };

    if (type === 'bulletPoints') {
      newCard.bulletPoints = [''];
    }

    setQuestionCards([...questionCards, newCard]);
    setActiveHeaderCard(false);
    setActiveCardId(newCard.id);
  };

  const deleteQuestionCard = (id: string) => {
    if (questionCards.length > 1) {
      setQuestionCards(questionCards.filter(card => card.id !== id));

      // If we're deleting the active card, set a new active card
      if (activeCardId === id) {
        const remainingCards = questionCards.filter(card => card.id !== id);
        if (remainingCards.length > 0) {
          setActiveCardId(remainingCards[0].id);
        }
      }
    } else {
      toast({
        title: "Cannot remove",
        description: "You must have at least one question",
      });
    }
  };

  const updateQuestionCard = (id: string, updates: Partial<QuestionCard>) => {
    setQuestionCards(questionCards.map(card =>
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  // Helper functions for time format conversion

  const secondsToTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPrepTime = (prepTime?: string): string => {
    if (!prepTime) return '0:15';
    // If it's already in M:SS format, return as is
    if (prepTime.includes(':')) return prepTime;
    // Convert from old minutes format to M:SS
    const seconds = parseFloat(prepTime) * 60;
    return secondsToTime(seconds);
  };

  // Bullet point operations
  const addBulletPoint = (cardId: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        return {
          ...card,
          bulletPoints: [...(card.bulletPoints || []), '']
        };
      }
      return card;
    }));
  };

  // Helper function to detect and split multiple bullet points
  const splitBulletPoints = (text: string): string[] => {
    // Split by newlines first - this handles the case where newlines are preserved
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length > 1) {
      // Multiple lines detected, return each line as a separate bullet point
      return lines.map(line => line.trim());
    }
    
    // For single line, check if it looks like multiple items that should be separated
    const singleLine = text.trim();
    
    // Look for patterns that suggest multiple items separated by spaces
    // Common patterns: "1. Item 2. Item 3. Item" or "Item1 Item2 Item3"
    const words = singleLine.split(/\s+/);
    
    // If we have multiple words and they look like separate bullet points
    if (words.length > 2) {
      // Check if the text looks like separate bullet points rather than a sentence
      const hasBulletPointPattern = words.some(word => 
        /^\d+\.$/.test(word) || // Pattern like "1.", "2.", "3."
        /^[A-Z]{2,}\d+$/.test(word) || // Pattern like "BP1", "BP2"
        /^[A-Z][a-z]+\d*$/.test(word) || // Pattern like "Item1", "Point2"
        /^[A-Z]{2,}$/.test(word) // Pattern like "BP", "POINT"
      );
      
      if (hasBulletPointPattern) {
        // For numbered lists, split by the number pattern but keep the number with its content
        if (words.some(word => /^\d+\.$/.test(word))) {
          const items = singleLine.split(/\s+(?=\d+\.)/);
          return items.filter(item => item.trim()).map(item => item.trim());
        }
        
        // For other patterns, split by the pattern
        const items = singleLine.split(/\s+(?=\b[A-Z]{2,}\d+\b|\b[A-Z][a-z]+\d*\b|\b[A-Z]{2,}\b)/);
        return items.filter(item => item.trim()).map(item => item.trim());
      }
    }
    
    // If no clear pattern detected, return as single bullet point
    return [singleLine];
  };

  const updateBulletPoint = (cardId: string, index: number, value: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        const newBulletPoints = [...(card.bulletPoints || [])];
        
        // Check if the pasted text contains multiple bullet points
        const splitPoints = splitBulletPoints(value);
        
        if (splitPoints.length > 1) {
          // Replace the current bullet point with the first item
          newBulletPoints[index] = splitPoints[0];
          
          // Insert the remaining items as new bullet points
          for (let i = 1; i < splitPoints.length; i++) {
            newBulletPoints.splice(index + i, 0, splitPoints[i]);
          }
        } else {
          // Single bullet point, update normally
          newBulletPoints[index] = value;
        }
        
        return {
          ...card,
          bulletPoints: newBulletPoints
        };
      }
      return card;
    }));
  };

  const deleteBulletPoint = (cardId: string, index: number) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints' && card.bulletPoints && card.bulletPoints.length > 1) {
        const newBulletPoints = [...card.bulletPoints];
        newBulletPoints.splice(index, 1);
        return {
          ...card,
          bulletPoints: newBulletPoints
        };
      }
      return card;
    }));
  };

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

    if (questionCards.some(q => !q.question.trim())) {
      toast({
        title: "Incomplete questions",
        description: "Please make sure all questions have content",
      });
      return;
    }

    try {
      // Combine date and time into ISO string
      const dueDateTime = new Date(`${dueDate}T${dueTime}`);

      const assignmentData = {
        class_id: classId!,
        created_by: user || '',
        title: title.trim(),
        due_date: dueDateTime.toISOString(),
        questions: questionCards.map(card => ({
          ...card,
          question: card.question.trim(),
          bulletPoints: card.bulletPoints?.map(bp => bp.trim())
        })),
        metadata: { autoGrade, isTest },
        status: 'not_started' as const
      };

      await dispatch(createAssignment(assignmentData)).unwrap();

      const isEditing = location.state?.isEditing;
      const actionText = isEditing ? 'updated' : 'published';
      
      toast({ 
        title: `Assignment ${actionText}`, 
        description: `The assignment has been ${actionText} successfully` 
      });
      navigate(`/class/${classId}`);
    } catch (err: any) {
      toast({
        title: 'Publish failed',
        description: err?.message || 'Could not create assignment',
        variant: 'destructive'
      });
    }
  };

  // Handle drag and drop reordering - fixed for vertical only
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(questionCards);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setQuestionCards(reorderedItems);
  };

  // Custom drag handle with 2 rows of 3 dots (arranged in 3x2 grid)
  const DragHandle = () => (
    <div className="flex justify-center items-center cursor-move py-1">
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
        </div>
        <div className="flex gap-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
          <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
        </div>
      </div>
    </div>
  );

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

    if (questionCards.some(q => !q.question.trim())) {
      toast({
        title: "Incomplete questions",
        description: "Please make sure all questions have content",
      });
      return;
    }

    setIsPreviewMode(true);
  };

  // Add a placeholder for save as template
  const handleSaveAsTemplate = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter an assignment title",
      });
      return;
    }

    if (questionCards.some(q => !q.question.trim())) {
      toast({
        title: "Incomplete questions",
        description: "Please make sure all questions have content",
      });
      return;
    }

    try {
      const templateData = {
        teacher_id: user!,
        title: title.trim(),
        questions: questionCards.map(card => ({
          ...card,
          question: card.question.trim(),
          bulletPoints: card.bulletPoints?.map(bp => bp.trim())
        })),
        metadata: { autoGrade }
      };

      await dispatch(createAssignmentTemplate(templateData)).unwrap();
      toast({
        title: 'Template saved',
        description: 'This assignment has been saved as a template.'
      });
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message || 'Could not save template',
        variant: 'destructive'
      });
    }
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

  // Add part to assignment
  const handleAddPart = (part: AssignmentPart | PartCombination, insertIndex?: number) => {
    let questions: any[] = [];
    
    if ('part2' in part && 'part3' in part) {
      // This is a PartCombination - combine part2 and part3 questions
      const part2Questions = (part.part2?.questions || []).map((q: any) => ({
        ...q,
        type: 'bulletPoints' as const,
        bulletPoints: q.bulletPoints || ['']
      }));
      
      const part3Questions = (part.part3?.questions || []).map((q: any) => ({
        ...q,
        type: 'normal' as const
      }));
      
      questions = [...part2Questions, ...part3Questions];
    } else if ('questions' in part) {
      // This is an AssignmentPart
      questions = part.questions.map((q: any) => {
        if (part.part_type === 'part2_only') {
          return {
            ...q,
            type: 'bulletPoints' as const,
            bulletPoints: q.bulletPoints || ['']
          };
        } else {
          return {
            ...q,
            type: 'normal' as const
          };
        }
      });
    }
    
    const newQuestionCards = questions.map((q: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      type: q.type,
      question: q.question,
      bulletPoints: q.bulletPoints || [],
      speakAloud: q.speakAloud || false,
      timeLimit: '1',
      prepTime: '0:15'
    }));
    
    if (insertIndex !== undefined) {
      // Insert at specific position
      setQuestionCards(prev => {
        const newCards = [...prev];
        newCards.splice(insertIndex, 0, ...newQuestionCards);
        return newCards;
      });
    } else {
      // Add to end
      setQuestionCards(prev => [...prev, ...newQuestionCards]);
    }
    
    // Show success toast
    toast({
      title: 'Questions added',
      description: `Added ${questions.length} question${questions.length !== 1 ? 's' : ''} from "${part.title}"`,
    });
  };

  // Drag and drop handlers
  const handleDragStart = (part: AssignmentPart | PartCombination) => {
    setIsDraggingPart(true);
    setDraggedPart(part);
  };

  const handleDragEnd = () => {
    setIsDraggingPart(false);
    setDraggedPart(null);
    setDropIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPart) {
      handleAddPart(draggedPart, index);
    }
    handleDragEnd();
  };

  // Global drag end handler
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDraggingPart) {
        handleDragEnd();
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [isDraggingPart]);


  if (isPreviewMode) {
    return (
      <AssignmentPractice
        previewMode={true}
        previewData={{
          title,
          due_date: dueDate,
          questions: questionCards,
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
    <div className="min-h-screen bg-[#F5F9FF]">
      <main className="flex-1">
        {/* Part Library Sidebar */}
        <PartLibrary
          isOpen={isPartLibraryOpen}
          onToggle={setIsPartLibraryOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTopic={selectedTopic}
          onTopicChange={handleTopicChange}
          selectedPartType={selectedPartType}
          onPartTypeChange={handlePartTypeChange}
          onClearFilters={handleClearFilters}
          parts={parts}
          combinations={combinations}
          partsLoading={partsLoading}
          onAddPart={handleAddPart}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />

        {/* Main Content */}
        <div className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          isPartLibraryOpen ? "ml-80" : "ml-12"
        )}>
          <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with back button and publish button */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                // If we're editing from the builder, go back to builder with current data
                if (location.state?.isEditing) {
                  const returnedData = {
                    title: title,
                    due_date: dueDate,
                    due_time: dueTime,
                    metadata: { autoGrade, isTest },
                    selectedParts: location.state?.editData?.metadata?.selectedParts || [],
                    actualQuestions: (() => {
                      const selectedParts = location.state?.editData?.metadata?.selectedParts || [];
                      
                      if (selectedParts.length === 0) {
                        // No parts, all questions are custom
                        return [{
                          partId: 'custom',
                          questions: questionCards.map(q => ({
                            question: q.question,
                            isEdited: false,
                            isCustom: true
                          }))
                        }];
                      }
                      
                      // Map questions to their original parts
                      const partQuestionsMap = new Map<string, Array<{question: string; isEdited: boolean; isCustom: boolean}>>();
                      
                      // Initialize map for each part
                      selectedParts.forEach((part: any) => {
                        partQuestionsMap.set(part.id, []);
                      });
                      
                      // Add a custom part for any questions not mapped to original parts
                      partQuestionsMap.set('custom', []);
                      
                      // Process each question card
                      questionCards.forEach(q => {
                        const mapping = originalQuestionMapping.find(m => m.questionId === q.id);
                        
                        if (mapping) {
                          // This question belongs to an original part
                          const partQuestions = partQuestionsMap.get(mapping.partId) || [];
                          partQuestions.push({
                            question: q.question,
                            isEdited: q.question !== mapping.originalQuestion,
                            isCustom: false
                          });
                          partQuestionsMap.set(mapping.partId, partQuestions);
                        } else {
                          // This is a custom question
                          const customQuestions = partQuestionsMap.get('custom') || [];
                          customQuestions.push({
                            question: q.question,
                            isEdited: false,
                            isCustom: true
                          });
                          partQuestionsMap.set('custom', customQuestions);
                        }
                      });
                      
                      // Convert map to array format
                      const result: Array<{partId: string; questions: Array<{question: string; isEdited: boolean; isCustom: boolean}>}> = [];
                      
                      selectedParts.forEach((part: any) => {
                        const questions = partQuestionsMap.get(part.id) || [];
                        if (questions.length > 0) {
                          result.push({
                            partId: part.id,
                            questions: questions
                          });
                        }
                      });
                      
                      // Add custom questions if any
                      const customQuestions = partQuestionsMap.get('custom') || [];
                      if (customQuestions.length > 0) {
                        result.push({
                          partId: 'custom',
                          questions: customQuestions
                        });
                      }
                      
                      return result;
                    })()
                  };
                  
                  navigate(`/class/${classId}/builder`, {
                    state: { returnedData }
                  });
                } else {
                  navigate(`/class/${classId}`);
                }
              }}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {location.state?.isEditing ? 'Back to builder' : 'Back to class'}
            </Button>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={handlePreview}
                className="text-[#272A69] hover:text-[#272A69]/90"
              >
                Preview
              </Button>
              <div className="flex">
                <Button
                  onClick={handleSubmit}
                  className="bg-[#272A69] hover:bg-[#272A69]/90 text-white rounded-r-none border-r border-[#1f2251]"
                >
                  {location.state?.isEditing ? 'Update' : 'Publish'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-[#272A69] hover:bg-[#272A69]/90 text-white px-2 rounded-l-none">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSaveAsTemplate}>
                      Save as Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto relative">
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
                  setActiveCardId(''); // Clear selected question card
                  setActiveHeaderCard(true); // Activate header card
                }
              }}
            >
              <CardContent className="p-6">
                {/* Spacer to match drag handle spacing */}
                <div className="py-1"></div>
                
                {/* Title and description */}
                <div className="space-y-2">
                  <div className={cn(
                    "bg-gray-50 px-4 py-3 rounded-md transition-all duration-200",
                    activeHeaderCard ? "bg-gray-50" : "bg-transparent"
                  )}>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onFocus={() => {
                        setActiveCardId('');
                        setActiveHeaderCard(true);
                      }}
                      placeholder="Assignment Title"
                      className="border-none text-xl font-medium p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                {/* Settings - Only show if header card is active */}
                <AnimatePresence>
                  {activeHeaderCard && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      style={{ overflow: 'hidden' }}
                      className="mt-6"
                    >
                      <div className="space-y-5 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Due Date */}
                          <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="bg-white px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-0 focus:ring-offset-0 w-full text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-datetime-edit]:text-gray-700 [&::-webkit-datetime-edit-fields-wrapper]:text-gray-700 [&::-webkit-datetime-edit]:font-normal"
                            />
                          </div>

                          {/* Due Time */}
                          <div className="space-y-2">
                            <Label htmlFor="dueTime" className="text-sm font-medium">Due Time</Label>
                            <Input
                              id="dueTime"
                              type="time"
                              value={dueTime}
                              onChange={(e) => setDueTime(e.target.value)}
                              className="bg-white px-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-0 focus:ring-offset-0 w-full text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                            />
                          </div>
                          
                          {/* Auto Grade Setting */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm font-medium text-gray-700">Auto Grading</Label>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="focus:outline-none">
                                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-white border border-gray-200 shadow-lg">
                                    <p className="text-sm text-gray-700">AI analyzes submissions and marks them as pending review for manual grading.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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

                          {/* Test Setting */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm font-medium text-gray-700">Test Mode</Label>
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="focus:outline-none">
                                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-white border border-gray-200 shadow-lg">
                                    <p className="text-sm text-gray-700">Enables IELTS-style test mode with prep time and formal testing environment.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                          
                          {/* Assignment Templates */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Templates</Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-between bg-white"
                                  disabled={templatesLoading || templates.length === 0}
                                >
                                  {templatesLoading ? "Loading..." : 
                                   templates.length === 0 ? "No templates" : 
                                   "Select template"}
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                                {templates.map((template: AssignmentTemplate) => (
                                  <div key={template.id}>
                                    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 group">
                                      <button
                                        type="button"
                                        className="text-sm font-medium text-left flex-1 hover:text-[#272A69] transition-colors"
                                        onClick={() => {
                                          setTitle(template.title);
                                          setQuestionCards(template.questions);
                                        }}
                                      >
                                        {template.title}
                                      </button>
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2 p-1 rounded hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          dispatch(deleteAssignmentTemplate(template.id));
                                        }}
                                        title="Delete template"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    {template !== templates[templates.length - 1] && <DropdownMenuSeparator />}
                                  </div>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Question Cards */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questionsList" type="QUESTION" direction="vertical">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col mb-6"
                  >
                    {/* Drop zone at the beginning */}
                    {isDraggingPart && (
                      <div
                        className={cn(
                          "h-8 mb-2 rounded-lg border-2 border-dashed transition-all duration-200",
                          dropIndex === 0 
                            ? "border-[#272A69] bg-[#272A69]/5" 
                            : "border-gray-300 bg-gray-50"
                        )}
                        onDragOver={(e) => handleDragOver(e, 0)}
                        onDrop={(e) => handleDrop(e, 0)}
                      />
                    )}
                    
                    {questionCards.map((card, index) => (
                      <React.Fragment key={card.id}>
                        <Draggable draggableId={card.id} index={index}>
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "mb-4 relative rounded-lg overflow-hidden",
                                activeCardId === card.id && (isTest ? "ring-2 ring-orange-500" : "ring-2 ring-[#272A69]")
                              )}
                              onMouseDown={(e: React.MouseEvent) => {
                                const target = e.target as HTMLElement;

                                // Only activate the card if the click is NOT inside an editable field
                                if (target.closest('input, textarea, select, [contenteditable="true"]')) return;

                                (document.activeElement as HTMLElement)?.blur();
                                setActiveCardId(card.id);
                                setActiveHeaderCard(false);
                              }}
                            >
                              <Card className="border border-gray-200 shadow-md overflow-hidden">
                                <div {...provided.dragHandleProps} className="flex justify-center">
                                  <DragHandle />
                                </div>
                                <CardContent className="p-6">
                                  <div className="space-y-4">
                                    {/* Question Input */}
                                    <div className="space-y-2">
                                      <div
                                        className={cn(
                                          "bg-gray-50 px-4 py-3 rounded-md transition-all duration-200",
                                          activeCardId === card.id ? "bg-gray-50" : "bg-transparent"
                                        )}
                                      >
                                        <Input
                                          value={card.question}
                                          onChange={e =>
                                            updateQuestionCard(card.id, { question: e.target.value })
                                          }
                                          onFocus={() => {
                                            setActiveCardId(card.id);
                                            setActiveHeaderCard(false);
                                          }}
                                          placeholder={`Question ${index + 1}`}
                                          className="border-none text-xl font-medium p-0 bg-transparent mb-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                      </div>
                                    </div>

                                    {/* Bullet Points */}
                                    {card.type === "bulletPoints" && (
                                      <div
                                        className={cn(
                                          "p-4 rounded-lg",
                                          activeCardId === card.id ? "bg-gray-50" : ""
                                        )}
                                      >
                                        <h4 className="text-sm font-medium mb-3">You should say:</h4>
                                        <div className="space-y-2">
                                          {card.bulletPoints?.map((bullet, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                              <div className="text-gray-500 font-bold">•</div>
                                              <Input
                                                value={bullet}
                                                onChange={e => updateBulletPoint(card.id, i, e.target.value)}
                                                onMouseDown={() => {
                                                  setActiveCardId(card.id)
                                                  setActiveHeaderCard(false)
                                                }}
                                                placeholder="Enter bullet point text..."
                                                className="
                                                  flex-1
                                                  focus:outline-none
                                                  focus:ring-0
                                                  focus:ring-transparent
                                                  focus:ring-offset-0
                                                  focus-visible:ring-0
                                                  focus-visible:ring-transparent
                                                  focus-visible:ring-offset-0
                                                  ring-0
                                                "
                                              />
                                              {card.bulletPoints!.length > 1 &&
                                                activeCardId === card.id && (
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={e => {
                                                      e.stopPropagation()
                                                      deleteBulletPoint(card.id, i)
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                )}
                                            </div>
                                          ))}
                                          {activeCardId === card.id && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={e => {
                                                e.stopPropagation()
                                                addBulletPoint(card.id)
                                              }}
                                              className="mt-2 border-none focus:outline-none focus:ring-0"
                                            >
                                              <Plus className="h-3 w-3 mr-2" />
                                              Add Bullet Point
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Controls */}
                                    <AnimatePresence>
                                      {activeCardId === card.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2, ease: "easeInOut" }}
                                          style={{ overflow: 'hidden' }}
                                        >
                                          <div className="flex flex-col space-y-4 pt-4">
                                            <div className="flex items-center justify-between gap-4">
                                              <div className="flex flex-col">
                                                <label className="text-xs text-gray-500 mb-1">Question Style</label>
                                                <Select
                                                  value={card.type}
                                                  onValueChange={(value: "normal" | "bulletPoints") =>
                                                    updateQuestionCard(card.id, {
                                                      type: value,
                                                      bulletPoints:
                                                        value === "bulletPoints" ? [""] : undefined,
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-40">
                                                    <SelectValue>
                                                      {card.type === "normal"
                                                        ? "Part 1 or Part 3 "
                                                        : "Part 2 "}
                                                    </SelectValue>
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="normal">Part 1 or Part 3</SelectItem>
                                                    <SelectItem value="bulletPoints">
                                                      Part 2
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              
                                              <div className="flex items-center gap-4">
                                                {isTest && (
                                                  <div className="flex flex-col">
                                                    <label className="text-xs text-gray-500 mb-1">Prep Time (M:SS)</label>
                                                    <Input
                                                      type="text"
                                                      pattern="[0-9]:[0-9]{2}"
                                                      placeholder="0:15"
                                                      value={formatPrepTime(card.prepTime)}
                                                      onChange={(e) => {
                                                        const timeValue = e.target.value;
                                                        // Validate M:SS format and max 9:59
                                                        if (/^[0-9]?:?[0-9]{0,2}$/.test(timeValue)) {
                                                          updateQuestionCard(card.id, { prepTime: timeValue });
                                                        }
                                                      }}
                                                      onBlur={(e) => {
                                                        const timeValue = e.target.value;
                                                        // Ensure proper format on blur
                                                        if (timeValue && !timeValue.includes(':')) {
                                                          // If only numbers, treat as minutes (max 9)
                                                          const minutes = Math.min(parseInt(timeValue) || 1, 9);
                                                          const formatted = secondsToTime(minutes * 60);
                                                          updateQuestionCard(card.id, { prepTime: formatted });
                                                        } else if (timeValue.includes(':')) {
                                                          // Validate and fix M:SS format
                                                          const parts = timeValue.split(':');
                                                          const minutes = Math.min(parseInt(parts[0]) || 0, 9);
                                                          const seconds = Math.min(parseInt(parts[1]) || 0, 59);
                                                          const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                                          updateQuestionCard(card.id, { prepTime: formatted });
                                                        }
                                                      }}
                                                      className="w-16 text-center text-sm"
                                                    />
                                                  </div>
                                                )}
                                                
                                                <div className="flex flex-col">
                                                  <label className="text-xs text-gray-500 mb-1">Recording Time</label>
                                                  <Select
                                                    value={card.timeLimit}
                                                    onValueChange={value =>
                                                      updateQuestionCard(card.id, { timeLimit: value })
                                                    }
                                                  >
                                                    <SelectTrigger className="w-32">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {timeLimits.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                          {t.label}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-end">
                                              <Button
                                                variant="destructive"
                                                size="icon"
                                                disabled={questionCards.length <= 1}
                                                onClick={e => {
                                                  e.stopPropagation()
                                                  deleteQuestionCard(card.id)
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                        
                        {/* Drop zone after each card */}
                        {isDraggingPart && (
                          <div
                            className={cn(
                              "h-8 mb-2 rounded-lg border-2 border-dashed transition-all duration-200",
                              dropIndex === index + 1 
                                ? "border-[#272A69] bg-[#272A69]/5" 
                                : "border-gray-300 bg-gray-50"
                            )}
                            onDragOver={(e) => handleDragOver(e, index + 1)}
                            onDrop={(e) => handleDrop(e, index + 1)}
                          />
                        )}
                      </React.Fragment>
                    ))}

                    {provided.placeholder}

                    {/* Add Question Button */}
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => addQuestionCard('normal')}
                        className="h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-100"
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
        </div>
      </main>

      {/* Preview Modal commented out for now
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <CardHeader className="bg-[#F8F9FA] border-b">
              <CardTitle>{title || 'Untitled Assignment'}</CardTitle>
              <CardDescription>
                {template && <span>Topic: {template}</span>}
                {dueDate && (
                  <span className="block">
                    Due: {new Date(dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                {questionCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="border rounded-lg p-4 "
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <span className="text-sm text-gray-500">Time limit: {timeLimits.find(t => t.value === card.timeLimit)?.label}</span>
                    </div>

                    <p className="whitespace-pre-wrap mb-3">{card.question || 'No question text provided'}</p>

                    {card.type === 'bulletPoints' && card.bulletPoints && card.bulletPoints.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1 mb-3">
                        {card.bulletPoints.map((bullet, i) => (
                          <li key={i}>{bullet || 'Empty bullet point'}</li>
                        ))}
                      </ul>
                    )}

                    {card.speakAloud && (
                      <div className="flex items-center text-sm text-[#272A69] mt-2">
                        <Volume2 className="h-4 w-4 mr-1" />
                        <span>This question will be read aloud</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end border-t p-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Close Preview
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      */}
    </div>
  );
};

export default CreateAssignmentPage;
