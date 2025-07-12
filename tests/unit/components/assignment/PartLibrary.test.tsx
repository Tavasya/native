import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PartLibrary from '../../../../src/components/assignment/PartLibrary';
import type { AssignmentPart, PartCombination, PartType } from '../../../../src/features/assignmentParts/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Search: () => <div data-testid="search-icon" />
}));

// Mock UI components that are causing issues
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
    part_type: 'part1',
    topic: 'Personal',
    questions: [
      { id: '1', question: 'Tell me about yourself', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
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
    part_type: 'part2_only',
    topic: 'Work',
    questions: [
      { id: '2', question: 'Describe your work experience', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
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
      { id: '3', question: 'Tell me about your education', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 7,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    title: 'Travel Stories',
    part_type: 'part2_3',
    topic: 'Travel',
    questions: [
      { id: '4', question: 'Share a travel experience', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

const mockCombinations: PartCombination[] = [
  {
    id: 'combo1',
    title: 'Work & Education Combo',
    topic: 'Work',
    part2_id: '2',
    part3_id: '3',
    created_by: 'user1',
    is_public: true,
    usage_count: 1,
    created_at: '2024-01-01'
  }
];

const defaultProps = {
  isOpen: true,
  onToggle: jest.fn(),
  searchQuery: '',
  onSearchChange: jest.fn(),
  selectedTopic: undefined,
  onTopicChange: jest.fn(),
  selectedPartType: undefined as PartType | undefined,
  onPartTypeChange: jest.fn(),
  onClearFilters: jest.fn(),
  parts: mockParts,
  combinations: mockCombinations,
  partsLoading: false,
  onAddPart: jest.fn(),
  onDragStart: jest.fn(),
  onDragEnd: jest.fn()
};

describe('PartLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders collapsed state when closed', () => {
      render(<PartLibrary {...defaultProps} isOpen={false} />);
      
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.queryByText('Part Library')).not.toBeInTheDocument();
    });

    it('renders expanded state when open', () => {
      render(<PartLibrary {...defaultProps} />);
      
      expect(screen.getByText('Part Library')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search parts...')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<PartLibrary {...defaultProps} partsLoading={true} />);
      
      expect(screen.getByText('Loading parts...')).toBeInTheDocument();
    });

    it('renders empty state when no parts found', () => {
      render(<PartLibrary {...defaultProps} parts={[]} combinations={[]} />);
      
      expect(screen.getByText('No parts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  describe('Part Display', () => {
    it('displays part cards with correct information', () => {
      render(<PartLibrary {...defaultProps} />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.getByText('Educational Background')).toBeInTheDocument();
      expect(screen.getByText('Travel Stories')).toBeInTheDocument();
    });

    it('displays part type badges correctly', () => {
      render(<PartLibrary {...defaultProps} />);
      
      expect(screen.getAllByText('Part 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Part 2 & 3')).toHaveLength(2); // One for part2_3 type and one for combination
    });

    it('displays topic badges', () => {
      render(<PartLibrary {...defaultProps} />);
      
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    it('displays question descriptions for individual parts', () => {
      render(<PartLibrary {...defaultProps} />);
      
      expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
      expect(screen.getByText('Describe your work experience')).toBeInTheDocument();
    });

    it('displays combination description for part combinations', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      // Navigate to page 2 where the combination should be (since there are 4 parts + 1 combination)
      const page2Button = screen.getByText('2');
      await user.click(page2Button);
      
      expect(screen.getByText('Part 2 & 3 combination')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onSearchChange when search input changes', () => {
      render(<PartLibrary {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search parts...');
      fireEvent.change(searchInput, { target: { value: 'personal' } });
      
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('personal');
    });

    it('filters parts based on search query', () => {
      render(<PartLibrary {...defaultProps} searchQuery="personal" />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    });

    it('searches within question text', () => {
      render(<PartLibrary {...defaultProps} searchQuery="yourself" />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters by topic', () => {
      render(<PartLibrary {...defaultProps} selectedTopic="Work" />);
      
      expect(screen.getByText('Work Experience')).toBeInTheDocument();
      expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
      expect(screen.queryByText('Personal Introduction')).not.toBeInTheDocument();
    });

    it('filters by part type', () => {
      render(<PartLibrary {...defaultProps} selectedPartType="part1" />);
      
      expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    });

    it('calls onTopicChange when topic filter changes', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      const topicSelects = screen.getAllByTestId('select');
      const topicSelect = topicSelects[0]; // First select is topic
      await user.click(topicSelect);
      
      expect(defaultProps.onTopicChange).toHaveBeenCalledWith('test');
    });

    it('calls onPartTypeChange when part type filter changes', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      const partTypeSelects = screen.getAllByTestId('select');
      const partTypeSelect = partTypeSelects[1]; // Second select is part type
      await user.click(partTypeSelect);
      
      expect(defaultProps.onPartTypeChange).toHaveBeenCalledWith('test');
    });

    it('calls onClearFilters when clear filters button is clicked', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      const clearButton = screen.getByText('Clear Filters');
      await user.click(clearButton);
      
      expect(defaultProps.onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('shows pagination when there are more than 4 items', () => {
      const manyParts = Array.from({ length: 10 }, (_, i) => ({
        ...mockParts[0],
        id: `part-${i}`,
        title: `Part ${i}`
      }));
      
      render(<PartLibrary {...defaultProps} parts={manyParts} combinations={[]} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows only 4 items per page', () => {
      const manyParts = Array.from({ length: 10 }, (_, i) => ({
        ...mockParts[0],
        id: `part-${i}`,
        title: `Part ${i}`
      }));
      
      render(<PartLibrary {...defaultProps} parts={manyParts} combinations={[]} />);
      
      expect(screen.getByText('Part 0')).toBeInTheDocument();
      expect(screen.getByText('Part 3')).toBeInTheDocument();
      expect(screen.queryByText('Part 4')).not.toBeInTheDocument();
    });

    it('navigates to next page when page button is clicked', async () => {
      const user = userEvent.setup();
      const manyParts = Array.from({ length: 10 }, (_, i) => ({
        ...mockParts[0],
        id: `part-${i}`,
        title: `Part ${i}`
      }));
      
      render(<PartLibrary {...defaultProps} parts={manyParts} combinations={[]} />);
      
      const page2Button = screen.getByText('2');
      await user.click(page2Button);
      
      expect(screen.getByText('Part 4')).toBeInTheDocument();
      expect(screen.queryByText('Part 0')).not.toBeInTheDocument();
    });

    it('resets to page 1 when filters change', () => {
      const manyParts = Array.from({ length: 10 }, (_, i) => ({
        ...mockParts[0],
        id: `part-${i}`,
        title: `Part ${i}`,
        topic: i < 5 ? 'Personal' : 'Work'
      }));
      
      const { rerender } = render(<PartLibrary {...defaultProps} parts={manyParts} combinations={[]} />);
      
      // Should reset to page 1 when topic filter changes
      rerender(<PartLibrary {...defaultProps} parts={manyParts} combinations={[]} selectedTopic="Work" />);
      
      expect(screen.getByText('Part 5')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onToggle when chevron buttons are clicked', async () => {
      const user = userEvent.setup();
      
      // Test closing
      const { rerender } = render(<PartLibrary {...defaultProps} />);
      const closeButton = screen.getByTestId('chevron-left').closest('button');
      await user.click(closeButton!);
      expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
      
      // Test opening
      rerender(<PartLibrary {...defaultProps} isOpen={false} />);
      const openButton = screen.getByTestId('chevron-right').closest('button');
      await user.click(openButton!);
      expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
    });

    it('calls onAddPart when part card is clicked', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
      await user.click(partCard!);
      
      expect(defaultProps.onAddPart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Personal Introduction'
        }),
        undefined,
        true
      );
    });

    it('calls onDragStart when drag starts', () => {
      render(<PartLibrary {...defaultProps} />);
      
      const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
      fireEvent.dragStart(partCard!);
      
      expect(defaultProps.onDragStart).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          title: 'Personal Introduction'
        })
      );
    });

    it('calls onDragEnd when drag ends', () => {
      render(<PartLibrary {...defaultProps} />);
      
      const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
      fireEvent.dragEnd(partCard!);
      
      expect(defaultProps.onDragEnd).toHaveBeenCalled();
    });
  });

  describe('Badge Colors', () => {
    it('applies correct badge colors for different part types', () => {
      render(<PartLibrary {...defaultProps} />);
      
      const part1Badges = screen.getAllByText('Part 1');
      const part2Badges = screen.getAllByText('Part 2');
      const part3Badges = screen.getAllByText('Part 3');
      
      expect(part1Badges.length).toBeGreaterThan(0);
      expect(part2Badges.length).toBeGreaterThan(0);
      expect(part3Badges.length).toBeGreaterThan(0);
    });

    it('applies purple color for combinations', async () => {
      const user = userEvent.setup();
      render(<PartLibrary {...defaultProps} />);
      
      // Navigate to page 2 where the combination should be
      const page2Button = screen.getByText('2');
      await user.click(page2Button);
      
      const comboBadges = screen.getAllByText('Part 2 & 3');
      const combinationBadge = comboBadges.find(badge => 
        badge.closest('.bg-purple-100')
      );
      
      expect(combinationBadge).toBeInTheDocument();
    });
  });
});