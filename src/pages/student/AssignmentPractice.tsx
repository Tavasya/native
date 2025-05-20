import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Assignment } from "@/features/assignments/types_practice";
import CompletionScreen from "@/components/assignment/CompletionScreen";
import AssignmentOverview from "@/components/assignment/AssignmentOverview";
import QuestionNavigation from "@/components/assignment/QuestionNavigation";
import QuestionContent from "@/components/assignment/QuestionContent";

// Sample assignment data with more questions
const mockAssignment: Assignment = {
  id: "2",
  title: "IELTS Speaking Practice",
  description: "Record a 2-minute response to the provided speaking prompt",
  dueDate: "May 25, 2025",
  totalQuestions: 10,
  estimatedTime: "20 minutes",
  instructions: [
    "This assignment contains 3 speaking tasks similar to the IELTS speaking test.",
    "For each task, read the question carefully and record your response.",
    "Aim to speak clearly and naturally, using a variety of vocabulary and sentence structures.",
    "The estimated completion time for this assignment is 20 minutes."
  ],
  questions: [
    {
      id: 1,
      type: "cueCard",
      content: "Describe a memorable trip you had.",
      instructions: [
        "When you went",
        "Who you went with",
        "What you did there",
        "And explain why it was memorable."
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 2,
      type: "regular",
      content: "Do you think international travel is important for young people? Why or why not?",
      estimatedTime: "1 minute",
      isCompleted: false
    },
    {
      id: 3,
      type: "cueCard",
      content: "Describe a skill you would like to learn.",
      instructions: [
        "What the skill is",
        "How you would learn it",
        "How long it would take to learn",
        "Why you want to learn it"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 4,
      type: "regular",
      content: "How do you think technology has changed the way people learn new skills?",
      estimatedTime: "1 minute",
      isCompleted: false
    },
    {
      id: 5,
      type: "cueCard",
      content: "Describe a time when you helped someone.",
      instructions: [
        "Who you helped",
        "When this happened",
        "How you helped them",
        "And how you felt about helping"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 6,
      type: "regular",
      content: "Do you think people today help each other more or less than in the past?",
      estimatedTime: "1 minute",
      isCompleted: false
    },
    {
      id: 7,
      type: "cueCard",
      content: "Describe an important decision you made.",
      instructions: [
        "What the decision was",
        "When you made it",
        "How you made the decision",
        "And explain why it was important"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 8,
      type: "regular",
      content: "Do you think young people and older people make decisions differently?",
      estimatedTime: "1 minute",
      isCompleted: false
    },
    {
      id: 9,
      type: "cueCard",
      content: "Describe a place you like to visit but don't want to live in.",
      instructions: [
        "Where it is",
        "When you visited it",
        "What you like about it",
        "And why you wouldn't want to live there",
        "Provide detailed examples of your experiences there",
        "Talk about any memorable moments you had during your visits",
        "Explain what characteristics make it a good place to visit",
        "Discuss the specific reasons that would make living there challenging for you",
        "Compare it with other places you've visited or lived in"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 10,
      type: "regular",
      content: "How have cities changed in your country in recent years?",
      estimatedTime: "1 minute",
      isCompleted: false
    }
  ]
};

// Practice assignment for use when no specific assignment is provided
const practiceMockAssignment: Assignment = {
  id: "practice",
  title: "Practice Speaking Skills",
  description: "Record responses to speaking prompts to improve your skills",
  dueDate: "Self-practice",
  totalQuestions: 3,
  estimatedTime: "10 minutes",
  instructions: [
    "This is a self-practice session to help you improve your speaking skills.",
    "Select any question that you'd like to practice.",
    "Record your response and listen to it to identify areas for improvement.",
    "You can repeat this practice as many times as you want."
  ],
  questions: [
    {
      id: 1,
      type: "cueCard",
      content: "Describe a book you have recently read.",
      instructions: [
        "What the book was about",
        "When you read it",
        "What you liked or disliked about it",
        "And explain why you would recommend it to others"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    },
    {
      id: 2,
      type: "regular",
      content: "How have your reading habits changed over time?",
      estimatedTime: "1 minute",
      isCompleted: false
    },
    {
      id: 3,
      type: "cueCard",
      content: "Describe your ideal job.",
      instructions: [
        "What kind of job it would be",
        "What skills would be required",
        "Where you would work",
        "And why this would be ideal for you"
      ],
      estimatedTime: "2 minutes",
      isCompleted: false
    }
  ]
};

const AssignmentPractice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const shouldShowOverview = queryParams.get('showOverview') === 'true';
  
  // State for the current assignment and current question
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120); // Default 2 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showOverview, setShowOverview] = useState(true); // Default to true, will be updated based on query param
  
  // Fetch the assignment data
  useEffect(() => {
    // In a real app, we would fetch from an API based on the id
    
    // If no ID is provided, we're in general practice mode
    if (!id) {
      setAssignment(practiceMockAssignment);
      setShowOverview(true);
      return;
    }
    
    const savedProgress = localStorage.getItem(`assignment_progress_${id}`);
    
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setAssignment(progress.assignment);
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      
      // If the user is continuing an assignment, don't show overview
      // But if they explicitly asked for overview (via query param), show it
      setShowOverview(shouldShowOverview);
    } else {
      // This is a new assignment, show the overview by default
      setAssignment(mockAssignment);
      setShowOverview(true);
    }
  }, [id, shouldShowOverview]);
  
  // Save progress to localStorage when the current question changes
  useEffect(() => {
    if (assignment && id) { // Only save progress for specific assignments (not practice mode)
      localStorage.setItem(`assignment_progress_${id}`, JSON.stringify({
        assignment,
        currentQuestionIndex
      }));
    }
  }, [assignment, currentQuestionIndex, id]);
  
  // Set initial time based on the question's estimated time
  useEffect(() => {
    if (assignment && currentQuestion) {
      // Parse the estimated time (e.g., "2 minutes" -> 120 seconds)
      const timeString = currentQuestion.estimatedTime;
      const minutes = parseInt(timeString.split(' ')[0]);
      setTimeRemaining(minutes * 60);
    }
  }, [currentQuestionIndex, assignment]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && timerActive) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, timerActive]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const prefix = seconds < 0 ? '-' : '';
    return `${prefix}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle recording functionality
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecorded(true);
      setTimerActive(false);
      
      toast({
        title: "Recording complete",
        description: "You can now listen to your recording or continue to the next question.",
      });
    } else {
      // Start recording
      setIsRecording(true);
      setHasRecorded(false);
      setTimerActive(true);
      
      toast({
        title: "Recording started",
        description: "Please speak clearly into your microphone.",
      });
    }
  };
  
  // Handle playing the recording
  const playRecording = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      
      // Simulate playing audio
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };
  
  // Check if all questions are completed
  const areAllQuestionsCompleted = () => {
    return assignment?.questions.every(question => question.isCompleted) || false;
  };
  
  // Mark the current question as completed
  const completeQuestion = () => {
    if (!assignment) return;
    
    const updatedQuestions = [...assignment.questions];
    updatedQuestions[currentQuestionIndex].isCompleted = true;
    
    setAssignment({
      ...assignment,
      questions: updatedQuestions,
    });
    
    // Move to next question or complete if last question
    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (areAllQuestionsCompleted()) {
      setIsCompleted(true);
      toast({
        title: "Assignment submitted!",
        description: "You've completed all the questions in this assignment.",
      });
    }
    
    setHasRecorded(false);
  };
  
  // Handle selecting a question from the sidebar
  const selectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setHasRecorded(!!assignment?.questions[index].isCompleted);
  };

  // Handle begin practice - transitions from overview to practice
  const handleBeginPractice = () => {
    setShowOverview(false);
  };
  
  // Handle submit assignment
  const handleSubmitAssignment = () => {
    setIsCompleted(true);
    toast({
      title: "Assignment submitted",
      description: "Your responses have been submitted successfully.",
    });
  };
  
  // Handle back to dashboard
  const goToDashboard = () => {
    // Clear the saved progress when going back to dashboard
    if (id) {
      localStorage.removeItem(`assignment_progress_${id}`);
    }
    navigate('/student/dashboard');
  };
  
  // Handle practice again
  const handlePracticeAgain = () => {
    if (assignment) {
      // Reset all questions to not completed
      const resetQuestions = assignment.questions.map(q => ({ ...q, isCompleted: false }));
      setAssignment({
        ...assignment,
        questions: resetQuestions,
      });
      setCurrentQuestionIndex(0);
      setIsCompleted(false);
      setHasRecorded(false);
    }
  };

  if (!assignment) {
    return <div className="flex items-center justify-center h-screen">Loading assignment...</div>;
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];
  
  // Determine if we're on the last question
  const isLastQuestion = currentQuestionIndex === assignment.questions.length - 1;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center my-6">
        <div className={`w-full ${isMobile ? "flex flex-col" : "flex"} gap-4 max-w-5xl`}>
          {!showOverview && (
            <QuestionNavigation 
              questions={assignment.questions}
              currentQuestionIndex={currentQuestionIndex}
              selectQuestion={selectQuestion}
              isMobile={isMobile}
            />
          )}
          
          {/* Main Content Area */}
          <div className="flex-1">
            {isCompleted ? (
              <CompletionScreen 
                goToDashboard={goToDashboard}
                handlePracticeAgain={handlePracticeAgain}
              />
            ) : showOverview ? (
              <AssignmentOverview 
                assignment={assignment}
                handleBeginPractice={handleBeginPractice}
              />
            ) : (
              <QuestionContent 
                currentQuestion={currentQuestion}
                totalQuestions={assignment.questions.length}
                timeRemaining={timeRemaining}
                isRecording={isRecording}
                hasRecorded={hasRecorded}
                isPlaying={isPlaying}
                isLastQuestion={isLastQuestion}
                toggleRecording={toggleRecording}
                playRecording={playRecording}
                completeQuestion={completeQuestion}
                formatTime={formatTime}
                assignmentTitle={assignment.title}
                dueDate={assignment.dueDate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentPractice;
