import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { AssignmentPart, PartCombination, PartType } from '@/features/assignmentParts/types';

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
                         part.questions.some((q: any) => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Helper function to get part type display name
  const getPartTypeLabel = (item: any) => {
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
  const getBadgeColors = (item: any) => {
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
  const getHoverBorderColor = (item: any) => {
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
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
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
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
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
                  <SelectItem value="part3_only">Part 3</SelectItem>
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
                {allItems.length > 0 ? (
                  allItems.map((item, index) => {
                    const isIndividualPart = item.itemType === 'part';
                    const questions = isIndividualPart 
                      ? (item as AssignmentPart).questions
                      : [];
                    const description = isIndividualPart
                      ? questions.map((q: any) => q.question).join(' • ')
                      : 'Part 2 & 3 combination';
                    
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
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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