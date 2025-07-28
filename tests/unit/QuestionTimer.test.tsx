import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionTimer from '../../src/components/assignment/QuestionTimer';

describe('QuestionTimer Component', () => {
  const mockFormatTime = (time: number) => {
    const isNegative = time < 0;
    const absTime = Math.abs(time);
    const minutes = Math.floor(absTime / 60);
    const seconds = Math.floor(absTime % 60);
    return `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const defaultProps = {
    timeRemaining: 60, // 1 minute
    formatTime: mockFormatTime,
  };

  describe('Timer Display', () => {
    it('should render with correct time format', () => {
      render(<QuestionTimer {...defaultProps} />);
      
      expect(screen.getByText('1:00')).toBeInTheDocument();
    });

    it('should display clock icon', () => {
      const { container } = render(<QuestionTimer {...defaultProps} />);
      
      // Check for clock icon (Lucide SVG icon)
      const clockIcon = container.querySelector('svg.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
    });

    it('should format different time values correctly', () => {
      const testCases = [
        { time: 125, expected: '2:05' },
        { time: 60, expected: '1:00' },
        { time: 30, expected: '0:30' },
        { time: 5, expected: '0:05' },
        { time: 0, expected: '0:00' },
      ];

      testCases.forEach(({ time, expected }) => {
        const { rerender } = render(
          <QuestionTimer timeRemaining={time} formatTime={mockFormatTime} />
        );
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        rerender(<div />); // Clear for next test
      });
    });
  });

  describe('Visual States', () => {
    it('should show warning state when time is low (15 seconds or less)', () => {
      render(<QuestionTimer timeRemaining={15} formatTime={mockFormatTime} />);
      
      const timeDisplay = screen.getByText('0:15');
      expect(timeDisplay).toHaveClass('text-red-500');
    });

    it('should show normal state when time is above 15 seconds', () => {
      render(<QuestionTimer timeRemaining={30} formatTime={mockFormatTime} />);
      
      const timeDisplay = screen.getByText('0:30');
      expect(timeDisplay).toHaveClass('text-gray-600');
    });

    it('should show critical state when time is negative', () => {
      render(<QuestionTimer timeRemaining={-10} formatTime={mockFormatTime} />);
      
      const timeDisplay = screen.getByText('-0:10');
      expect(timeDisplay).toHaveClass('bg-red-500', 'text-white');
    });

    it('should show warning icon color when time is low', () => {
      const { container } = render(
        <QuestionTimer timeRemaining={10} formatTime={mockFormatTime} />
      );
      
      // Check for red icon when time is low
      const clockIcon = container.querySelector('.text-red-500');
      expect(clockIcon).toBeInTheDocument();
    });

    it('should show normal icon color when time is sufficient', () => {
      const { container } = render(
        <QuestionTimer timeRemaining={30} formatTime={mockFormatTime} />
      );
      
      // Check for gray icon when time is normal
      const clockIcon = container.querySelector('.text-gray-600');
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for different screen sizes', () => {
      const { container } = render(<QuestionTimer {...defaultProps} />);
      
      const timerContainer = container.firstChild;
      expect(timerContainer).toHaveClass('flex', 'items-center');
    });

    it('should maintain consistent styling across different times', () => {
      const { container, rerender } = render(
        <QuestionTimer timeRemaining={120} formatTime={mockFormatTime} />
      );
      
      const initialContainer = container.firstChild;
      expect(initialContainer).toHaveClass('bg-gray-50', 'rounded-lg');
      
      // Test with different time
      rerender(<QuestionTimer timeRemaining={10} formatTime={mockFormatTime} />);
      
      const updatedContainer = container.firstChild;
      expect(updatedContainer).toHaveClass('bg-gray-50', 'rounded-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero time correctly', () => {
      render(<QuestionTimer timeRemaining={0} formatTime={mockFormatTime} />);
      
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should handle large time values', () => {
      render(<QuestionTimer timeRemaining={3600} formatTime={mockFormatTime} />);
      
      expect(screen.getByText('60:00')).toBeInTheDocument();
    });

    it('should handle negative time values', () => {
      render(<QuestionTimer timeRemaining={-30} formatTime={mockFormatTime} />);
      
      const timeDisplay = screen.getByText('-0:30');
      expect(timeDisplay).toBeInTheDocument();
      expect(timeDisplay).toHaveClass('bg-red-500', 'text-white');
    });

    it('should handle very large negative values', () => {
      render(<QuestionTimer timeRemaining={-150} formatTime={mockFormatTime} />);
      
      expect(screen.getByText('-2:30')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<QuestionTimer {...defaultProps} />);
      
      // Check that time is displayed as text content
      expect(screen.getByText('1:00')).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      render(<QuestionTimer {...defaultProps} />);
      
      // Ensure text is not hidden from screen readers
      const timeText = screen.getByText('1:00');
      expect(timeText).toBeVisible();
    });
  });

  describe('Animation and Transitions', () => {
    it('should have transition classes for smooth state changes', () => {
      const { container } = render(<QuestionTimer {...defaultProps} />);
      
      const timerContainer = container.firstChild;
      expect(timerContainer).toHaveClass('transition-all', 'duration-300');
    });

    it('should apply transition classes to time display', () => {
      render(<QuestionTimer timeRemaining={10} formatTime={mockFormatTime} />);
      
      const timeDisplay = screen.getByText('0:10');
      expect(timeDisplay).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with custom format functions', () => {
      const customFormat = (time: number) => `${time}s`;
      
      render(<QuestionTimer timeRemaining={45} formatTime={customFormat} />);
      
      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('should handle format function that returns different structures', () => {
      const colonFormat = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}::${seconds}`;
      };
      
      render(<QuestionTimer timeRemaining={75} formatTime={colonFormat} />);
      
      expect(screen.getByText('1::15')).toBeInTheDocument();
    });
  });
}); 