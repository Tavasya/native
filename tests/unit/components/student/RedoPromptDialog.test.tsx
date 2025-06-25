import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RedoPromptDialog from '../../../../src/components/student/RedoPromptDialog';

describe('RedoPromptDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onRedo: jest.fn(),
    onContinue: jest.fn(),
    assignmentTitle: 'Test Assignment',
    attemptCount: 2,
    isProcessing: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(<RedoPromptDialog {...defaultProps} />);

    expect(screen.getByText('Assignment Already Submitted')).toBeDefined();
    expect(screen.getByText(/Test Assignment/)).toBeDefined();
    expect(screen.getByText(/2 times/)).toBeDefined();
  });

  it('does not render dialog when closed', () => {
    render(<RedoPromptDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Assignment Already Submitted')).toBeNull();
  });

  it('shows singular form for single attempt', () => {
    render(<RedoPromptDialog {...defaultProps} attemptCount={1} />);

    expect(screen.getByText(/1 time/)).toBeDefined();
    expect(screen.queryByText(/1 times/)).toBeNull();
  });

  it('shows plural form for multiple attempts', () => {
    render(<RedoPromptDialog {...defaultProps} attemptCount={3} />);

    expect(screen.getByText(/3 times/)).toBeDefined();
  });

  it('calls onRedo when Start New Attempt button is clicked', () => {
    render(<RedoPromptDialog {...defaultProps} />);

    const startNewButton = screen.getByRole('button', { name: /Start New Attempt/i });
    fireEvent.click(startNewButton);

    expect(defaultProps.onRedo).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when Continue Current button is clicked', () => {
    render(<RedoPromptDialog {...defaultProps} />);

    const continueButton = screen.getByRole('button', { name: /Continue Current/i });
    fireEvent.click(continueButton);

    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when processing', () => {
    render(<RedoPromptDialog {...defaultProps} isProcessing={true} />);

    const startNewButton = screen.getByRole('button', { name: /Starting.../i });
    const continueButton = screen.getByRole('button', { name: /Continue Current/i });

    expect(startNewButton.hasAttribute('disabled')).toBe(true);
    expect(continueButton.hasAttribute('disabled')).toBe(true);
  });

  it('shows "Starting..." text when processing', () => {
    render(<RedoPromptDialog {...defaultProps} isProcessing={true} />);

    expect(screen.getByRole('button', { name: /Starting.../i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Start New Attempt/i })).toBeNull();
  });

  it('shows proper button text when not processing', () => {
    render(<RedoPromptDialog {...defaultProps} isProcessing={false} />);

    expect(screen.getByRole('button', { name: /Start New Attempt/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Starting.../i })).toBeNull();
  });

  it('displays information about continuing current attempt', () => {
    render(<RedoPromptDialog {...defaultProps} />);

    expect(screen.getByText('Continue with Current Attempt')).toBeDefined();
    expect(screen.getByText(/Continue working on your existing in-progress submission/)).toBeDefined();
  });

  it('displays information about starting new attempt', () => {
    render(<RedoPromptDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Start New Attempt/i })).toBeDefined();
    expect(screen.getByText(/Create a new submission attempt/)).toBeDefined();
    expect(screen.getByText(/Your previous attempts will be saved/)).toBeDefined();
  });
});