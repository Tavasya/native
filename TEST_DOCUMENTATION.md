# Test Suite Documentation

This document provides a comprehensive overview of the test suite, explaining the purpose and functionality of each test file and test case.

## Test Structure Overview

The test suite is organized into several categories:

- **Unit Tests** (`tests/unit/`) - Test individual components, hooks, and utilities in isolation
- **Integration Tests** (`tests/integration/`) - Test interaction between multiple components and services
- **Mocks** (`tests/mocks/`) - Shared mock implementations
- **Fixtures** (`tests/fixtures/`) - Test data and fixtures
- **Utils** (`tests/utils/`) - Test utilities and helpers
- **Playwright Tests** (`tests/playwright/`) - End-to-end browser tests

---

## Unit Tests

### Hook Tests (`tests/unit/hooks/`)

#### `useRecordingSession.test.tsx`
**Purpose**: Tests the `useRecordingSession` hook that manages audio recording session state, uploads, and Supabase integration.

**Key Test Categories**:
- **Initialization**: Tests hook initialization with different prop configurations
- **Recording Management**: Tests detection and management of question recordings
- **Recording Save Workflow**: Tests the process of saving recordings locally and uploading to cloud storage
- **Upload State Management**: Tests tracking of upload progress, success, and error states
- **Existing Submission Loading**: Tests loading and processing of previously submitted recordings
- **URL Management**: Tests creation and management of stable URLs for audio playback
- **Recording Status Checks**: Tests validation of recording upload states
- **Integration Scenarios**: Tests complete workflows from recording to upload

**What it validates**:
- Recording session state management
- Audio blob handling and URL creation
- Supabase integration for storage and database operations
- Redux store integration for persistent state
- Error handling for upload failures
- Toast notifications for user feedback

#### `useAudioRecording.test.ts`
**Purpose**: Tests the core audio recording functionality including MediaRecorder API integration.

**Key Test Categories**:
- Audio recording start/stop/pause functionality
- MediaRecorder API integration
- Audio format handling and validation
- Recording state management
- Error handling for browser compatibility issues

### Utility Tests (`tests/unit/utils/`)

#### `scoreUtils.test.ts`
**Purpose**: Tests scoring calculation algorithms and UI display logic for audio analysis results.

**Key Test Categories**:
- **Score Calculation**: Tests `calculateOverallPronunciationScore` function
  - Empty input handling
  - Single and multiple word calculations
  - Rounding behavior
  - Missing data handling
  - Extreme score edge cases

- **Word Filtering**: Tests `getWordsToShow` function
  - Length-based filtering (removes words ≤2 letters)
  - Score-based filtering (removes words with scores ≥80)
  - Combined filtering logic
  - Edge case handling

- **Speed Categorization**: Tests `getSpeedCategory` function
  - Speech speed classification (Too Slow, Slow, Good, Fast, Too Fast)
  - Color coding for different speed categories
  - Boundary condition testing

- **Visual Feedback**: Tests `getScoreColor` and `getPhonemeColor` functions
  - Color assignment based on score ranges
  - Consistent visual feedback mapping

**What it validates**:
- Core business logic for scoring algorithms
- UI display calculations
- Data filtering and categorization
- Visual feedback consistency

#### `utils.test.ts`
**Purpose**: Tests general utility functions used throughout the application.

**Key functionality tested**:
- Date/time formatting utilities
- String manipulation functions
- Data validation helpers
- Common utility functions

### Component Tests

#### `LoadingSpinner.test.tsx`
**Purpose**: Tests the loading spinner component rendering and behavior.

**What it validates**:
- Component renders correctly
- Loading states display properly
- Accessibility attributes are present

#### `QuestionTimer.test.tsx`
**Purpose**: Tests the question timer component functionality.

**Key Test Categories**:
- Timer initialization and countdown
- Timer state management (running, paused, stopped)
- Time formatting and display
- Timer completion handling
- User interaction with timer controls

#### `useQuestionTimer.test.ts`
**Purpose**: Tests the question timer hook logic separately from the UI component.

**What it validates**:
- Timer state management
- Countdown logic
- Timer event handling
- Integration with question flow

### Redux State Management Tests (`tests/unit/redux/`)

#### `assignment-basic.test.ts`
**Purpose**: Tests basic assignment-related Redux state management.

**Key Test Categories**:
- Assignment loading and storage
- Assignment status updates
- State synchronization
- Action creators and reducers

#### `auth-basic.test.ts`
**Purpose**: Tests authentication-related Redux state management.

**Key Test Categories**:
- User authentication state
- Login/logout actions
- Session management
- Auth state persistence

### Audio Processing Tests (`tests/unit/audio/`)

#### `validateAudioBlob.test.ts`
**Purpose**: Tests audio file validation functionality before processing or upload.

**Key Test Categories**:
- **Audio Format Validation**: Tests support for different audio formats (WebM, MP4, etc.)
- **File Size Validation**: Tests file size limits and validation
- **Audio Quality Checks**: Tests audio quality requirements
- **Corruption Detection**: Tests detection of corrupted audio files
- **Browser Compatibility**: Tests format support across different browsers
- **Metadata Validation**: Tests audio metadata requirements

**What it validates**:
- Audio file format compatibility
- File integrity and quality
- Upload prerequisites
- Error reporting for invalid files

### Authentication Tests (`tests/unit/auth/`)

#### `auth-simple.test.ts`
**Purpose**: Tests authentication flow and user management functionality.

**Key Test Categories**:
- User login/logout processes
- Session validation
- Token management
- Authentication error handling
- User role and permission validation

---

## Integration Tests

### `audio-recording-validation.test.tsx`
**Purpose**: Tests the complete audio recording validation pipeline from capture to validation.

**What it validates**:
- End-to-end recording validation flow
- Integration between recording components and validation utilities
- Error handling across the validation pipeline
- User feedback for validation results

### `audio-upload-storage.test.tsx`
**Purpose**: Tests the complete audio upload flow from client to cloud storage.

**Key Test Categories**:
- **Successful Upload Flow**: Tests complete upload process to cloud storage
- **File Path Generation**: Tests proper file naming and collision prevention
- **Upload Error Handling**: Tests various failure scenarios
  - Storage quota exceeded
  - Network interruptions
  - Authentication errors
- **Upload State Management**: Tests progress tracking and state transitions

**What it validates**:
- Integration between upload service and cloud storage
- Error handling and user feedback
- File management and organization
- Upload progress and completion tracking

### `submission-analysis.test.tsx`
**Purpose**: Tests the complete submission and analysis workflow from recording submission to AI analysis results.

**Key Test Categories**:
- **Complete Workflow**: Tests full submission → analysis → results pipeline
- **Multi-Question Handling**: Tests submissions with multiple recorded answers
- **Analysis Error Handling**: Tests various analysis failure scenarios
- **Results Processing**: Tests parsing and display of analysis results
- **State Management**: Tests tracking of submission and analysis states

**What it validates**:
- End-to-end submission workflow
- Integration with AI analysis services
- Complex state management across multiple async operations
- Error recovery and user feedback

### `timer-integration.test.tsx`
**Purpose**: Tests integration between timer functionality and question flow.

**Key Test Categories**:
- Timer integration with question navigation
- Time limit enforcement
- Auto-advance functionality
- Timer synchronization across components
- Question completion tracking

**What it validates**:
- Seamless integration between timing and question flow
- Consistent timer behavior across the application
- Proper handling of time-based question transitions

---

## Test Patterns and Best Practices

### Mocking Strategy
- **Supabase Integration**: Comprehensive mocking of database and storage operations
- **Audio APIs**: MediaRecorder and Web Audio API mocking for cross-browser testing
- **Redux Store**: Configurable mock stores for different test scenarios
- **Network Requests**: Controlled mocking of API calls and responses

### Test Organization
- **Arrange-Act-Assert Pattern**: Clear separation of test setup, execution, and validation
- **Descriptive Test Names**: Tests clearly describe what functionality they validate
- **Grouped Test Cases**: Related tests are organized into logical describe blocks
- **Edge Case Coverage**: Comprehensive testing of boundary conditions and error scenarios

### Async Testing
- **Proper Async Handling**: Correct use of `waitFor` and `act` for async operations
- **State Transition Testing**: Validation of intermediate states during async operations
- **Error Boundary Testing**: Testing of error states and recovery mechanisms

### Component Testing
- **User-Centric Tests**: Tests focus on user interactions and observable behavior
- **Accessibility Testing**: Validation of accessibility attributes and behavior
- **Integration Over Implementation**: Tests focus on component integration rather than internal implementation

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test/file.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Coverage Areas

The test suite provides comprehensive coverage of:

✅ **Core Business Logic**: Scoring algorithms, data processing, validation rules  
✅ **User Interactions**: Recording, navigation, form submission  
✅ **State Management**: Redux stores, local state, session management  
✅ **External Integrations**: Supabase, audio APIs, analysis services  
✅ **Error Handling**: Network failures, validation errors, service outages  
✅ **Performance**: Upload progress, large file handling, async operations  
✅ **Accessibility**: Screen reader support, keyboard navigation  
✅ **Cross-browser Compatibility**: Audio format support, API availability  

This comprehensive test suite ensures reliability, maintainability, and confidence in the application's functionality across all critical user flows and edge cases.