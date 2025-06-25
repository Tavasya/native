import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PartSelector from '../../../../../src/components/teacher/AssignmentBuilder/PartSelector';
import type { AssignmentPart, PartCombination, PartType } from '../../../../../src/features/assignmentParts/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  X: () => <div data-testid="x-icon" />,
  Clock: () => <div data-testid="clock-icon" />
}));

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange && onValueChange('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value} role="option">{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>
}));

const mockParts: AssignmentPart[] = [
  {
    id: '1',
    title: 'Personal Introduction',
    description: 'Introduce yourself',
    part_type: 'part1',
    topic: 'Personal',
    questions: [
      { id: '1', question: 'Tell me about yourself', type: 'normal' as any, speakAloud: false, timeLimit: '5' },
      { id: '2', question: 'What are your hobbies?', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 5,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2', 
    title: 'Work Experience',
    description: 'Discuss your work background',
    part_type: 'part2_only',
    topic: 'Work',
    questions: [
      { id: '3', question: 'Describe your current job', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    title: 'Educational Background',
    part_type: 'part3_only',
    topic: 'Education',
    questions: [
      { id: '4', question: 'Tell me about your education', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 7,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

const mockCombinations: PartCombination[] = [
  {
    id: 'combo1',
    title: 'Work & Education Combo',
    description: 'Combined work and education questions',
    topic: 'Work',
    part2_id: '2',
    part3_id: '3',
    created_by: 'user1',
    is_public: true,
    usage_count: 1,
    created_at: '2024-01-01',
    part2: mockParts[1],
    part3: mockParts[2]
  }
];

const defaultProps = {
  parts: mockParts,
  combinations: mockCombinations,
  loading: false,
  selectedTopic: undefined,
  selectedPartType: undefined as PartType | undefined,
  onTopicChange: jest.fn(),
  onPartTypeChange: jest.fn(),
  onClearFilters: jest.fn(),
  onAddPart: jest.fn()
};

describe('PartSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading state when loading is true', () => {
      render(<PartSelector {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading Parts...')).toBeInTheDocument();
      expect(screen.getAllByRole('presentation')).toHaveLength(3); // Skeleton items
    });
  });

  describe('Basic Rendering', () => {
    it('renders the component with correct title', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Part Library')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search parts...')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders filter section', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('renders topic and part type selectors', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Topic')).toBeInTheDocument();
      expect(screen.getByText('Part Type')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All topics')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All types')).toBeInTheDocument();
    });
  });

  describe('Part Display', () => {
    it('displays all parts and combinations', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.getByText('Educational Background')).toBeInTheDocument();
      expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
    });

    it('displays part descriptions when available', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Introduce yourself')).toBeInTheDocument();
      expect(screen.getByText('Discuss your work background')).toBeInTheDocument();
      expect(screen.getByText('Combined work and education questions')).toBeInTheDocument();
    });

    it('displays correct part type labels', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getAllByText('Part 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2 Only').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 3 Only').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2 & 3')).toHaveLength(1); // For combination
    });

    it('displays topic badges', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getAllByText('Work')).toHaveLength(2); // Part and combination
      expect(screen.getByText('Education')).toBeInTheDocument();
    });

    it('displays question counts', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.getByText('2 questions')).toBeInTheDocument(); // Personal Introduction
      expect(screen.getByText('1 questions')).toBeInTheDocument(); // Work Experience and Educational Background
      expect(screen.getByText('2 questions')).toBeInTheDocument(); // Combination (1 + 1)
    });
  });

  describe('Search Functionality', () => {
    it('filters parts based on title search', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      await user.type(searchInput, 'personal');
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    });

    it('filters parts based on description search', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      await user.type(searchInput, 'introduce');
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    });

    it('filters combinations based on search', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      await user.type(searchInput, 'combo');
      
      expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
      expect(screen.queryByText('Personal Introduction')).not.toBeInTheDocument();
    });

    it('shows empty state when no search results', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No parts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  describe('Topic Filtering', () => {
    it('generates topic options from parts and combinations', () => {
      render(<PartSelector {...defaultProps} />);
      
      // Check that unique topics from both parts and combinations are available
      const topicSelect = screen.getByDisplayValue('All topics');
      fireEvent.click(topicSelect);
      
      // Topics should be: Education, Personal, Work (sorted alphabetically)
      expect(screen.getByRole('option', { name: 'Education' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Work' })).toBeInTheDocument();
    });

    it('filters parts by selected topic', () => {
      render(<PartSelector {...defaultProps} selectedTopic="Personal" />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
      expect(screen.queryByText('Educational Background')).not.toBeInTheDocument();
      expect(screen.queryByText('Work & Education Combo')).not.toBeInTheDocument();
    });

    it('calls onTopicChange when topic is selected', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const topicSelect = screen.getByTestId('select');
      await user.click(topicSelect);
      
      expect(defaultProps.onTopicChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Part Type Filtering', () => {
    it('filters parts by selected part type', () => {
      render(<PartSelector {...defaultProps} selectedPartType="part1" />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
      expect(screen.queryByText('Educational Background')).not.toBeInTheDocument();
      // Combinations should still show as they're not affected by part type filter
      expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
    });

    it('calls onPartTypeChange when part type is selected', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const partTypeSelects = screen.getAllByTestId('select');
      const partTypeSelect = partTypeSelects[1]; // Second select is part type
      await user.click(partTypeSelect);
      
      expect(defaultProps.onPartTypeChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Clear Filters', () => {
    it('shows clear filters button when filters are active', () => {
      render(<PartSelector {...defaultProps} selectedTopic="Work" />);
      
      expect(screen.getByText('Clear')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('hides clear filters button when no filters are active', () => {
      render(<PartSelector {...defaultProps} />);
      
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('calls onClearFilters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} selectedTopic="Work" />);
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Part Selection', () => {
    it('calls onAddPart when a part is clicked', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const partCard = screen.getByText('Personal Introduction').closest('div[role="presentation"]') ||
                      screen.getByText('Personal Introduction').closest('.cursor-pointer');
      await user.click(partCard!);
      
      expect(defaultProps.onAddPart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Personal Introduction'
        })
      );
    });

    it('calls onAddPart when a combination is clicked', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} />);
      
      const comboCard = screen.getByText('Work & Education Combo').closest('div[role="presentation"]') ||
                       screen.getByText('Work & Education Combo').closest('.cursor-pointer');
      await user.click(comboCard!);
      
      expect(defaultProps.onAddPart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'combo1',
          title: 'Work & Education Combo'
        })
      );
    });
  });

  describe('Combined Filters', () => {
    it('applies both topic and part type filters', () => {
      render(<PartSelector {...defaultProps} selectedTopic="Work" selectedPartType="part2_only" />);
      
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.queryByText('Personal Introduction')).not.toBeInTheDocument();
      expect(screen.queryByText('Educational Background')).not.toBeInTheDocument();
      expect(screen.getByText('Work & Education Combo')).toBeInTheDocument(); // Still shows (only filtered by topic)
    });

    it('applies search with filters', async () => {
      const user = userEvent.setup();
      render(<PartSelector {...defaultProps} selectedTopic="Work" />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      await user.type(searchInput, 'experience');
      
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.queryByText('Work & Education Combo')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no parts or combinations are provided', () => {
      render(<PartSelector {...defaultProps} parts={[]} combinations={[]} />);
      
      expect(screen.getByText('No parts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  describe('Part Type Labels', () => {
    it('displays correct labels for all part types', () => {
      const partWithAllTypes: AssignmentPart[] = [
        { ...mockParts[0], part_type: 'part1' },
        { ...mockParts[0], id: '2', part_type: 'part2_3' },
        { ...mockParts[0], id: '3', part_type: 'part2_only' },
        { ...mockParts[0], id: '4', part_type: 'part3_only' }
      ];

      render(<PartSelector {...defaultProps} parts={partWithAllTypes} combinations={[]} />);
      
      expect(screen.getAllByText('Part 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2 & 3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2 Only').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 3 Only').length).toBeGreaterThan(0);
    });
  });
});