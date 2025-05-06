import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Volume2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppDispatch } from '@/app/hooks';
import { createAssignment } from '@/features/assignments/assignmentThunks';
import { useAppSelector } from '@/app/hooks';

interface QuestionCard {
  id: string;
  type: 'normal' | 'bulletPoints';
  question: string;
  bulletPoints?: string[];
  speakAloud: boolean;
  timeLimit: string;
}

const CreateAssignmentPage: React.FC = () => {
  const user = useAppSelector(state => state.auth.user?.id);

  const navigate = useNavigate();
  const { id: classId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [autoSendReport, setAutoSendReport] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [questionCards, setQuestionCards] = useState<QuestionCard[]>([
    {
      id: 'card-1',
      type: 'normal',
      question: '',
      speakAloud: false,
      timeLimit: '5'
    }
  ]);
  const [activeCardId, setActiveCardId] = useState('1');
  const [activeHeaderCard, setActiveHeaderCard] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Template topics
  const templateTopics = [
    'Math',
    'Science',
    'English Language Arts',
    'History',
    'Geography',
    'Art',
    'Music',
    'Physical Education',
    'Technology',
    'Foreign Language',
    'Custom'
  ];

  // Time limit options in minutes
  const timeLimits = [
    { value: "1", label: "1 minute" },
    { value: "2", label: "2 minutes" },
    { value: "3", label: "3 minutes" },
    { value: "4", label: "4 minutes" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },

  ];

  // Card operations
  const addQuestionCard = (type: 'normal' | 'bulletPoints' = 'normal') => {
    const newCard: QuestionCard = {
      id: `card-${Date.now().toString()}`,
      type,
      question: '',
      speakAloud: false,
      timeLimit: '5'
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

  const updateBulletPoint = (cardId: string, index: number, value: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        const newBulletPoints = [...(card.bulletPoints || [])];
        newBulletPoints[index] = value;
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

    // In a real app, this would save the assignment to a database
    try {
      await dispatch(
        createAssignment({
          class_id: classId!,
          created_by: user || '',
          title,
          prompt: description,
          topic: template,
          due_date: dueDate,
          questions: questionCards,
          metadata: { autoSendReport },
          status: 'not_started',
        })
      ).unwrap();
      
      toast({ title: 'Assignment published', description: 'The assignment has been published successfully' });
      navigate(`/class/${classId}`);
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err || 'Could not create assignment' });
    }
    // Navigate back to class detail page
    navigate(`/class/${classId}`);
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

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

          <Button
            onClick={handleSubmit}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            Publish
          </Button>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Header Card with title, description, settings */}
          <Card
            className={cn(
              "mb-4 overflow-hidden border-0 shadow-sm rounded-lg transition-all duration-200",
              activeHeaderCard ? "ring-2 ring-blue-500" : ""
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
            <CardContent className="p-6 space-y-6">
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
                    placeholder="Untitled Assignment"
                    className="border-none text-xl font-medium p-0 bg-transparent mb-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className={cn(
                  "bg-gray-50 px-4 py-3 rounded-md transition-all duration-200",
                  activeHeaderCard ? "bg-gray-50" : "bg-transparent"
                )}>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => {
                      setActiveCardId('');
                      setActiveHeaderCard(true);
                    }}
                    placeholder="Assignment description"
                    className="border-none text-xl font-medium p-0 bg-transparent mb-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Settings - Only show if header card is active */}
              {activeHeaderCard && (
                <div className="space-y-5 pt-3 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Template Topic */}
                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-sm font-medium">Template Topic</Label>
                      <Select value={template} onValueChange={setTemplate}>
                        <SelectTrigger id="template" className="border rounded-md">
                          <SelectValue placeholder="Select a template topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateTopics.map((topic) => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                      <Input
  id="dueDate"
  type="date"
  value={dueDate}
  onChange={(e) => setDueDate(e.target.value)}
  min={new Date().toISOString().split("T")[0]}
  className="
    border
    rounded-md
    focus:outline-none
    focus:ring-0
    focus-visible:ring-0
    focus:ring-offset-0
    focus-visible:ring-offset-0
  "
/>
                    </div>
                  </div>

                  {/* Auto-send Report Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSendReport"
                      checked={autoSendReport}
                      onCheckedChange={setAutoSendReport}
                    />
                    <Label htmlFor="autoSendReport" className="text-sm font-medium cursor-pointer">
                      Auto-send report to students
                    </Label>
                  </div>
                </div>
              )}
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
                  {questionCards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          // {...provided.dragHandleProps}
                          className={cn(
                            "mb-4 relative rounded-lg overflow-hidden",
                            activeCardId === card.id && "ring-2 ring-blue-500"
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
                          <Card className="border-0 shadow-sm">

                            <div {...provided.dragHandleProps} className="flex justify-center">
                              <DragHandle />
                            </div>
                            <CardContent className="p-6">
                              <AnimatePresence>
                                <motion.div
                                  className="space-y-4"
                                  initial={{ height: "auto" }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: "auto" }}
                                  transition={{ duration: 0.2 }}
                                >
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
{/* Bullet Points */}
{card.type === "bulletPoints" && (
  <div
    className={cn(
      "p-4 rounded-lg",
      activeCardId === card.id ? "bg-gray-50" : ""  /* only gray when active */
    )}
  >
    <h4 className="text-sm font-medium mb-3">Bullet Points</h4>
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
                                  {activeCardId === card.id && (
                                    <motion.div
                                      className="flex flex-col space-y-4"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <div className="flex items-center justify-between gap-4">
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
                                                ? "Normal Question"
                                                : "Cue Card Question"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="normal">Normal Question</SelectItem>
                                            <SelectItem value="bulletPoints">
                                              Cue Card Question
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
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
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            id={`speakAloud-${card.id}`}
                                            checked={card.speakAloud}
                                            onCheckedChange={checked =>
                                              updateQuestionCard(card.id, { speakAloud: checked })
                                            }
                                          />
                                          <Label
                                            htmlFor={`speakAloud-${card.id}`}
                                            className="text-sm font-medium cursor-pointer flex items-center space-x-2"
                                          >
                                            <Volume2 className="h-4 w-4" />
                                            <span>Read question aloud</span>
                                          </Label>
                                        </div>
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
                                    </motion.div>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}

                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Floating action buttons on the right */}
          <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => addQuestionCard('normal')}
                    className="h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-100"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Add Question</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowPreview(!showPreview)}
                    className={cn(
                      "h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-100 mt-4",
                      showPreview && "bg-blue-100 text-blue-700"
                    )}
                  >
                    <Eye className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Preview</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
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
                      <div className="flex items-center text-sm text-blue-600 mt-2">
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
    </div>
  );
};

export default CreateAssignmentPage;
