import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { scenarios, type Scenario } from './scenario-dashboard';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { supabase } from '@/integrations/supabase/client';
import { completionService } from '@/features/roadmap';
import { StreakCalendar } from './StreakCalendar';
import { wordService } from '@/features/words';
import Navbar from './NavBar';

interface Assignment {
  id: string;
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  completed: boolean;
  type: 'Conversation' | 'Pronunciation';
  icon: string;
  description: string;
  scenario?: Scenario;
  content: any;
}

interface Week {
  weekNumber: number;
  assignments: Assignment[];
  completed: number;
  total: number;
  expanded: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);

  const [weeks, setWeeks] = useState<Week[]>([]);

  // Load user's personalized curriculum from database
  const loadCurriculum = async () => {
    if (!user?.id) {
      setLoadingCurriculum(false);
      return;
    }

    try {
      // Fetch user's curriculum
      const { data: curriculum, error: curriculumError } = await supabase
        .from('personalized_curricula')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (curriculumError || !curriculum) {
        console.log('No personalized curriculum found, using default scenarios');
        // Fallback to default scenarios
        const defaultWeek: Week = {
          weekNumber: 1,
          expanded: true,
          completed: 0,
          total: scenarios.length,
          assignments: scenarios.map((scenario) => ({
            id: scenario.id,
            title: scenario.name,
            difficulty: scenario.level,
            duration: `${scenario.turns * 3} mins`,
            completed: false,
            type: 'Conversation' as const,
            icon: scenario.icon,
            description: scenario.description,
            scenario: scenario,
            content: scenario
          }))
        };
        setWeeks([defaultWeek]);
        setLoadingCurriculum(false);
        return;
      }

      // Fetch curriculum assignments
      const { data: curriculumAssignments, error: assignmentsError } = await supabase
        .from('curriculum_assignments')
        .select('*')
        .eq('curriculum_id', curriculum.id)
        .order('week_number')
        .order('sequence_order');

      if (assignmentsError) {
        console.error('Error fetching curriculum assignments:', assignmentsError);
        setLoadingCurriculum(false);
        return;
      }

      // Fetch practice assignments separately
      const assignmentIds = curriculumAssignments.map(ca => ca.assignment_id);
      const { data: practiceAssignments, error: practiceError } = await supabase
        .from('practice_assignments')
        .select('*')
        .in('id', assignmentIds);

      if (practiceError) {
        console.error('Error fetching practice assignments:', practiceError);
        setLoadingCurriculum(false);
        return;
      }

      // Create a map of assignment ID to assignment data
      const assignmentMap = new Map();
      practiceAssignments.forEach(assignment => {
        assignmentMap.set(assignment.id, assignment);
      });

      // Group assignments by week
      const weekMap = new Map<number, Assignment[]>();
      
      curriculumAssignments.forEach((item) => {
        const assignment = assignmentMap.get(item.assignment_id);
        if (!assignment) return;

        const weekNumber = item.week_number;
        
        const formattedAssignment: Assignment = {
          id: assignment.id,
          title: assignment.title,
          difficulty: assignment.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
          duration: `${assignment.estimated_duration || 10} mins`,
          completed: item.is_completed,
          type: assignment.type === 'conversation' ? 'Conversation' : 'Pronunciation',
          icon: assignment.type === 'conversation' ? 
            (assignment.content.icon || '💬') : '🗣️',
          description: assignment.description || '',
          content: assignment.content,
          scenario: assignment.type === 'conversation' ? {
            id: assignment.content.id || assignment.id,
            name: assignment.content.name || assignment.title,
            level: assignment.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
            description: assignment.content.description || assignment.description,
            greeting: assignment.content.greeting || '',
            instructions: assignment.content.instructions || '',
            turns: assignment.content.turns || 5,
            icon: assignment.content.icon || '💬',
            conversationScript: assignment.content.conversationScript || []
          } : undefined
        };

        if (!weekMap.has(weekNumber)) {
          weekMap.set(weekNumber, []);
        }
        weekMap.get(weekNumber)!.push(formattedAssignment);
      });

      // Convert to weeks array
      const weeksArray: Week[] = Array.from(weekMap.entries()).map(([weekNumber, assignments]) => ({
        weekNumber,
        expanded: weekNumber === 1, // Expand first week by default
        assignments,
        completed: assignments.filter(a => a.completed).length,
        total: assignments.length
      }));

      setWeeks(weeksArray);
      console.log(`📚 Loaded personalized curriculum with ${weeksArray.length} weeks`);
    } catch (error) {
      console.error('Error loading curriculum:', error);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const totalCompleted = weeks.reduce((sum, week) => sum + week.completed, 0);
  const totalAssignments = weeks.reduce((sum, week) => sum + week.total, 0);

  // Load curriculum and word count on component mount
  useEffect(() => {
    loadCurriculum();
    loadWordCount();
  }, [user?.id]);

  const loadWordCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await wordService.getUserWordCount(user.id);
      setWordsLearned(count);
    } catch (error) {
      console.error('Error loading word count:', error);
    }
  };

  // Show completion celebration when returning from a completed conversation
  useEffect(() => {
    if (location.state?.justCompleted) {
      const scenarioName = location.state.completedScenario;
      console.log(`🎉 Welcome back! You completed: ${scenarioName}`);
      
      // Refresh the curriculum to show updated completion status
      loadCurriculum();
      
      // Clear the state to prevent repeated notifications
      navigate('/luna/dashboard', { replace: true });
    }
  }, [location.state, navigate]);

  const toggleWeek = (weekIndex: number) => {
    setWeeks(prev => prev.map((week, index) => 
      index === weekIndex ? { ...week, expanded: !week.expanded } : week
    ));
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    if (assignment.type === 'Conversation' && assignment.scenario) {
      // Navigate to Luna app for conversation practice
      navigate('/luna/', { 
        state: { 
          selectedScenario: assignment.scenario,
          assignmentId: assignment.id  // Pass the actual assignment UUID
        } 
      });
    } else if (assignment.type === 'Pronunciation') {
      // TODO: Navigate to pronunciation practice
      console.log('Pronunciation practice not implemented yet:', assignment.title);
      // For now, show the transcript
      alert(`Pronunciation Practice: ${assignment.title}\n\nPractice saying:\n"${assignment.content.transcript}"`);
    }
  };

  const toggleAssignment = async (assignmentId: string, assignmentType: 'Conversation' | 'Pronunciation', assignmentTitle: string) => {
    // Find the assignment to check its current status
    const currentAssignment = weeks.flatMap(w => w.assignments).find(a => a.id === assignmentId);
    const isCurrentlyCompleted = currentAssignment?.completed || false;
    
    // Only allow manual completion for pronunciations, or unchecking for conversations
    if (assignmentType === 'Conversation' && !isCurrentlyCompleted) {
      // For conversations, they need to complete it through practice, not by checkbox
      alert('Complete this conversation by practicing it! Click the assignment to start.');
      return;
    }

    if (user?.id && !isCurrentlyCompleted) {
      // Mark as complete in database
      const result = await completionService.markAssignmentComplete({
        userId: user.id,
        assignmentId: assignmentId,
        assignmentType: assignmentType.toLowerCase() as 'conversation' | 'pronunciation',
        scenarioName: assignmentTitle
      });

      if (!result.success) {
        console.error('Failed to mark assignment complete:', result.error);
        alert('Failed to save completion. Please try again.');
        return;
      }
    }

    // Update local state
    setWeeks(prev => prev.map(week => ({
      ...week,
      assignments: week.assignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, completed: !assignment.completed }
          : assignment
      ),
      completed: week.assignments.filter(a => 
        a.id === assignmentId ? !a.completed : a.completed
      ).length
    })));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'text-green-600';
      case 'INTERMEDIATE': return 'text-yellow-600';
      case 'ADVANCED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Conversation': return 'bg-blue-100 text-blue-700';
      case 'Pronunciation': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 pt-20">
        {/* Header */}
        <div className="mb-8">

          {/* Streak Calendar and Vocabulary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Streak Calendar - takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <StreakCalendar />
            </div>

            {/* Vocabulary Stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-600 text-sm">VOCABULARY</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">{wordsLearned}</div>
              <div className="text-sm text-gray-600 mb-4">Words saved</div>
              
              {/* Quick action button for vocabulary (placeholder for future implementation) */}
              <button 
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  // TODO: Navigate to vocabulary page when implemented
                  alert('Vocabulary feature coming soon! You\'ll be able to save and review words here.');
                }}
              >
                Review Words
              </button>
            </div>
          </div>


          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">COMPLETED {totalCompleted} / {totalAssignments}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(totalCompleted / totalAssignments) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingCurriculum ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your personalized curriculum...</p>
          </div>
        ) : (
          /* Week Sections */
          <div className="space-y-4">
            {weeks.map((week, weekIndex) => (
            <div key={week.weekNumber} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 rounded-t-2xl"
                onClick={() => toggleWeek(weekIndex)}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Week {week.weekNumber}</h2>
                  <span className="text-sm text-gray-600">{week.completed} / {week.total}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(week.completed / week.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {week.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {week.expanded && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {week.assignments.map((assignment, index) => (
                      <div 
                        key={assignment.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200"
                        onClick={() => handleAssignmentClick(assignment)}
                      >
                        <div className="w-6 text-center text-sm font-medium text-gray-500">
                          {index + 1}
                        </div>
                        <div className="text-2xl">
                          {assignment.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`font-medium ${assignment.completed ? 'line-through text-gray-500' : 'text-blue-600 hover:text-blue-700'}`}>
                              {assignment.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(assignment.difficulty)} bg-opacity-10`}>
                              {assignment.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {assignment.duration}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {assignment.description}
                          </p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full ${getTypeColor(assignment.type)}`}>
                          {assignment.type}
                        </span>
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            assignment.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAssignment(assignment.id, assignment.type, assignment.title);
                          }}
                        >
                          {assignment.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;