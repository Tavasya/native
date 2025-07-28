import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationButton from '../../../../src/components/assignment/NavigationButton';

describe('NavigationButton', () => {
  const defaultProps = {
    isLastQuestion: false,
    hasRecorded: true,
    isPlaying: false,
    isPreviewMode: false,
    isUploading: false,
    hasUploadError: false,
    isAutoAdvancing: false,
    isTest: false,
    hasRetried: false,
    isRecording: false,
    onComplete: jest.fn(),
    onNext: jest.fn(),
    onRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Recording State Behavior', () => {
    it('should hide buttons and show recording message when isRecording is true', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={true}
        />
      );

      // Should not show the Next/Finish button
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
      expect(screen.queryByText('Finish')).not.toBeInTheDocument();
      
      // Should show recording message instead
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument();
    });

    it('should show Next button when not recording and not last question', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={false}
          isLastQuestion={false}
        />
      );

      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.queryByText('Recording in progress...')).not.toBeInTheDocument();
    });

    it('should show Finish button when not recording and is last question', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={false}
          isLastQuestion={true}
        />
      );

      expect(screen.getByText('Finish')).toBeInTheDocument();
      expect(screen.queryByText('Recording in progress...')).not.toBeInTheDocument();
    });

    it('should not call onComplete when buttons are hidden due to recording', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={true}
        />
      );

      // Try to click where the button would be - should not trigger anything
      const recordingMessage = screen.getByText('Recording in progress...');
      fireEvent.click(recordingMessage);
      
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Normal Button Behavior', () => {
    it('should call onComplete when Finish button is clicked', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isLastQuestion={true}
          hasRecorded={true}
        />
      );

      const finishButton = screen.getByText('Finish');
      fireEvent.click(finishButton);
      
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button is clicked in preview mode', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isPreviewMode={true}
          isLastQuestion={false}
        />
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when hasRecorded is false', () => {
      render(
        <NavigationButton
          {...defaultProps}
          hasRecorded={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when isPlaying is true', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isPlaying={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when isUploading is true', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isUploading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should be disabled when isAutoAdvancing is true', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isAutoAdvancing={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Moving to next question...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show retry button when hasUploadError and isTest', () => {
      render(
        <NavigationButton
          {...defaultProps}
          hasUploadError={true}
          isTest={true}
          hasRetried={false}
        />
      );

      expect(screen.getByText('Retry Question')).toBeInTheDocument();
      expect(screen.getByText('Network error - please retry this question')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      render(
        <NavigationButton
          {...defaultProps}
          hasUploadError={true}
          isTest={true}
          hasRetried={false}
        />
      );

      const retryButton = screen.getByText('Retry Question');
      fireEvent.click(retryButton);
      
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when hasRetried is true', () => {
      render(
        <NavigationButton
          {...defaultProps}
          hasUploadError={true}
          isTest={true}
          hasRetried={true}
        />
      );

      expect(screen.queryByText('Retry Question')).not.toBeInTheDocument();
    });

    it('should show upload error message for non-test mode', () => {
      render(
        <NavigationButton
          {...defaultProps}
          hasUploadError={true}
          isTest={false}
        />
      );

      expect(screen.getByText('Please retry recording - upload failed')).toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('should prioritize recording state over other disabled states', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={true}
          hasRecorded={false}
          isPlaying={true}
          isUploading={true}
        />
      );

      // Should show recording message instead of disabled button
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle recording state with upload error', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isRecording={true}
          hasUploadError={true}
          isTest={true}
        />
      );

      // Should show recording message, not retry button
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument();
      expect(screen.queryByText('Retry Question')).not.toBeInTheDocument();
    });
  });

  describe('Preview Mode', () => {
    it('should be disabled on last question in preview mode', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isPreviewMode={true}
          isLastQuestion={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be enabled on non-last question in preview mode', () => {
      render(
        <NavigationButton
          {...defaultProps}
          isPreviewMode={true}
          isLastQuestion={false}
          hasRecorded={false} // Preview mode doesn't require recording
        />
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });
});