import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OverallScoring from '@/components/student/feedback/OverallScoring';

const mockProps = {
  scores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85, overall_grade: 6.5 },
  tempScores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85, overall_grade: 6.5 },
  isEditing: false,
  canEdit: true,
  onEdit: jest.fn(),
  onSave: jest.fn(),
  onCancel: jest.fn(),
  onScoreChange: jest.fn(),
};

describe('OverallScoring', () => {
  it('shows IELTS display when grade exists', () => {
    render(<OverallScoring {...mockProps} />);
    
    expect(screen.getByText('6.5')).toBeInTheDocument();
    expect(screen.getByText('IELTS')).toBeInTheDocument();
  });

  it('shows individual scores when no grade exists', () => {
    const propsWithoutGrade = {
      ...mockProps,
      scores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85 },
      tempScores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85 },
    };
    
    render(<OverallScoring {...propsWithoutGrade} />);
    
    expect(screen.getByText('Overall Assignment Scoring')).toBeInTheDocument();
    expect(screen.getByText('Fluency')).toBeInTheDocument();
    expect(screen.getByText('Pronunciation')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked on individual scores', () => {
    const propsWithoutGrade = {
      ...mockProps,
      scores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85 },
      tempScores: { avg_fluency_score: 70, avg_pronunciation_score: 80, avg_grammar_score: 75, avg_lexical_score: 85 },
    };
    const mockOnEdit = jest.fn();
    
    render(<OverallScoring {...propsWithoutGrade} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalled();
  });
});