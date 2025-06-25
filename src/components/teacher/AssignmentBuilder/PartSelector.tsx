import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AssignmentPart, PartCombination, PartType } from '@/features/assignmentParts/types';

interface PartSelectorProps {
  parts: AssignmentPart[];
  combinations: PartCombination[];
  loading: boolean;
  selectedTopic?: string;
  selectedPartType?: PartType;
  onTopicChange: (topic: string | undefined) => void;
  onPartTypeChange: (partType: PartType | undefined) => void;
  onClearFilters: () => void;
  onAddPart: (part: AssignmentPart | PartCombination) => void;
}

const PartSelector: React.FC<PartSelectorProps> = ({
  parts,
  combinations,
  loading,
  selectedTopic,
  selectedPartType,
  onTopicChange,
  onPartTypeChange,
  onClearFilters,
  onAddPart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique topics from parts and combinations
  const topics = useMemo(() => {
    const partTopics = parts.map(part => part.topic).filter(Boolean) as string[];
    const comboTopics = combinations.map(combo => combo.topic).filter(Boolean) as string[];
    return [...new Set([...partTopics, ...comboTopics])].sort();
  }, [parts, combinations]);

  // Filter parts based on search and filters
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      // Search filter
      if (searchTerm && !part.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !part.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Topic filter
      if (selectedTopic && part.topic !== selectedTopic) {
        return false;
      }
      
      // Part type filter
      if (selectedPartType && part.part_type !== selectedPartType) {
        return false;
      }
      
      return true;
    });
  }, [parts, searchTerm, selectedTopic, selectedPartType]);

  // Filter combinations based on search and filters
  const filteredCombinations = useMemo(() => {
    return combinations.filter(combo => {
      // Search filter
      if (searchTerm && !combo.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !combo.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Topic filter
      if (selectedTopic && combo.topic !== selectedTopic) {
        return false;
      }
      
      return true;
    });
  }, [combinations, searchTerm, selectedTopic]);

  const getPartTypeLabel = (type: PartType) => {
    switch (type) {
      case 'part1': return 'Part 1';
      case 'part2_3': return 'Part 2 & 3';
      case 'part2_only': return 'Part 2 Only';
      case 'part3_only': return 'Part 3 Only';
      default: return type;
    }
  };

  const handleAddPart = (part: AssignmentPart | PartCombination) => {
    onAddPart(part);
    // Optional: Show feedback
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading Parts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Part Library
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {(selectedTopic || selectedPartType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Topic Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Topic</Label>
            <Select value={selectedTopic || 'all'} onValueChange={(value) => onTopicChange(value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
                {topics.map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Part Type Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Part Type</Label>
            <Select value={selectedPartType || 'all'} onValueChange={(value) => onPartTypeChange(value === 'all' ? undefined : value as PartType)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="part1">Part 1</SelectItem>
                <SelectItem value="part2_3">Part 2 & 3</SelectItem>
                <SelectItem value="part2_only">Part 2 Only</SelectItem>
                <SelectItem value="part3_only">Part 3 Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Parts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {filteredParts.length === 0 && filteredCombinations.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-gray-500"
              >
                <p>No parts found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </motion.div>
            ) : (
              <>
                {filteredParts.map((part) => (
                  <motion.div
                    key={part.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleAddPart(part)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{part.title}</h4>
                    </div>
                    
                    {/* Show questions with bullet points for Part 2 */}
                    <div className="text-xs text-gray-600 mb-2 whitespace-pre-line">
                      {part.questions.map((q: any, index: number) => {
                        let questionText = q.question;
                        // Add commas for Part 1 and Part 3 questions, bullet points for Part 2
                        if (part.part_type === 'part2_only' && q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
                          questionText += '\n• ' + q.bulletPoints.join('\n• ');
                        } else if (q.bulletPoints && q.bulletPoints.length > 0) {
                          questionText += ', ' + q.bulletPoints.join(', ');
                        }
                        return (
                          <div key={index} className="mb-1">
                            {questionText}
                          </div>
                        );
                      })}
                    </div>
                    
                    {part.description && (
                      <p className="text-xs text-gray-600 mb-2">{part.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getPartTypeLabel(part.part_type)}
                      </Badge>
                      {part.topic && (
                        <Badge variant="secondary" className="text-xs">
                          {part.topic}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{part.questions.length} questions</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filteredCombinations.map((combo) => (
                  <motion.div
                    key={combo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleAddPart(combo)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{combo.title}</h4>
                    </div>
                    
                    {/* Show questions with bullet points for combinations */}
                    <div className="text-xs text-gray-600 mb-2 whitespace-pre-line">
                      {/* Part 2 questions */}
                      {combo.part2?.questions && combo.part2.questions.length > 0 && (
                        <div className="mb-1">
                          <strong>Part 2:</strong> {combo.part2.questions.map((q: any) => {
                            let questionText = q.question;
                            // Add bullet points for Part 2 questions
                            if (q.type === 'bulletPoints' && q.bulletPoints && q.bulletPoints.length > 0) {
                              questionText += '\n• ' + q.bulletPoints.join('\n• ');
                            }
                            return questionText;
                          }).join(', ')}
                        </div>
                      )}
                      {/* Part 3 questions */}
                      {combo.part3?.questions && combo.part3.questions.length > 0 && (
                        <div className="mb-1">
                          <strong>Part 3:</strong> {combo.part3.questions.map((q: any) => {
                            let questionText = q.question;
                            // Add commas for Part 3 questions
                            if (q.bulletPoints && q.bulletPoints.length > 0) {
                              questionText += ', ' + q.bulletPoints.join(', ');
                            }
                            return questionText;
                          }).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {combo.description && (
                      <p className="text-xs text-gray-600 mb-2">{combo.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Part 2 & 3
                      </Badge>
                      {combo.topic && (
                        <Badge variant="secondary" className="text-xs">
                          {combo.topic}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {((combo.part2?.questions?.length || 0) + (combo.part3?.questions?.length || 0))} questions
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartSelector; 