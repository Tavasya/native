# Feedback Report Generation Integration Test Plan

## Files to Reference
- `src/features/submissions/submissionThunks.ts` - Submission and analysis thunks
- `src/features/submissions/submissionsService.ts` - Audio analysis service
- `src/pages/student/SubmissionFeedback.tsx` - Feedback display component
- `src/pages/reports/Index.tsx` - Report navigation
- `src/pages/reports/PronunciationPage.tsx` - Pronunciation feedback
- `src/pages/reports/FluencyPage.tsx` - Fluency feedback
- `src/pages/reports/GrammarPage.tsx` - Grammar feedback
- `src/pages/reports/VocabularyPage.tsx` - Vocabulary feedback

## 1. Successful Full Report

### Scenario: Complete Analysis Flow
**Preconditions:**
- Mock submission with valid audio URLs
- Stubbed transcription service
- Mock AI analysis endpoints
- Clean Redux state

**User Actions:**
1. Navigate to `/submissions/:submissionId/feedback`
2. Wait for analysis completion
3. View feedback tabs

**Expected Assertions:**
- `analyzeAudio` thunk dispatches with:
  - Correct audio URLs
  - Valid submission ID
- Redux state updates:
  - `loading` toggles
  - `selectedSubmission` populated with:
    - Full transcript
    - Section feedback for all criteria
    - Audio URLs
- UI renders:
  - Overview page with scores
  - All feedback tabs enabled
  - Audio player controls
  - Transcript with highlights

### Scenario: Feedback Tab Navigation
**Preconditions:**
- Complete report data in Redux
- All analysis criteria available

**User Actions:**
1. Navigate between feedback tabs
2. View detailed feedback for each criterion

**Expected Assertions:**
- Each tab renders correct content:
  - Pronunciation: accuracy scores, sound patterns
  - Fluency: speech flow, coherence metrics
  - Grammar: error highlights, corrections
  - Vocabulary: word usage, suggestions
- Tab state persists on navigation
- Audio playback works in each tab

## 2. Transcription Failure

### Scenario: Partial Analysis
**Preconditions:**
- Mock submission with valid audio
- Transcription service error
- AI analysis endpoints available

**User Actions:**
1. Navigate to feedback page
2. Wait for analysis attempt

**Expected Assertions:**
- `analyzeAudio` thunk handles error:
  - Logs error details
  - Continues with available data
- Redux state updates:
  - `error` contains transcription error
  - `selectedSubmission` partial data
- UI shows:
  - "Transcript unavailable" message
  - Available feedback sections
  - Audio player still functional

### Scenario: Recovery Attempt
**Preconditions:**
- Failed transcription
- Retry endpoint available
- Clean error state

**User Actions:**
1. Click "Retry Analysis" button
2. Wait for retry attempt

**Expected Assertions:**
- `submitAudioAndAnalyze` thunk dispatches
- Redux state updates:
  - `loading` toggles
  - Error cleared on success
- UI shows:
  - Loading indicator
  - Success/error message
  - Updated feedback if successful

## 3. Partial Feedback

### Scenario: Limited Analysis
**Preconditions:**
- Mock submission with audio
- Only Pronunciation and Fluency analysis available
- Clean Redux state

**User Actions:**
1. Navigate to feedback page
2. Check available feedback sections

**Expected Assertions:**
- Redux state contains:
  - Available analysis criteria
  - Missing criteria marked as null
- UI adapts:
  - Enabled tabs for available feedback
  - Disabled tabs for missing feedback
  - Clear messaging about limitations
- Audio playback works for all sections

### Scenario: Progressive Analysis
**Preconditions:**
- Initial partial analysis
- Background analysis in progress
- Clean Redux state

**User Actions:**
1. View initial feedback
2. Wait for additional analysis
3. Check updated feedback

**Expected Assertions:**
- Redux state updates:
  - New criteria added as available
  - Existing data preserved
- UI updates:
  - New tabs enabled
  - Progress indicators
  - Updated scores

## 4. Report Not Ready (Polling)

### Scenario: Processing State
**Preconditions:**
- New submission
- Mock processing state
- Clean Redux state

**User Actions:**
1. Navigate to feedback page
2. Wait for processing completion

**Expected Assertions:**
- `fetchSubmissionById` thunk:
  - Initial call returns processing status
  - Polls until complete
  - Updates state on completion
- Redux state shows:
  - Processing status
  - Progress updates
- UI displays:
  - Loading spinner
  - Progress percentage
  - Estimated time remaining

### Scenario: Polling Timeout
**Preconditions:**
- Stuck processing state
- Polling timeout configured
- Clean Redux state

**User Actions:**
1. Navigate to feedback page
2. Wait for timeout

**Expected Assertions:**
- Polling stops after timeout
- Redux state updates:
  - Error set
  - Processing status cleared
- UI shows:
  - Timeout message
  - Retry option
  - Partial data if available

## 5. Service Error Handling

### Scenario: AI Service Failure
**Preconditions:**
- Mock submission with audio
- AI service returns 500
- Clean error state

**User Actions:**
1. Navigate to feedback page
2. Wait for analysis attempt

**Expected Assertions:**
- `analyzeAudio` thunk:
  - Catches error
  - Updates error state
  - Preserves submission data
- Redux state shows:
  - Error message
  - Partial data if available
- UI displays:
  - Error message
  - Retry button
  - Available data sections

### Scenario: Recovery Flow
**Preconditions:**
- Failed analysis
- Service restored
- Clean error state

**User Actions:**
1. Click retry button
2. Wait for new analysis

**Expected Assertions:**
- New analysis attempt:
  - Fresh API call
  - Progress tracking
  - State updates
- UI shows:
  - Loading state
  - Progress updates
  - Success/error message

## Integration Points to Verify

1. **Analysis Flow**
   - Audio URL preparation → Analysis request → Response handling
   - Error recovery and retry logic
   - State management during processing

2. **UI Integration**
   - Tab navigation and state
   - Progress indicators
   - Error handling and recovery
   - Audio playback integration

3. **Data Flow**
   - Redux state updates
   - Component prop passing
   - Error state management
   - Progress tracking 