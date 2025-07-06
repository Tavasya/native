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
  if (frequencyDays <= 15) return 4;  // Intensive
  if (frequencyDays <= 30) return 2;  // Focused
  if (frequencyDays <= 60) return 1;  // Steady
  return 1; // Casual (will space across 2 weeks)
};

const determineProgressionLevels = (currentLevel: string, targetScore: string): string[] => {
  const levels: string[] = [];
  
  // Always start at current level or below for foundation
  if (currentLevel === 'BEGINNER') {
    levels.push('BEGINNER');
    // Add intermediate if targeting higher scores
    if (['7.0', '7.5', '8.0', '8.5+'].includes(targetScore)) {
      levels.push('INTERMEDIATE');
    }
    // Add advanced only for very high targets
    if (['8.0', '8.5+'].includes(targetScore)) {
      levels.push('ADVANCED');
    }
  } else if (currentLevel === 'INTERMEDIATE') {
    levels.push('INTERMEDIATE');
    // Add advanced for high targets
    if (['7.5', '8.0', '8.5+'].includes(targetScore)) {
      levels.push('ADVANCED');
    }
  } else if (currentLevel === 'ADVANCED') {
    // Advanced students start with intermediate for foundation, then advanced
    levels.push('INTERMEDIATE', 'ADVANCED');
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
  assignmentsPerWeek: number
): Assignment[][] => {
  const weeklyAssignments: Assignment[][] = Array.from({ length: totalWeeks }, () => []);
  const shuffledAssignments = shuffleArray(assignments);
  
  let assignmentIndex = 0;
  
  for (let week = 0; week < totalWeeks; week++) {
    for (let i = 0; i < assignmentsPerWeek && assignmentIndex < shuffledAssignments.length; i++) {
      weeklyAssignments[week].push(shuffledAssignments[assignmentIndex]);
      assignmentIndex++;
    }
    
    // If we run out of unique assignments, start reusing them
    if (assignmentIndex >= shuffledAssignments.length) {
      assignmentIndex = 0;
    }
  }
  
  return weeklyAssignments;
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
    const totalWeeks = Math.min(8, Math.ceil(60 / assignmentsPerWeek)); // Max 8 weeks
    
    // Step 2: Determine progression levels
    const progressionLevels = determineProgressionLevels(
      onboardingMetrics.assessed_level, 
      onboardingMetrics.target_score
    );
    
    // Step 3: Fetch and filter assignments
    const allAssignments = await this.fetchAssignments();
    const relevantAssignments = allAssignments.filter(assignment => 
      progressionLevels.includes(assignment.level)
    );
    
    // Step 4: Balance conversation vs pronunciation (70/30 split)
    const conversations = relevantAssignments.filter(a => a.type === 'conversation');
    const pronunciations = relevantAssignments.filter(a => a.type === 'pronunciation');
    
    const totalNeeded = totalWeeks * assignmentsPerWeek;
    const conversationCount = Math.ceil(totalNeeded * 0.7);
    const pronunciationCount = totalNeeded - conversationCount;
    
    // Select assignments with repetition if needed
    const selectedConversations = this.selectWithRepetition(conversations, conversationCount);
    const selectedPronunciations = this.selectWithRepetition(pronunciations, pronunciationCount);
    
    const allSelectedAssignments = [...selectedConversations, ...selectedPronunciations];
    
    // Step 5: Distribute across weeks
    const weeklyAssignments = distributeAssignments(allSelectedAssignments, totalWeeks, assignmentsPerWeek);
    
    // Step 6: Create curriculum plan
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