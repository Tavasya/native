// Enhanced curriculum service with more assignments per week
// This is a proposal for better weekly assignment distribution

export const enhancedCurriculumConfig = {
  // Timeline to assignments per week mapping
  assignmentsPerWeek: {
    '1-month': {
      conversationPerWeek: 7,  // Daily conversation practice
      pronunciationPerWeek: 3,  // Every other day
      totalPerWeek: 10
    },
    '3-months': {
      conversationPerWeek: 5,  // Weekdays
      pronunciationPerWeek: 2,  // Twice a week
      totalPerWeek: 7
    },
    '6-months': {
      conversationPerWeek: 3,  // Mon, Wed, Fri
      pronunciationPerWeek: 2,  // Tue, Thu
      totalPerWeek: 5
    },
    'not-sure': {
      conversationPerWeek: 2,  // Twice a week
      pronunciationPerWeek: 1,  // Once a week
      totalPerWeek: 3
    }
  },

  // Maximum weeks for each timeline
  maxWeeks: {
    '1-month': 4,
    '3-months': 12,
    '6-months': 24,
    'not-sure': 8
  },

  // Assignment variety requirements
  minUniqueAssignmentsBeforeRepeat: {
    'conversation': 20,  // At least 20 unique conversations before repeating
    'pronunciation': 10  // At least 10 unique pronunciation exercises
  }
};

// Example weekly schedule for 1-month intensive
export const sampleIntensiveWeek = {
  monday: {
    assignments: [
      { type: 'conversation', title: 'Coffee Shop', duration: '15 min' },
      { type: 'pronunciation', title: 'Vowel Sounds', duration: '10 min' }
    ]
  },
  tuesday: {
    assignments: [
      { type: 'conversation', title: 'Restaurant Ordering', duration: '15 min' }
    ]
  },
  wednesday: {
    assignments: [
      { type: 'conversation', title: 'Bank Visit', duration: '15 min' },
      { type: 'pronunciation', title: 'Consonant Clusters', duration: '10 min' }
    ]
  },
  thursday: {
    assignments: [
      { type: 'conversation', title: 'Doctor Appointment', duration: '15 min' }
    ]
  },
  friday: {
    assignments: [
      { type: 'conversation', title: 'Shopping Mall', duration: '15 min' },
      { type: 'pronunciation', title: 'Intonation Practice', duration: '10 min' }
    ]
  },
  saturday: {
    assignments: [
      { type: 'conversation', title: 'Public Transport', duration: '15 min' }
    ]
  },
  sunday: {
    assignments: [
      { type: 'conversation', title: 'Phone Call', duration: '15 min' }
    ]
  }
};

// Example weekly schedule for 3-month focused
export const sampleFocusedWeek = {
  monday: {
    assignments: [
      { type: 'conversation', title: 'Hotel Check-in', duration: '20 min' }
    ]
  },
  tuesday: {
    assignments: [
      { type: 'pronunciation', title: 'Word Stress', duration: '15 min' }
    ]
  },
  wednesday: {
    assignments: [
      { type: 'conversation', title: 'Job Interview Prep', duration: '20 min' }
    ]
  },
  thursday: {
    assignments: [
      { type: 'conversation', title: 'University Application', duration: '20 min' }
    ]
  },
  friday: {
    assignments: [
      { type: 'conversation', title: 'Apartment Rental', duration: '20 min' },
      { type: 'pronunciation', title: 'Sentence Rhythm', duration: '15 min' }
    ]
  },
  saturday: {
    assignments: [
      { type: 'conversation', title: 'Weekend Activity Planning', duration: '20 min' }
    ]
  },
  sunday: {
    assignments: [
      { type: 'conversation', title: 'Social Gathering', duration: '20 min' }
    ]
  }
};

// Function to generate a curriculum with better distribution
export const generateEnhancedCurriculum = (
  timeline: string,
  _currentLevel: string,
  _targetScore: string
) => {
  const config = enhancedCurriculumConfig.assignmentsPerWeek[timeline as keyof typeof enhancedCurriculumConfig.assignmentsPerWeek];
  const maxWeeks = enhancedCurriculumConfig.maxWeeks[timeline as keyof typeof enhancedCurriculumConfig.maxWeeks];
  
  // This would generate a curriculum with:
  // - More assignments per week
  // - Better variety
  // - Progressive difficulty
  // - Balanced conversation and pronunciation practice
  
  return {
    totalWeeks: maxWeeks,
    assignmentsPerWeek: config.totalPerWeek,
    totalAssignments: maxWeeks * config.totalPerWeek,
    conversationAssignments: maxWeeks * config.conversationPerWeek,
    pronunciationAssignments: maxWeeks * config.pronunciationPerWeek
  };
};