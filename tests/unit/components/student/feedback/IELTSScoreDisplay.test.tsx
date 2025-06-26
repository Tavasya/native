import React from 'react';
import { render, screen } from '@testing-library/react';
import IELTSScoreDisplay from '@/components/student/feedback/IELTSScoreDisplay';

describe('IELTSScoreDisplay', () => {
  it('renders IELTS score with equivalents', () => {
    render(<IELTSScoreDisplay grade={6.5} />);
    
    expect(screen.getByText('6.5')).toBeInTheDocument();
    expect(screen.getByText('IELTS')).toBeInTheDocument();
    expect(screen.getByText('TOEFL iBT')).toBeInTheDocument();
    expect(screen.getByText('CEFR')).toBeInTheDocument();
  });

  it('shows correct TOEFL and CEFR equivalents', () => {
    render(<IELTSScoreDisplay grade={7.0} />);
    
    expect(screen.getByText('7.0')).toBeInTheDocument();
    expect(screen.getByText('94-101')).toBeInTheDocument(); // TOEFL for 7.0
    expect(screen.getByText('C1')).toBeInTheDocument(); // CEFR for 7.0
  });

  it('does not render when grade is null', () => {
    const { container } = render(<IELTSScoreDisplay grade={null} />);
    expect(container.firstChild).toBeNull();
  });
});