import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AssignmentPart, PartCombination } from '@/features/assignmentParts/types';

interface BuilderCanvasProps {
  selectedParts: (AssignmentPart | PartCombination)[];
  onRemovePart: (index: number) => void;
  onDragEnd: (result: any) => void;
  actualQuestions?: Array<{
    partId: string;
    questions: Array<{question: string; isEdited?: boolean; isCustom?: boolean}>
  }>;
  onRemoveCustomQuestions?: () => void;
}

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  selectedParts,
  onRemovePart,
  onDragEnd,
  actualQuestions = [],
  onRemoveCustomQuestions,
}) => {
  const getPartTypeLabel = (part: AssignmentPart | PartCombination) => {
    if (!part) return '';
    
    if (part.id === 'custom') {
      return 'Custom';
    }
    if ('part2' in part && 'part3' in part) {
      return 'Part 2 & 3';
    } else if ('part_type' in part) {
      switch (part.part_type) {
        case 'part1': return 'Part 1';
        case 'part2_3': return 'Part 2 & 3';
        case 'part2_only': return 'Part 2 Only';
        case 'part3_only': return 'Part 3 Only';
        default: return part.part_type;
      }
    }
    return '';
  };

  const getPartTypeColor = (part: AssignmentPart | PartCombination) => {
    if (!part) return 'bg-gray-100 text-gray-800';
    
    if (part.id === 'custom') {
      return 'bg-purple-100 text-purple-800';
    }
    if ('part2' in part && 'part3' in part) {
      return 'bg-blue-100 text-blue-800';
    } else if ('part_type' in part) {
      switch (part.part_type) {
        case 'part1': return 'bg-green-100 text-green-800';
        case 'part2_3': return 'bg-blue-100 text-blue-800';
        case 'part2_only': return 'bg-yellow-100 text-yellow-800';
        case 'part3_only': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getQuestionCount = (part: AssignmentPart | PartCombination) => {
    if (!part) return 0;
    
    if ('part2' in part && 'part3' in part) {
      return (part.part2?.questions?.length || 0) + (part.part3?.questions?.length || 0);
    } else if ('questions' in part) {
      return part.questions?.length || 0;
    }
    return 0;
  };

  const getPartDescription = (part: AssignmentPart | PartCombination) => {
    if (!part) return '';
    
    // Check if we have actual questions for this part
    const actualPartQuestions = actualQuestions.find(aq => aq.partId === part.id);
    
    if (actualPartQuestions) {
      // Use actual questions with edit indicators
      return actualPartQuestions.questions.map(q => {
        let questionText = q.question;
        if (q.isEdited) questionText += ' (edited)';
        if (q.isCustom) questionText += ' (custom)';
        return questionText;
      }).join(', ');
    }
    
    // Fallback to original questions
    if ('part2' in part && 'part3' in part) {
      // For combinations, show hybrid display
      const part2Questions = part.part2?.questions || [];
      const part3Questions = part.part3?.questions || [];
      
      const part2Text = part2Questions.map((q: any) => {
        let questionText = q.question;
        // Add bullet points for Part 2 questions
        if (q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
          questionText += '\n• ' + q.bulletPoints.join('\n• ');
        }
        return questionText;
      }).join(', ');
      
      const part3Text = part3Questions.map((q: any) => {
        let questionText = q.question;
        // Add commas for Part 3 questions
        if (q.bulletPoints && q.bulletPoints.length > 0) {
          questionText += ', ' + q.bulletPoints.join(', ');
        }
        return questionText;
      }).join(', ');
      
      // Show hybrid format: Part 2 with bullet points, then Part 3 with commas
      if (part2Text && part3Text) {
        return `Part 2: ${part2Text}\nPart 3: ${part3Text}`;
      } else if (part2Text) {
        return `Part 2: ${part2Text}`;
      } else if (part3Text) {
        return `Part 3: ${part3Text}`;
      }
      return '';
    } else if ('questions' in part) {
      // For individual parts, show all questions
      return part.questions?.map((q: any) => {
        let questionText = q.question;
        // Add commas for Part 1 and Part 3 questions, bullet points for Part 2
        if (part.part_type === 'part2_only' && q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
          questionText += '\n• ' + q.bulletPoints.join('\n• ');
        } else if (q.bulletPoints && q.bulletPoints.length > 0) {
          questionText += ', ' + q.bulletPoints.join(', ');
        }
        return questionText;
      }).join(', ') || '';
    }
    
    return '';
  };

  // Get all parts including custom questions
  const getAllParts = () => {
    const parts = [...selectedParts].filter(part => part != null);
    
    // Check if there are custom questions that need to be displayed
    const customQuestions = actualQuestions.find(aq => aq.partId === 'custom');
    if (customQuestions && customQuestions.questions.length > 0) {
      // Add a virtual custom part for display
      const customPart: AssignmentPart = {
        id: 'custom',
        title: 'Custom Questions',
        part_type: 'part1', // Use a valid part type
        questions: customQuestions.questions.map(q => ({
          id: `custom-${Date.now()}`,
          type: 'normal' as const,
          question: q.question,
          bulletPoints: [],
          speakAloud: false,
          timeLimit: '30'
        })),
        topic: 'Custom',
        metadata: { autoGrade: false },
        created_by: 'user',
        is_public: false,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      parts.push(customPart);
    }
    
    return parts;
  };

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

  // Custom drag and drop handler for all parts including custom
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const allParts = getAllParts();
    const reorderedItems = Array.from(allParts);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    // Update selectedParts and actualQuestions based on the new order
    const newSelectedParts: (AssignmentPart | PartCombination)[] = [];
    const newActualQuestions: Array<{partId: string; questions: Array<{question: string; isEdited?: boolean; isCustom?: boolean}>}> = [];

    reorderedItems.forEach(part => {
      if (part.id === 'custom') {
        // Handle custom part - add to actualQuestions
        const customQuestions = actualQuestions.find(aq => aq.partId === 'custom');
        if (customQuestions) {
          newActualQuestions.push(customQuestions);
        }
      } else {
        // Handle regular part
        newSelectedParts.push(part);
        const partQuestions = actualQuestions.find(aq => aq.partId === part.id);
        if (partQuestions) {
          newActualQuestions.push(partQuestions);
        }
      }
    });

    // Call the parent's onDragEnd with the new selectedParts
    onDragEnd({
      ...result,
      newSelectedParts,
      newActualQuestions
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Assignment Builder</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>
              {getAllParts().reduce((total, part) => total + getQuestionCount(part), 0)} questions
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="builder-canvas">
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {getAllParts().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No parts selected</h3>
                    <p className="text-sm">Select parts from the library to build your assignment</p>
                  </div>
                ) : (
                  getAllParts().map((part, index) => (
                    <Draggable key={`${part.id}-${index}`} draggableId={`${part.id}-${index}`} index={index}>
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="mt-1">
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>

                                {/* Part Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-sm truncate">{part.title}</h4>
                                    <Badge className={`text-xs ${getPartTypeColor(part)}`}>
                                      {getPartTypeLabel(part)}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-xs text-gray-600 mb-2 whitespace-pre-line">
                                    {getPartDescription(part)}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{getQuestionCount(part)} questions</span>
                                    </div>
                                    {part.topic && (
                                      <Badge variant="outline" className="text-xs">
                                        {part.topic}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 ml-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          // For custom parts, we need to handle removal differently
                                          if (part.id === 'custom') {
                                            // Remove custom questions from actualQuestions
                                            onRemoveCustomQuestions?.();
                                          } else {
                                            onRemovePart(index);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove part</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Summary */}
        {getAllParts().length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <span>Total questions: {getAllParts().reduce((total, part) => total + getQuestionCount(part), 0)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BuilderCanvas; 