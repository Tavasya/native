# SubmissionFeedback Component Refactoring Plan

## Current Issues
- The component is over 1500 lines long
- Contains too many responsibilities
- Makes maintenance and testing difficult
- Reduces code reusability

## Proposed Component Structure

### 1. Main Components
- `SubmissionFeedback.tsx` (Main container)
  - Handles routing, state management, and layout
  - Composes smaller components
  - Manages global state and API calls

### 2. Layout Components
- `components/student/feedback/FeedbackHeader.tsx`
  - Back button
  - Assignment title
  - Submission date
  - Student name
  - Submit & Send button

- `components/student/feedback/OverallScoring.tsx`
  - Overall scores display
  - Score editing functionality
  - Score color utilities

- `components/student/feedback/TeacherComment.tsx`
  - Comment display
  - Comment editing functionality

### 3. Question Components
- `components/student/feedback/QuestionSelector.tsx`
  - Question navigation buttons
  - Question state management

- `components/student/feedback/AudioPlayer.tsx`
  - Audio playback controls
  - Audio segment playback functionality

- `components/student/feedback/Transcript.tsx`
  - Transcript display
  - Highlighting functionality
  - Grammar/Vocabulary highlighting

### 4. Analysis Components
- `components/student/feedback/analysis/FluencyAnalysis.tsx`
  - Speech speed analysis
  - Pause analysis
  - Cohesive devices
  - Filler words

- `components/student/feedback/analysis/PronunciationAnalysis.tsx`
  - Word pronunciation table
  - IPA display
  - Score display
  - Audio playback controls

- `components/student/feedback/analysis/GrammarAnalysis.tsx`
  - Grammar issues list
  - Issue details
  - Editing functionality

- `components/student/feedback/analysis/VocabularyAnalysis.tsx`
  - Vocabulary issues list
  - Issue details
  - Editing functionality

### 5. Shared Components
- `components/student/feedback/shared/ScoreDisplay.tsx`
  - Score display with color coding
  - Score editing input

- `components/student/feedback/shared/IssueCard.tsx`
  - Collapsible issue display
  - Delete functionality
  - Common styling

### 6. Utilities
- `utils/feedback/scoreUtils.ts`
  - Score color calculations
  - Speed category calculations

- `utils/feedback/audioUtils.ts`
  - Audio playback utilities
  - TTS functionality

- `utils/feedback/textUtils.ts`
  - Text highlighting
  - IPA conversion

### 7. Types
- `types/feedback.ts`
  - All TypeScript interfaces
  - Type definitions

## Implementation Steps

1. Create the directory structure
2. Move types to separate file
3. Extract utility functions
4. Create shared components
5. Create analysis components
6. Create layout components
7. Refactor main component to use new components
8. Add proper prop types and documentation
9. Add error boundaries
10. Add loading states
11. Add tests

## Benefits
- Improved code organization
- Better maintainability
- Easier testing
- Reusable components
- Better performance through component isolation
- Clearer responsibility separation
- Easier to add new features

## Migration Strategy
1. Create new components alongside existing code
2. Gradually move functionality to new components
3. Update imports and props
4. Test each component in isolation
5. Remove old code once migration is complete

## Testing Strategy
- Unit tests for utility functions
- Component tests for each new component
- Integration tests for main component
- E2E tests for critical user flows 