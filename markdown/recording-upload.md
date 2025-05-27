# Recording & Upload Integration Test Plan

## Files to Reference
- `src/utils/webm-diagnostics.ts` - Audio validation and repair utilities
- `src/features/submissions/submissionThunks.ts` - Upload and submission logic
- `src/features/submissions/audioUploadService.ts` - Storage upload service
- `src/features/submissions/submissionsService.ts` - Submission validation and analysis
- `src/components/assignment/AudioVisualizer.tsx` - Recording visualization
- `src/pages/student/AssignmentPractice.tsx` - Recording interface

## 1. Start & Stop Recording

### Scenario: Basic Recording Flow
**Preconditions:**
- Mock `MediaStream` with audio track
- Mock `MediaRecorder` with supported MIME types
- Clean Redux state for recordings

**User Actions:**
1. Navigate to assignment practice page
2. Click "Start Recording" button
3. Speak for 5 seconds
4. Click "Stop Recording" button

**Expected Assertions:**
- `MediaRecorder` starts with `OPTIMAL_RECORDER_OPTIONS`
- `AudioVisualizer` canvas updates with audio levels
- Recording chunks are collected
- Final blob is created with correct MIME type
- Redux state updates with recording URL
- Audio player appears with preview

### Scenario: Recording Validation
**Preconditions:**
- Valid audio stream available
- Recording permissions granted
- Clean validation state

**User Actions:**
1. Start recording
2. Speak for 3 seconds
3. Stop recording

**Expected Assertions:**
- `validateAudioBlob` checks:
  - Non-zero file size
  - Valid WebM MIME type
  - Proper WebM header structure
  - Minimum size threshold
- Validation result stored in Redux
- UI shows validation status

## 2. Upload Success Flow

### Scenario: Single Recording Upload
**Preconditions:**
- Valid WebM blob from recording
- Mock Supabase storage client
- Clean upload state

**User Actions:**
1. Complete recording
2. Click "Upload" button

**Expected Assertions:**
- `uploadAudioToStorage` is called with:
  - Correct blob
  - Proper file path structure
  - Valid MIME type
- Supabase storage upload succeeds
- Public URL is generated
- Redux state updates with:
  - `recordings[assignmentId][questionIndex].uploadedUrl`
  - Upload progress status
- UI shows success message

### Scenario: Batch Upload
**Preconditions:**
- Multiple valid recordings
- Mock storage client
- Clean submission state

**User Actions:**
1. Record multiple questions
2. Click "Submit Assignment"

**Expected Assertions:**
- `prepareRecordingsForSubmission` processes all recordings
- Each recording is uploaded to correct path
- `createSubmission` thunk is dispatched
- Redux state updates with:
  - All recording URLs
  - Submission status
  - Progress indicators
- UI shows overall progress

## 3. Corrupted Blob Handling

### Scenario: Invalid WebM Structure
**Preconditions:**
- Recording produces invalid WebM blob
- Mock repair utilities
- Error handling state

**User Actions:**
1. Start recording
2. Stop recording immediately
3. Attempt upload

**Expected Assertions:**
- `validateAudioBlob` detects invalid structure
- `repairWebMFile` is invoked
- Repair process:
  - Adds proper WebM header
  - Preserves audio data
  - Validates repaired blob
- Repaired blob is uploaded
- UI shows repair status

### Scenario: Repair Failure
**Preconditions:**
- Severely corrupted blob
- Mock repair utilities
- Error state handling

**User Actions:**
1. Record with simulated corruption
2. Attempt upload

**Expected Assertions:**
- `validateAudioBlob` fails
- `repairWebMFile` attempts repair
- Repair fails gracefully
- Error message shown to user
- Retry option presented

## 4. Zero-Byte File Handling

### Scenario: Empty Recording
**Preconditions:**
- Mock empty blob
- Error handling state
- Clean Redux state

**User Actions:**
1. Start recording
2. Stop immediately
3. Attempt upload

**Expected Assertions:**
- `validateAudioBlob` detects zero size
- Upload is prevented
- Error message shown
- Redux state shows error
- UI presents retry option

### Scenario: Network Failure
**Preconditions:**
- Mock network error
- Error handling state
- Clean upload state

**User Actions:**
1. Complete recording
2. Attempt upload with simulated network failure

**Expected Assertions:**
- Upload attempt fails
- Error caught in thunk
- Redux state shows error
- UI shows retry option
- Recording data preserved

## 5. Progress Tracking & Cancellation

### Scenario: Upload Progress
**Preconditions:**
- Large recording file
- Mock progress events
- Clean progress state

**User Actions:**
1. Complete recording
2. Start upload
3. Monitor progress

**Expected Assertions:**
- Progress events update Redux state
- UI shows progress bar
- Percentage updates
- Final success state

### Scenario: Upload Cancellation
**Preconditions:**
- Upload in progress
- Mock abort controller
- Clean cancellation state

**User Actions:**
1. Start upload
2. Click "Cancel" during upload

**Expected Assertions:**
- Abort signal sent
- Upload request cancelled
- Redux state cleared
- UI shows cancelled state
- Recording data preserved

## Integration Points to Verify

1. **Recording Flow**
   - `MediaRecorder` setup → `AudioVisualizer` updates → Blob creation
   - Validation chain: `validateAudioBlob` → `repairWebMFile` → upload
   - Error handling at each step

2. **Upload Flow**
   - Blob preparation → Storage upload → URL generation
   - Progress tracking
   - Error recovery
   - State management

3. **State Management**
   - Recording state in Redux
   - Upload progress tracking
   - Error state handling
   - UI synchronization 