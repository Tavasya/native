import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PartLibrary from '../../src/components/assignment/PartLibrary';
import type { AssignmentPart, PartCombination, PartType } from '../../src/features/assignmentParts/types';

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

// Mock Assignment Builder Component to test drag-and-drop integration
const MockAssignmentBuilder: React.FC<{
  onPartDrop: (part: AssignmentPart | PartCombination, insertIndex?: number) => void;
}> = ({ onPartDrop }) => {
  const [draggedOver, setDraggedOver] = React.useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOver(index);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOver(null);
    const partData = e.dataTransfer.getData('application/json');
    if (partData) {
      const part = JSON.parse(partData);
      onPartDrop(part, index);
    }
  };

  return (
    <div data-testid="assignment-builder" className="p-4">
      <h2>Assignment Builder</h2>
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            data-testid={`drop-zone-${index}`}
            className={`p-4 border-2 border-dashed ${
              draggedOver === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            Drop zone {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

// Integration test component that combines PartLibrary with AssignmentBuilder
const PartLibraryWithBuilder: React.FC<{
  parts: AssignmentPart[];
  combinations: PartCombination[];
}> = ({ parts, combinations }) => {
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTopic, setSelectedTopic] = React.useState<string | undefined>();
  const [selectedPartType, setSelectedPartType] = React.useState<PartType | undefined>();
  const [draggedPart, setDraggedPart] = React.useState<AssignmentPart | PartCombination | null>(null);
  const [addedParts, setAddedParts] = React.useState<(AssignmentPart | PartCombination)[]>([]);

  const handleDragStart = (part: AssignmentPart | PartCombination) => {
    setDraggedPart(part);
    // In real implementation, this would set the drag data
    const dragData = JSON.stringify(part);
    // We'll simulate setting the drag data by storing it globally for the test
    (global as any).dragData = dragData;
  };

  const handleDragEnd = () => {
    setDraggedPart(null);
    (global as any).dragData = null;
  };

  const handlePartDrop = (part: AssignmentPart | PartCombination, insertIndex?: number) => {
    setAddedParts(prev => [...prev, part]);
  };

  const handleAddPart = (part: AssignmentPart | PartCombination) => {
    setAddedParts(prev => [...prev, part]);
  };

  const clearFilters = () => {
    setSelectedTopic(undefined);
    setSelectedPartType(undefined);
    setSearchQuery('');
  };

  return (
    <div className="flex">
      <PartLibrary
        isOpen={isLibraryOpen}
        onToggle={setIsLibraryOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        selectedPartType={selectedPartType}
        onPartTypeChange={setSelectedPartType}
        onClearFilters={clearFilters}
        parts={parts}
        combinations={combinations}
        partsLoading={false}
        onAddPart={handleAddPart}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
      <div className="flex-1 ml-80">
        <MockAssignmentBuilder onPartDrop={handlePartDrop} />
        <div data-testid="added-parts" className="mt-4 p-4 bg-gray-100">
          <h3>Added Parts ({addedParts.length})</h3>
          {addedParts.map((part, index) => (
            <div key={`${part.id}-${index}`} data-testid={`added-part-${index}`}>
              {part.title}
            </div>
          ))}
        </div>
        {draggedPart && (
          <div data-testid="drag-indicator" className="fixed top-0 left-0 z-50 p-2 bg-blue-500 text-white">
            Dragging: {draggedPart.title}
          </div>
        )}
      </div>
    </div>
  );
};

describe('PartLibrary Drag and Drop Integration', () => {
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

  beforeEach(() => {
    (global as any).dragData = null;
  });

  afterEach(() => {
    (global as any).dragData = null;
  });

  it('should render both PartLibrary and AssignmentBuilder', () => {
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    expect(screen.getByText('Part Library')).toBeInTheDocument();
    expect(screen.getByText('Assignment Builder')).toBeInTheDocument();
    expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
  });

  it('should show drag indicator when dragging starts', () => {
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    
    // Start drag
    fireEvent.dragStart(partCard!);
    
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    expect(screen.getByText('Dragging: Personal Introduction')).toBeInTheDocument();
  });

  it('should hide drag indicator when dragging ends', () => {
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    
    // Start and end drag
    fireEvent.dragStart(partCard!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    
    fireEvent.dragEnd(partCard!);
    expect(screen.queryByTestId('drag-indicator')).not.toBeInTheDocument();
  });

  it('should add part to assignment when clicked', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    await user.click(partCard!);
    
    expect(screen.getByText('Added Parts (1)')).toBeInTheDocument();
    expect(screen.getByTestId('added-part-0')).toHaveTextContent('Personal Introduction');
  });

  it('should handle multiple part additions', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const part1Card = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    const part2Card = screen.getByText('Work Experience').closest('[draggable="true"]');
    
    await user.click(part1Card!);
    await user.click(part2Card!);
    
    expect(screen.getByText('Added Parts (2)')).toBeInTheDocument();
    expect(screen.getByTestId('added-part-0')).toHaveTextContent('Personal Introduction');
    expect(screen.getByTestId('added-part-1')).toHaveTextContent('Work Experience');
  });

  it('should handle combination additions', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const comboCard = screen.getByText('Work & Education Combo').closest('[draggable="true"]');
    await user.click(comboCard!);
    
    expect(screen.getByText('Added Parts (1)')).toBeInTheDocument();
    expect(screen.getByTestId('added-part-0')).toHaveTextContent('Work & Education Combo');
  });

  it('should simulate drag and drop workflow', () => {
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    const dropZone = screen.getByTestId('drop-zone-0');
    
    // Start drag
    fireEvent.dragStart(partCard!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    
    // Drag over drop zone
    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');
    
    // Simulate drop with mock data
    const mockDragEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(JSON.stringify(mockParts[0]))
      }
    } as any;
    
    fireEvent.drop(dropZone, mockDragEvent);
    
    // End drag
    fireEvent.dragEnd(partCard!);
    expect(screen.queryByTestId('drag-indicator')).not.toBeInTheDocument();
    
    // Check that part was added
    expect(screen.getByText('Added Parts (1)')).toBeInTheDocument();
  });

  it('should handle search and filtering during drag operations', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    // Search for specific part
    const searchInput = screen.getByPlaceholderText('Search parts...');
    await user.type(searchInput, 'personal');
    
    // Only Personal Introduction should be visible
    expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
    expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    
    // Should still be able to drag the filtered part
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    fireEvent.dragStart(partCard!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    
    fireEvent.dragEnd(partCard!);
    expect(screen.queryByTestId('drag-indicator')).not.toBeInTheDocument();
  });

  it('should handle drag operations with pagination', async () => {
    // Create enough parts to trigger pagination
    const manyParts = Array.from({ length: 10 }, (_, i) => ({
      ...mockParts[0],
      id: `part-${i}`,
      title: `Part ${i}`
    }));
    
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={manyParts} combinations={[]} />);
    
    // Should show pagination
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Drag part from first page
    const firstPagePart = screen.getByText('Part 0').closest('[draggable="true"]');
    fireEvent.dragStart(firstPagePart!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    expect(screen.getByText('Dragging: Part 0')).toBeInTheDocument();
    
    fireEvent.dragEnd(firstPagePart!);
    
    // Go to second page
    const page2Button = screen.getByText('2');
    await user.click(page2Button);
    
    // Should show different parts
    expect(screen.getByText('Part 4')).toBeInTheDocument();
    expect(screen.queryByText('Part 0')).not.toBeInTheDocument();
    
    // Should be able to drag from second page
    const secondPagePart = screen.getByText('Part 4').closest('[draggable="true"]');
    fireEvent.dragStart(secondPagePart!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    expect(screen.getByText('Dragging: Part 4')).toBeInTheDocument();
  });

  it('should handle library toggle during drag operations', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    // Start drag
    const partCard = screen.getByText('Personal Introduction').closest('[draggable="true"]');
    fireEvent.dragStart(partCard!);
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    
    // Close library
    const closeButton = screen.getByTestId('chevron-left').closest('button');
    await user.click(closeButton!);
    
    // Library should be closed but drag indicator should still be visible
    expect(screen.queryByText('Part Library')).not.toBeInTheDocument();
    expect(screen.getByTestId('drag-indicator')).toBeInTheDocument();
    
    // End drag
    fireEvent.dragEnd(partCard!);
    expect(screen.queryByTestId('drag-indicator')).not.toBeInTheDocument();
    
    // Reopen library
    const openButton = screen.getByTestId('chevron-right').closest('button');
    await user.click(openButton!);
    expect(screen.getByText('Part Library')).toBeInTheDocument();
  });

  it('should clear filters and maintain drag functionality', async () => {
    const user = userEvent.setup();
    render(<PartLibraryWithBuilder parts={mockParts} combinations={mockCombinations} />);
    
    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search parts...');
    await user.type(searchInput, 'personal');
    
    // Only one part should be visible
    expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
    expect(screen.queryByText('Work Experience')).not.toBeInTheDocument();
    
    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);
    
    // All parts should be visible again
    expect(screen.getByText('Personal Introduction')).toBeInTheDocument();
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Work & Education Combo')).toBeInTheDocument();
    
    // Should still be able to drag any part
    const workPartCard = screen.getByText('Work Experience').closest('[draggable="true"]');
    fireEvent.dragStart(workPartCard!);
    expect(screen.getByText('Dragging: Work Experience')).toBeInTheDocument();
  });
});