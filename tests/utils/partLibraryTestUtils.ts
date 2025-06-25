/**
 * Test utilities for Part Library components and features
 * Includes mock data, test helpers, and reusable test setup functions
 */

import type { AssignmentPart, PartCombination, AssignmentPartsState, PartType, DifficultyLevel } from '../../src/features/assignmentParts/types';

// Mock data factories
export const createMockAssignmentPart = (overrides: Partial<AssignmentPart> = {}): AssignmentPart => ({
  id: 'test-part-123',
  title: 'Test Assignment Part',
  description: 'Test description',
  part_type: 'part1',
  topic: 'Personal',
  difficulty_level: 'beginner',
  questions: [
    { id: 'q1', question: 'Test question 1', type: 'normal' as any, speakAloud: false, timeLimit: '5' },
    { id: 'q2', question: 'Test question 2', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
  ],
  metadata: {
    autoGrade: false,
    isTest: false,
    estimatedTime: '5 minutes'
  },
  created_by: 'test-user-123',
  is_public: true,
  usage_count: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockPartCombination = (overrides: Partial<PartCombination> = {}): PartCombination => ({
  id: 'test-combo-123',
  title: 'Test Part Combination',
  description: 'Test combination description',
  topic: 'Work',
  part2_id: 'part2-123',
  part3_id: 'part3-123',
  created_by: 'test-user-123',
  is_public: true,
  usage_count: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  part2: createMockAssignmentPart({ id: 'part2-123', part_type: 'part2_only', title: 'Part 2' }),
  part3: createMockAssignmentPart({ id: 'part3-123', part_type: 'part3_only', title: 'Part 3' }),
  ...overrides
});

export const createMockAssignmentPartsState = (overrides: Partial<AssignmentPartsState> = {}): AssignmentPartsState => ({
  parts: [],
  combinations: [],
  loading: false,
  error: null,
  createPartLoading: false,
  createCombinationLoading: false,
  selectedTopic: undefined,
  selectedPartType: undefined,
  selectedDifficulty: undefined,
  ...overrides
});

// Collections of test data
export const mockPartTypes: PartType[] = ['part1', 'part2_3', 'part2_only', 'part3_only'];
export const mockDifficultyLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
export const mockTopics = ['Personal', 'Work', 'Education', 'Travel', 'Hobbies'];

export const createMockPartsCollection = (count: number = 5): AssignmentPart[] => {
  return Array.from({ length: count }, (_, index) => createMockAssignmentPart({
    id: `part-${index}`,
    title: `Test Part ${index + 1}`,
    part_type: mockPartTypes[index % mockPartTypes.length],
    topic: mockTopics[index % mockTopics.length],
    difficulty_level: mockDifficultyLevels[index % mockDifficultyLevels.length],
    usage_count: index * 2
  }));
};

export const createMockCombinationsCollection = (count: number = 3): PartCombination[] => {
  return Array.from({ length: count }, (_, index) => createMockPartCombination({
    id: `combo-${index}`,
    title: `Test Combination ${index + 1}`,
    topic: mockTopics[index % mockTopics.length],
    usage_count: index
  }));
};

// Redux store mock for part library
export const createMockPartLibraryStore = (initialState?: Partial<AssignmentPartsState>) => {
  const state = createMockAssignmentPartsState(initialState);
  const listeners: Array<() => void> = [];
  
  return {
    getState: () => ({ assignmentParts: state }),
    dispatch: jest.fn((action: any) => {
      // Simple mock implementation
      listeners.forEach(listener => listener());
      return action;
    }),
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn()
  };
};

// Mock Supabase client for service tests
export const createMockSupabaseClient = () => {
  const mockQuery = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis()
  };

  return {
    from: jest.fn(() => mockQuery),
    rpc: jest.fn(() => 'increment'),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn()
    },
    storage: {
      from: jest.fn()
    }
  };
};

// Test helpers for component testing
export const getPartLibraryProps = (overrides = {}) => ({
  isOpen: true,
  onToggle: jest.fn(),
  searchQuery: '',
  onSearchChange: jest.fn(),
  selectedTopic: undefined,
  onTopicChange: jest.fn(),
  selectedPartType: undefined,
  onPartTypeChange: jest.fn(),
  onClearFilters: jest.fn(),
  parts: createMockPartsCollection(4),
  combinations: createMockCombinationsCollection(2),
  partsLoading: false,
  onAddPart: jest.fn(),
  onDragStart: jest.fn(),
  onDragEnd: jest.fn(),
  ...overrides
});

export const getPartSelectorProps = (overrides = {}) => ({
  parts: createMockPartsCollection(4),
  combinations: createMockCombinationsCollection(2),
  loading: false,
  selectedTopic: undefined,
  selectedPartType: undefined,
  onTopicChange: jest.fn(),
  onPartTypeChange: jest.fn(),
  onClearFilters: jest.fn(),
  onAddPart: jest.fn(),
  ...overrides
});

// Mock drag and drop events
export const createMockDragEvent = (data?: any) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  dataTransfer: {
    getData: jest.fn().mockReturnValue(data ? JSON.stringify(data) : ''),
    setData: jest.fn(),
    effectAllowed: 'move',
    dropEffect: 'move'
  }
});

// Assertions helpers
export const expectPartToBeDisplayed = (part: AssignmentPart, container: HTMLElement) => {
  expect(container).toHaveTextContent(part.title);
  if (part.topic) {
    expect(container).toHaveTextContent(part.topic);
  }
};

export const expectCombinationToBeDisplayed = (combination: PartCombination, container: HTMLElement) => {
  expect(container).toHaveTextContent(combination.title);
  if (combination.topic) {
    expect(container).toHaveTextContent(combination.topic);
  }
  expect(container).toHaveTextContent('Part 2 & 3');
};

// Mock localStorage for filter persistence tests
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    })
  };
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Test data for specific scenarios
export const createLargeMockDataset = () => ({
  parts: createMockPartsCollection(50),
  combinations: createMockCombinationsCollection(20)
});

export const createEmptyMockDataset = () => ({
  parts: [],
  combinations: []
});

export const createFilteredMockDataset = () => ({
  personalParts: createMockPartsCollection(5).map(part => ({ ...part, topic: 'Personal' })),
  workParts: createMockPartsCollection(3).map(part => ({ ...part, topic: 'Work' })),
  part1Parts: createMockPartsCollection(4).map(part => ({ ...part, part_type: 'part1' as PartType })),
  beginnerParts: createMockPartsCollection(6).map(part => ({ ...part, difficulty_level: 'beginner' as DifficultyLevel }))
});

// Mock API responses
export const createMockApiResponses = () => ({
  successResponse: {
    data: createMockAssignmentPart(),
    error: null
  },
  errorResponse: {
    data: null,
    error: { message: 'Test error message' }
  },
  partsListResponse: {
    data: createMockPartsCollection(5),
    error: null
  },
  combinationsListResponse: {
    data: createMockCombinationsCollection(3),
    error: null
  },
  emptyResponse: {
    data: [],
    error: null
  }
});

// Test timing utilities
export const waitForAsync = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Console error suppression for tests
export const suppressConsoleError = () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });
};

// Custom matchers for Jest
export const expectPartArrayToContain = (parts: AssignmentPart[], expectedPart: Partial<AssignmentPart>) => {
  const foundPart = parts.find(part => 
    Object.entries(expectedPart).every(([key, value]) => 
      part[key as keyof AssignmentPart] === value
    )
  );
  expect(foundPart).toBeDefined();
};

export const expectCombinationArrayToContain = (combinations: PartCombination[], expectedCombo: Partial<PartCombination>) => {
  const foundCombo = combinations.find(combo => 
    Object.entries(expectedCombo).every(([key, value]) => 
      combo[key as keyof PartCombination] === value
    )
  );
  expect(foundCombo).toBeDefined();
};