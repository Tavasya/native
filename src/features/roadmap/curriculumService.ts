import { supabase } from '@/integrations/supabase/client';
import { OnboardingMetrics } from './roadmapTypes';

interface Assignment {
  id: string;
  title: string;
  type: 'conversation' | 'pronunciation';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
  content: any;
  estimated_duration: number;
}

interface CurriculumPlan {
  name: string;
  description: string;
  frequencyDays: number;
  totalWeeks: number;
  weeklyAssignments: Assignment[][];
}

interface CreateCurriculumRequest {
  userId: string;
  onboardingMetrics: OnboardingMetrics;
}

interface CreateCurriculumResponse {
  success: boolean;
  curriculumId?: string;
  error?: string;
}

// Core algorithm functions
const getFrequencyDays = (timeline: string): number => {
  switch(timeline) {
    case '1-month': return 15;    // Intensive: 3-4 assignments/week
    case '3-months': return 30;   // Focused: 2 assignments/week
    case '6-months': return 60;   // Steady: 1 assignment/week  
    case 'not-sure': return 90;   // Casual: 1 assignment/2 weeks
    default: return 60;
  }
};

const getAssignmentsPerWeek = (frequencyDays: number): number => {
  if (frequencyDays <= 15) return 10;  // Intensive - daily practice with multiple exercises
  if (frequencyDays <= 30) return 7;   // Focused - one per day
  if (frequencyDays <= 60) return 5;   // Steady - weekdays only
  return 3; // Casual - 3 times per week
};

const determineProgressionLevels = (currentLevel: string, targetScore: string): string[] => {
  const levels: string[] = [];
  
  if (currentLevel === 'BEGINNER') {
    levels.push('BEGINNER');
    // If they want high scores, give them intermediate and advanced practice
    if (['7.0', '7.5', '8.0', '8.5+'].includes(targetScore)) {
      levels.push('INTERMEDIATE');
      // For very high targets, add advanced practice
      if (['8.0', '8.5+'].includes(targetScore)) {
        levels.push('ADVANCED');
      }
    }
  } else if (currentLevel === 'INTERMEDIATE') {
    levels.push('INTERMEDIATE');
    // For high targets, add advanced practice
    if (['7.5', '8.0', '8.5+'].includes(targetScore)) {
      levels.push('ADVANCED');
    }
  } else if (currentLevel === 'ADVANCED') {
    // Advanced students only get advanced content
    levels.push('ADVANCED');
  }
  
  return levels;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeAssignments = (
  assignments: Assignment[], 
  totalWeeks: number, 
  assignmentsPerWeek: number,
  levels: string[]
): Assignment[][] => {
  const weeklyAssignments: Assignment[][] = Array.from({ length: totalWeeks }, () => []);
  
  // Group assignments by level and type
  const assignmentsByLevel: { [key: string]: { conversations: Assignment[], pronunciations: Assignment[] } } = {};
  levels.forEach(level => {
    assignmentsByLevel[level] = {
      conversations: assignments.filter(a => a.level === level && a.type === 'conversation'),
      pronunciations: assignments.filter(a => a.level === level && a.type === 'pronunciation')
    };
  });
  
  // Calculate progressive level distribution across weeks
  const levelDistribution = calculateLevelDistribution(levels, totalWeeks);
  
  // Distribute assignments week by week
  for (let week = 0; week < totalWeeks; week++) {
    const weekLevel = levelDistribution[week];
    const conversationsNeeded = Math.ceil(assignmentsPerWeek * 0.7);
    const pronunciationsNeeded = assignmentsPerWeek - conversationsNeeded;
    
    // Get available assignments for this week's level
    const availableConversations = assignmentsByLevel[weekLevel]?.conversations || [];
    const availablePronunciations = assignmentsByLevel[weekLevel]?.pronunciations || [];
    
    // Add conversations for this week
    const weekConversations = selectAssignmentsForWeek(
      availableConversations, 
      conversationsNeeded,
      week
    );
    
    // Add pronunciations for this week
    const weekPronunciations = selectAssignmentsForWeek(
      availablePronunciations,
      pronunciationsNeeded,
      week
    );
    
    // Mix conversations and pronunciations
    weeklyAssignments[week] = [...weekConversations, ...weekPronunciations];
    
    // Shuffle the week's assignments for variety
    weeklyAssignments[week] = shuffleArray(weeklyAssignments[week]);
  }
  
  return weeklyAssignments;
};

// Helper function to calculate progressive level distribution
const calculateLevelDistribution = (levels: string[], totalWeeks: number): string[] => {
  const distribution: string[] = [];
  
  if (levels.length === 1) {
    // Single level - use it for all weeks
    return Array(totalWeeks).fill(levels[0]);
  }
  
  if (levels.length === 2) {
    // Two levels - start with lower, progress to higher
    const firstLevelWeeks = Math.ceil(totalWeeks * 0.4);
    for (let i = 0; i < totalWeeks; i++) {
      distribution.push(i < firstLevelWeeks ? levels[0] : levels[1]);
    }
  } else {
    // Three levels - progressive distribution
    const firstThird = Math.ceil(totalWeeks / 3);
    const secondThird = Math.ceil((totalWeeks - firstThird) / 2);
    
    for (let i = 0; i < totalWeeks; i++) {
      if (i < firstThird) {
        distribution.push(levels[0]);
      } else if (i < firstThird + secondThird) {
        distribution.push(levels[1]);
      } else {
        distribution.push(levels[2]);
      }
    }
  }
  
  return distribution;
};

// Helper function to select assignments for a week with cycling
const selectAssignmentsForWeek = (
  availableAssignments: Assignment[],
  needed: number,
  weekIndex: number
): Assignment[] => {
  if (availableAssignments.length === 0) return [];
  
  const selected: Assignment[] = [];
  const shuffled = shuffleArray([...availableAssignments]);
  
  // Start from a different position each week to ensure variety
  const startIndex = (weekIndex * 3) % shuffled.length;
  
  for (let i = 0; i < needed; i++) {
    const index = (startIndex + i) % shuffled.length;
    selected.push(shuffled[index]);
  }
  
  return selected;
};

export const curriculumService = {
  async fetchAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('practice_assignments')
      .select('*')
      .order('level', { ascending: true });
    
    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
    
    return data || [];
  },

  async generateCurriculumPlan(onboardingMetrics: OnboardingMetrics): Promise<CurriculumPlan> {
    // Step 1: Calculate frequency and structure
    const frequencyDays = getFrequencyDays(onboardingMetrics.test_timeline);
    const assignmentsPerWeek = getAssignmentsPerWeek(frequencyDays);
    
    // Calculate total weeks based on timeline
    let totalWeeks: number;
    switch(onboardingMetrics.test_timeline) {
      case '1-month': 
        totalWeeks = 4;
        break;
      case '3-months': 
        totalWeeks = 12;
        break;
      case '6-months': 
        totalWeeks = 24;
        break;
      default: 
        totalWeeks = 8;
    }
    
    // Step 2: Determine progression levels
    const progressionLevels = determineProgressionLevels(
      onboardingMetrics.assessed_level, 
      onboardingMetrics.target_score
    );
    
    // Step 3: Fetch all assignments
    const allAssignments = await this.fetchAssignments();
    const relevantAssignments = allAssignments.filter(assignment => 
      progressionLevels.includes(assignment.level)
    );
    
    // Step 4: Distribute across weeks with progressive difficulty
    const weeklyAssignments = distributeAssignments(
      relevantAssignments, 
      totalWeeks, 
      assignmentsPerWeek,
      progressionLevels
    );
    
    // Step 5: Create curriculum plan
    const plan: CurriculumPlan = {
      name: `IELTS ${onboardingMetrics.target_score} Preparation - ${onboardingMetrics.assessed_level} Level`,
      description: `Personalized ${onboardingMetrics.assessed_level.toLowerCase()} level curriculum targeting IELTS ${onboardingMetrics.target_score} with ${onboardingMetrics.study_time} minutes daily study`,
      frequencyDays,
      totalWeeks,
      weeklyAssignments
    };
    
    return plan;
  },

  selectWithRepetition<T>(items: T[], needed: number): T[] {
    if (items.length === 0) return [];
    
    const result: T[] = [];
    const shuffled = shuffleArray(items);
    
    for (let i = 0; i < needed; i++) {
      result.push(shuffled[i % shuffled.length]);
    }
    
    return result;
  },

  async createCurriculum(request: CreateCurriculumRequest): Promise<CreateCurriculumResponse> {
    try {
      // Step 1: Generate curriculum plan
      const plan = await this.generateCurriculumPlan(request.onboardingMetrics);
      
      // Step 2: Create curriculum record
      const { data: curriculum, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .insert({
          user_id: request.userId,
          name: plan.name,
          description: plan.description,
          target_score: request.onboardingMetrics.target_score,
          current_level: request.onboardingMetrics.assessed_level,
          frequency_days: plan.frequencyDays,
          total_weeks: plan.totalWeeks,
          total_assignments: plan.weeklyAssignments.flat().length
        })
        .select()
        .single();
      
      if (curriculumError) {
        return {
          success: false,
          error: `Failed to create curriculum: ${curriculumError.message}`
        };
      }
      
      // Step 3: Create curriculum assignments
      const curriculumAssignments = plan.weeklyAssignments.flatMap((weekAssignments, weekIndex) =>
        weekAssignments.map((assignment, sequenceIndex) => ({
          curriculum_id: curriculum.id,
          assignment_id: assignment.id,
          week_number: weekIndex + 1,
          sequence_order: sequenceIndex + 1
        }))
      );
      
      const { error: assignmentsError } = await supabase
        .from('curriculum_assignments')
        .insert(curriculumAssignments);
      
      if (assignmentsError) {
        return {
          success: false,
          error: `Failed to create curriculum assignments: ${assignmentsError.message}`
        };
      }
      
      return {
        success: true,
        curriculumId: curriculum.id
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};