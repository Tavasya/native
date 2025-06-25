import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { AssignmentPart, PartCombination, PartType } from '@/features/assignmentParts/types';
import type { QuestionCard } from '@/features/assignments/types';

type PartWithType = AssignmentPart & { itemType: 'part' };
type CombinationWithType = PartCombination & { itemType: 'combination' };
type ItemWithType = PartWithType | CombinationWithType;

interface PartLibraryProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTopic: string | undefined;
  onTopicChange: (topic: string | undefined) => void;
  selectedPartType: PartType | undefined;
  onPartTypeChange: (partType: PartType | undefined) => void;
  onClearFilters: () => void;
  parts: AssignmentPart[];
  combinations: PartCombination[];
  partsLoading: boolean;
  onAddPart: (part: AssignmentPart | PartCombination) => void;
  onDragStart: (part: AssignmentPart | PartCombination) => void;
  onDragEnd: () => void;
}

const PartLibrary: React.FC<PartLibraryProps> = ({
  isOpen,
  onToggle,
  searchQuery,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  selectedPartType,
  onPartTypeChange,
  onClearFilters,
  parts,
  combinations,
  partsLoading,
  onAddPart,
  onDragStart,
  onDragEnd,
}) => {
  // Filter parts based on search and filters
  const filteredParts = parts.filter((part: AssignmentPart) => {
    const matchesSearch = part.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         part.questions.some((q: QuestionCard) => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = !selectedTopic || part.topic === selectedTopic;
    const matchesType = !selectedPartType || part.part_type === selectedPartType;
    
    return matchesSearch && matchesTopic && matchesType;
  });

  const filteredCombinations = combinations.filter((combo: PartCombination) => {
    const matchesSearch = combo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = !selectedTopic || combo.topic === selectedTopic;
    
    return matchesSearch && matchesTopic;
  });

  // Combine all items and add type for consistent handling
  const allItems = [
    ...filteredParts.map(part => ({ ...part, itemType: 'part' as const })),
    ...filteredCombinations.map(combo => ({ ...combo, itemType: 'combination' as const }))
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Fixed to show 4 items per page
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, selectedPartType]);
  
  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = allItems.slice(startIndex, startIndex + itemsPerPage);
  
  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Helper function to get part type display name
  const getPartTypeLabel = (item: ItemWithType) => {
    if (item.itemType === 'combination') {
      return 'Part 2 & 3';
    }
    
    switch (item.part_type) {
      case 'part1':
        return 'Part 1';
      case 'part2_only':
        return 'Part 2';
      case 'part3_only':
        return 'Part 3';
      case 'part2_3':
        return 'Part 2 & 3';
      default:
        return item.part_type;
    }
  };

  // Helper function to get badge colors based on part type
  const getBadgeColors = (item: ItemWithType) => {
    if (item.itemType === 'combination') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    switch (item.part_type) {
      case 'part1':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'part2_only':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'part3_only':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'part2_3':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get hover border color
  const getHoverBorderColor = (item: ItemWithType) => {
    if (item.itemType === 'combination') {
      return 'hover:border-purple-500';
    }
    
    switch (item.part_type) {
      case 'part1':
        return 'hover:border-blue-500';
      case 'part2_only':
        return 'hover:border-green-500';
      case 'part3_only':
        return 'hover:border-orange-500';
      case 'part2_3':
        return 'hover:border-indigo-500';
      default:
        return 'hover:border-gray-500';
    }
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out fixed left-0 z-10",
      "top-16 h-[calc(100vh-64px)]", // Start after navbar (64px) and adjust height
      isOpen ? "w-80" : "w-12"
    )}>
      {isOpen ? (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Part Library</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="space-y-2">
              <Select value={selectedTopic || 'all'} onValueChange={(value) => onTopicChange(value === 'all' ? undefined : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  <SelectItem value="Work & Education">Work & Education</SelectItem>
                  <SelectItem value="Education & Culture">Education & Culture</SelectItem>
                  <SelectItem value="Media & Communication">Media & Communication</SelectItem>
                  <SelectItem value="Lifestyle & Habits">Lifestyle & Habits</SelectItem>
                  <SelectItem value="Sustainability">Sustainability</SelectItem>
                  <SelectItem value="Planning & Events">Planning & Events</SelectItem>
                  <SelectItem value="Decision Making">Decision Making</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="Personal Experience">Personal Experience</SelectItem>
                  <SelectItem value="Sports & Leisure">Sports & Leisure</SelectItem>
                  <SelectItem value="Personal & Relationships">Personal & Relationships</SelectItem>
                  <SelectItem value="Health & Lifestyle">Health & Lifestyle</SelectItem>
                  <SelectItem value="Communication Skills">Communication Skills</SelectItem>
                  <SelectItem value="Consumer Rights">Consumer Rights</SelectItem>
                  <SelectItem value="Fashion & Appearance">Fashion & Appearance</SelectItem>
                  <SelectItem value="Nature & Environment">Nature & Environment</SelectItem>
                  <SelectItem value="Personal Development">Personal Development</SelectItem>
                  <SelectItem value="Children & Society">Children & Society</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedPartType || 'all'} onValueChange={(value) => onPartTypeChange(value === 'all' ? undefined : value as PartType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="part1">Part 1</SelectItem>
                  <SelectItem value="part2_3">Part 2 & 3</SelectItem>
                  <SelectItem value="part2_only">Part 2</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Parts List */}
          <div className="flex-1 overflow-y-auto p-4">
            {partsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading parts...</div>
            ) : (
              <div className="space-y-2">
                {currentItems.length > 0 ? (
                  currentItems.map((item, index) => {
                    const isIndividualPart = item.itemType === 'part';
                    const questions = isIndividualPart 
                      ? (item as AssignmentPart).questions
                      : [];
                    const description = isIndividualPart
                      ? questions.map((q: QuestionCard) => {
                          let questionText = q.question;
                          // Add commas for Part 1 and Part 3 questions, bullet points for Part 2
                          if (item.part_type === 'part2_only' && q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
                            questionText += '\n• ' + q.bulletPoints.join('\n• ');
                          } else if (q.bulletPoints && q.bulletPoints.length > 0) {
                            questionText += ', ' + q.bulletPoints.join(', ');
                          }
                          return questionText;
                        }).join(', ')
                      : (() => {
                          // For combinations, show hybrid display
                          const combo = item as PartCombination;
                          const part2Questions = combo.part2?.questions || [];
                          const part3Questions = combo.part3?.questions || [];
                          
                          const part2Text = part2Questions.map((q: QuestionCard) => {
                            let questionText = q.question;
                            // Add bullet points for Part 2 questions
                            if (q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
                              questionText += '\n• ' + q.bulletPoints.join('\n• ');
                            }
                            return questionText;
                          }).join(', ');
                          
                          const part3Text = part3Questions.map((q: QuestionCard) => {
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
                          return 'Part 2 & 3 combination';
                        })();
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                      >
                        <Card
                          className={cn(
                            "cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-2 border-transparent",
                            getHoverBorderColor(item)
                          )}
                          draggable
                          onDragStart={() => onDragStart(item)}
                          onDragEnd={onDragEnd}
                          onClick={() => onAddPart(item)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium truncate">{item.title}</h5>
                                <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                                  {description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={cn("text-xs border", getBadgeColors(item))}>
                                    {getPartTypeLabel(item)}
                                  </Badge>
                                  {item.topic && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.topic}
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-gray-600 font-medium">
                                  Drag to insert or click to add
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No parts found</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center w-full max-w-xs mx-auto">
                {/* Prev Arrow */}
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={cn(
                    "w-8 h-8 rounded text-sm flex items-center justify-center",
                    currentPage === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  &#8592;
                </button>
                {/* Page Numbers with Ellipsis */}
                <div className="flex gap-1 flex-1 justify-center">
                  {(() => {
                    const pages = [];
                    const maxPagesToShow = 5;
                    if (totalPages <= maxPagesToShow) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, '...', totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }
                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={cn(
                            "w-8 h-8 rounded text-sm transition-colors flex items-center justify-center",
                            page === currentPage
                              ? "bg-[#272A69] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>
                {/* Next Arrow */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "w-8 h-8 rounded text-sm flex items-center justify-center",
                    currentPage === totalPages ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  &#8594;
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(true)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PartLibrary;