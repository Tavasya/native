// tests/unit/components/student/feedback/Transcript.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Transcript from '@/components/student/feedback/Transcript';
import { SectionFeedback } from '@/types/feedback';

const mockSetOpenPopover = jest.fn();

const mockFeedbackWithImprovedTranscript: SectionFeedback = {
  grade: 7.5,
  feedback: "Good work overall",
  paragraph_restructuring: {
    target_band: "7.0",
    original_band: "6.0",
    improved_transcript: "This is an enhanced transcript with better grammar and vocabulary."
  },
  grammar: {
    grade: 7,
    issues: []
  },
  vocabulary: {
    grade: 8,
    issues: [],
    vocabulary_suggestions: {}
  }
};

const mockFeedbackWithoutImprovedTranscript: SectionFeedback = {
  grade: 6.5,
  feedback: "Needs improvement"
};

describe('Transcript Component', () => {
  beforeEach(() => {
    mockSetOpenPopover.mockClear();
  });

  it('renders basic transcript correctly', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={null}
        highlightType="none"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    expect(screen.getByText('This is the original transcript.')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
  });

  it('shows Enhanced button when improved transcript is available', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithImprovedTranscript}
        highlightType="grammar"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    expect(screen.getByRole('button', { name: /Enhanced/i })).toBeInTheDocument();
    expect(screen.getByText('This is the clean transcript.')).toBeInTheDocument();
  });

  it('does not show Enhanced button when no improved transcript is available', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithoutImprovedTranscript}
        highlightType="grammar"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    expect(screen.queryByRole('button', { name: /Enhanced/i })).not.toBeInTheDocument();
  });

  it('switches to enhanced transcript when Enhanced button is clicked for grammar', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithImprovedTranscript}
        highlightType="grammar"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    // Initially shows clean transcript for grammar highlighting
    expect(screen.getByText('This is the clean transcript.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enhanced/i })).toBeInTheDocument();

    // Click Enhanced button
    fireEvent.click(screen.getByRole('button', { name: /Enhanced/i }));

    // Should now show enhanced transcript
    expect(screen.getByText('This is an enhanced transcript with better grammar and vocabulary.')).toBeInTheDocument();
    expect(screen.getByText('(Enhanced)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Original/i })).toBeInTheDocument();
  });

  it('switches to enhanced transcript when Enhanced button is clicked for vocabulary', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithImprovedTranscript}
        highlightType="vocabulary"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    // Initially shows clean transcript for grammar highlighting
    expect(screen.getByText('This is the clean transcript.')).toBeInTheDocument();

    // Click Enhanced button
    fireEvent.click(screen.getByRole('button', { name: /Enhanced/i }));

    // Should now show enhanced transcript
    expect(screen.getByText('This is an enhanced transcript with better grammar and vocabulary.')).toBeInTheDocument();
    expect(screen.getByText('(Enhanced)')).toBeInTheDocument();
  });

  it('switches back to original transcript when Original button is clicked', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithImprovedTranscript}
        highlightType="grammar"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    // Click Enhanced button
    fireEvent.click(screen.getByRole('button', { name: /Enhanced/i }));
    expect(screen.getByText('This is an enhanced transcript with better grammar and vocabulary.')).toBeInTheDocument();

    // Click Original button
    fireEvent.click(screen.getByRole('button', { name: /Original/i }));

    // Should now show clean transcript again for grammar highlighting
    expect(screen.getByText('This is the clean transcript.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enhanced/i })).toBeInTheDocument();
  });

  it('works correctly for all sections with enhanced transcript', () => {
    render(
      <Transcript
        transcript="This is the original transcript."
        cleanTranscript="This is the clean transcript."
        currentFeedback={mockFeedbackWithImprovedTranscript}
        highlightType="none"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    // Should show Enhanced button for fluency too
    expect(screen.getByRole('button', { name: /Enhanced/i })).toBeInTheDocument();

    // Click Enhanced button
    fireEvent.click(screen.getByRole('button', { name: /Enhanced/i }));

    // Should show enhanced transcript
    expect(screen.getByText('This is an enhanced transcript with better grammar and vocabulary.')).toBeInTheDocument();
  });

  it('uses clean transcript for grammar highlighting when available', () => {
    const mockFeedbackWithGrammarIssues: SectionFeedback = {
      grade: 6.0,
      feedback: "Some grammar issues found",
      grammar: {
        grade: 6,
        issues: [{
          original: "This are",
          correction: {
            suggested_correction: "This is",
            explanation: "Subject-verb disagreement",
            original_phrase: "This are"
          }
        }]
      }
    };

    render(
      <Transcript
        transcript="This are bad grammar in the original."
        cleanTranscript="This are bad grammar in the clean version."
        currentFeedback={mockFeedbackWithGrammarIssues}
        highlightType="grammar"
        selectedQuestionIndex={0}
        openPopover={null}
        setOpenPopover={mockSetOpenPopover}
      />
    );

    // When not in enhanced mode, should use clean transcript for grammar highlighting
    // The highlighting splits the text, so we check for the highlighted part
    expect(screen.getByText('This are')).toBeInTheDocument();
    expect(screen.getByText(/bad grammar in the clean version/)).toBeInTheDocument();
  });
});