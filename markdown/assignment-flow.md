# Assignment Flow Integration Test Plan

## Files to Reference
- `src/features/assignments/assignmentSlice.ts` - Redux state management
- `src/features/assignments/assignmentThunks.ts` - Assignment API calls
- `src/pages/teacher/CreateAssignmentPage.tsx` - Teacher assignment creation
- `src/pages/student/AssignmentPractice.tsx` - Student assignment view
- `src/components/assignment/QuestionCard.tsx` - Question rendering
- `src/features/assignments/types.ts` - Type definitions

## 1. Teacher Creates Assignment

### Scenario: Basic Assignment Creation
**Preconditions:**
- Mock Supabase client
- Test class with valid `classId`
- Authenticated teacher user
- Clean Redux state

**User Actions:**
1. Navigate to `/class/:classId/create-assignment`
2. Enter assignment title
3. Set due date
4. Add 3 questions with different types:
   - Text question
   - Audio prompt question
   - Image-based question
5. Click "Publish Assignment"

**Expected Assertions:**
- `createAssignment` thunk dispatches with correct payload:
  - `class_id` matches test class
  - `created_by` matches teacher ID
  - `title` and `due_date` match input
  - `questions` array contains all question types
- Redux state updates:
  - `createAssignmentLoading` toggles
  - New assignment added to `assignments` array
- UI redirects to class page
- Success toast appears

### Scenario: Validation & Error Handling
**Preconditions:**
- Mock Supabase client with error responses
- Test class with valid `classId`
- Authenticated teacher user

**User Actions:**
1. Navigate to create assignment page
2. Submit form with:
   - Empty title
   - Missing due date
   - Empty question content

**Expected Assertions:**
- Form validation prevents submission
- Error toasts appear for each validation failure
- Redux state remains unchanged
- No API calls made

## 2. Student Fetches & Views Assignment

### Scenario: Assignment Loading
**Preconditions:**
- Mock assignment in Supabase
- Authenticated student user
- Clean Redux state

**User Actions:**
1. Navigate to `/assignments/:assignmentId/practice`
2. Wait for assignment load

**Expected Assertions:**
- `fetchAssignmentById` thunk dispatches
- Redux state updates:
  - Assignment data loaded
  - Questions array populated
  - Loading state toggles
- UI renders:
  - Assignment title
  - Question cards in order
  - Navigation controls
  - Time limits per question

### Scenario: Question Navigation
**Preconditions:**
- Loaded assignment with multiple questions
- Clean practice progress state

**User Actions:**
1. Navigate between questions using controls
2. Verify question content loads

**Expected Assertions:**
- `updatePracticeProgress` action dispatches
- Redux state updates:
  - `currentQuestionIndex` changes
  - `completedQuestions` array updates
- UI updates:
  - Question content changes
  - Progress indicators update
  - Navigation buttons enable/disable

## 3. Progress Persistence

### Scenario: Progress State Persistence
**Preconditions:**
- Partially completed assignment
- Existing practice progress in Redux
- Mock localStorage

**User Actions:**
1. Complete first question
2. Refresh page
3. Navigate back to first question

**Expected Assertions:**
- `practiceProgress` state persists in Redux
- `completedQuestions` array contains first question ID
- UI shows:
  - First question marked complete
  - Progress saved message
  - Correct navigation state

### Scenario: Progress Recovery
**Preconditions:**
- Assignment with existing submissions
- Mock submission data in Supabase
- Clean Redux state

**User Actions:**
1. Load assignment
2. Navigate to previously completed questions

**Expected Assertions:**
- `fetchLatestSubmissionsByAssignment` thunk dispatches
- Redux state updates:
  - Submissions loaded
  - Progress restored
- UI shows:
  - Previous recordings
  - Completion status
  - Correct navigation state

## 4. Due Date Enforcement

### Scenario: Past Due Assignment
**Preconditions:**
- Assignment with past due date
- Authenticated student user
- Clean Redux state

**User Actions:**
1. Navigate to past due assignment
2. Attempt to submit

**Expected Assertions:**
- UI shows:
  - "Assignment closed" message
  - Submit button disabled
  - Due date warning
- No submission allowed
- Error toast appears

### Scenario: Approaching Due Date
**Preconditions:**
- Assignment due in 1 hour
- Authenticated student user
- Clean Redux state

**User Actions:**
1. Navigate to assignment
2. View due date warning

**Expected Assertions:**
- UI shows:
  - Time remaining warning
  - Submit button enabled
  - Due date countdown
- Submission still allowed
- Warning toast appears

## 5. Question Template Variants

### Scenario: Text Question
**Preconditions:**
- Assignment with text question
- Clean Redux state

**User Actions:**
1. Navigate to text question
2. View question content

**Expected Assertions:**
- UI renders:
  - Question text
  - Recording controls
  - Time limit
- Redux state updates:
  - Question type recognized
  - Correct UI components loaded

### Scenario: Audio Prompt Question
**Preconditions:**
- Assignment with audio prompt
- Mock audio file
- Clean Redux state

**User Actions:**
1. Navigate to audio question
2. Play audio prompt
3. Record response

**Expected Assertions:**
- UI renders:
  - Audio player
  - Play/pause controls
  - Recording interface
- Audio playback works
- Recording starts/stops correctly

### Scenario: Image Question
**Preconditions:**
- Assignment with image prompt
- Mock image file
- Clean Redux state

**User Actions:**
1. Navigate to image question
2. View image
3. Record response

**Expected Assertions:**
- UI renders:
  - Image display
  - Image controls
  - Recording interface
- Image loads correctly
- Recording works with image context

## Integration Points to Verify

1. **Redux Flow**
   - Action dispatch → Thunk → API call → State update
   - Progress persistence across page loads
   - Error state handling

2. **Component Integration**
   - Props flow from Redux to components
   - State updates trigger UI changes
   - Event handlers update Redux

3. **API Contracts**
   - Assignment creation payload structure
   - Question template variants
   - Progress tracking format 