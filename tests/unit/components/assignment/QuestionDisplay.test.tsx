/**
 * QuestionDisplay Component Tests
 * Tests for hint feature and audio URL functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import QuestionDisplay from '@/components/assignment/QuestionDisplay';
import { createMockStore } from '../../../utils/simple-redux-utils';
import { QuestionCard } from '@/features/assignments/types';

// Mock TTS service
jest.mock('@/features/tts/ttsService', () => ({
  generateTTSAudio: jest.fn(() => Promise.resolve('mock-audio-url'))
}));

// Mock Redux hooks
jest.mock('@/app/hooks', () => ({
  useAppDispatch: () => jest.fn()
}));

// Mock HTMLAudioElement
global.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
global.HTMLMediaElement.prototype.pause = jest.fn();
global.HTMLMediaElement.prototype.addEventListener = jest.fn();
global.HTMLMediaElement.prototype.removeEventListener = jest.fn();

// Create test store
const createTestStore = (overrides: any = {}) => {
  const defaultState = {
    tts: {
      audioCache: {},
      loading: {},
      error: null
    },
    ...overrides
  };
  
  return createMockStore(defaultState);
};

// Helper to render component with providers
const renderWithProviders = (props: any, store = createTestStore()) => {
  return render(
    <Provider store={store as any}>
      <QuestionDisplay {...props} />
    </Provider>
  );
};

describe('QuestionDisplay - Hint Feature', () => {
  const mockQuestion: QuestionCard & { isCompleted?: boolean } = {
    id: 'q1',
    type: 'normal',
    question: 'What is your favorite hobby?',
    speakAloud: false,
    timeLimit: '2',
    hasHint: true,
    hintText: 'Think about what you enjoy doing in your free time.'
  };

  it('displays hint when hasHint is true and hintText is provided', () => {
    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: false,
      isRecording: false
    });

    expect(screen.getByText('Hint')).toBeInTheDocument();
    expect(screen.getByText('Think about what you enjoy doing in your free time.')).toBeInTheDocument();
  });

  it('hides hint during recording', () => {
    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: false,
      isRecording: true
    });

    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    expect(screen.queryByText('Think about what you enjoy doing in your free time.')).not.toBeInTheDocument();
  });

  it('hides hint in test mode', () => {
    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: true,
      isAudioOnlyMode: false,
      isRecording: false
    });

    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    expect(screen.queryByText('Think about what you enjoy doing in your free time.')).not.toBeInTheDocument();
  });

  it('hides hint in audio-only mode', () => {
    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: true,
      isRecording: false
    });

    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    expect(screen.queryByText('Think about what you enjoy doing in your free time.')).not.toBeInTheDocument();
  });

  it('displays hint for Part 2 (bulletPoints) questions when enabled', () => {
    const part2Question: QuestionCard & { isCompleted?: boolean } = {
      id: 'q2',
      type: 'bulletPoints',
      question: 'Describe your hobbies',
      bulletPoints: ['Reading', 'Swimming'],
      speakAloud: false,
      timeLimit: '3',
      hasHint: true,
      hintText: 'Think about activities you do in your free time'
    };

    renderWithProviders({
      currentQuestion: part2Question,
      isTestMode: false,
      isAudioOnlyMode: false,
      isRecording: false
    });

    expect(screen.getByText('Hint')).toBeInTheDocument();
    expect(screen.getByText('Think about activities you do in your free time')).toBeInTheDocument();
  });
});

describe('QuestionDisplay - Audio URL Feature', () => {
  const mockQuestion: QuestionCard & { isCompleted?: boolean } = {
    id: 'q1',
    type: 'normal',
    question: 'What is your favorite food?',
    speakAloud: false,
    timeLimit: '2'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows audio-only layout when isAudioOnlyMode is true for normal questions', () => {
    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: true,
      isRecording: false
    });

    expect(screen.getByText('Audio Only Question')).toBeInTheDocument();
    expect(screen.getByText('Click the play button to hear the question')).toBeInTheDocument();
    expect(screen.queryByText('What is your favorite food?')).not.toBeInTheDocument();
  });

  it('allows playing audio in audio-only mode', async () => {
    const { generateTTSAudio } = require('@/features/tts/ttsService');
    const user = userEvent.setup();

    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: true,
      isRecording: false
    });

    const playButton = screen.getByRole('button');
    await user.click(playButton);

    await waitFor(() => {
      expect(generateTTSAudio).toHaveBeenCalledWith('What is your favorite food?');
    });
  });

  it('shows loading state when audio is being generated', async () => {
    const { generateTTSAudio } = require('@/features/tts/ttsService');
    generateTTSAudio.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('mock-audio-url'), 100)));
    
    const user = userEvent.setup();

    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: false,
      isAudioOnlyMode: true,
      isRecording: false
    });

    const playButton = screen.getByRole('button');
    await user.click(playButton);

    expect(screen.getByText('Loading question audio...')).toBeInTheDocument();
  });

  it('auto-plays audio in test mode for normal questions', async () => {
    const { generateTTSAudio } = require('@/features/tts/ttsService');

    renderWithProviders({
      currentQuestion: mockQuestion,
      isTestMode: true,
      isAudioOnlyMode: false,
      isRecording: false
    });

    await waitFor(() => {
      expect(generateTTSAudio).toHaveBeenCalledWith('What is your favorite food?');
    });
  });

  it('does not hide question text for Part 2 questions in audio-only mode', () => {
    const part2Question: QuestionCard & { isCompleted?: boolean } = {
      id: 'q2',
      type: 'bulletPoints',
      question: 'Describe your hobbies',
      bulletPoints: ['Reading', 'Swimming'],
      speakAloud: false,
      timeLimit: '3'
    };

    renderWithProviders({
      currentQuestion: part2Question,
      isTestMode: false,
      isAudioOnlyMode: true,
      isRecording: false
    });

    // Part 2 questions should always show text, even in audio-only mode
    expect(screen.getByText('Describe your hobbies')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Swimming')).toBeInTheDocument();
  });
});