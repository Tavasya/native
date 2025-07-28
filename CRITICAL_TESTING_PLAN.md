# Critical Testing Implementation Plan

## Phase 1: Core Business Logic (IMMEDIATE - Week 1)

### 1.1 Score Calculation Utilities Tests
**File:** `tests/unit/utils/scoreUtils.test.ts`
**Priority:** CRITICAL
**Coverage Target:** 100%
**Functions to Test:**
- `calculateOverallPronunciationScore()` - Core scoring algorithm
- `getWordsToShow()` - Pronunciation feedback filtering 
- `getSpeedCategory()` - Speech speed classification
- `getScoreColor()` & `getPhonemeColor()` - UI scoring logic

**Test Scenarios:**
- ✅ Valid score calculations with different word arrays
- ✅ Edge cases: empty arrays, null values, extreme scores
- ✅ Filtering logic for word display
- ✅ Speed categorization boundaries
- ✅ Color mapping accuracy

### 1.2 useRecordingSession Hook Tests  
**File:** `tests/unit/hooks/useRecordingSession.test.ts`
**Priority:** CRITICAL (321 lines, zero coverage)
**Coverage Target:** 80%+
**Key Functionality:**
- Multi-question recording state management
- Background upload tracking & error handling
- Supabase integration for session persistence
- Audio URL caching and signed URL generation
- Recording validation and collision prevention

**Test Scenarios:**
- ✅ Recording session initialization
- ✅ New recording save workflow
- ✅ Background upload success/failure handling
- ✅ Existing submission loading
- ✅ Upload error tracking and recovery
- ✅ Recording validation integration
- ✅ Audio URL caching mechanism

### 1.3 useSubmissionManager Hook Tests
**File:** `tests/unit/hooks/useSubmissionManager.test.ts` 
**Priority:** CRITICAL
**Coverage Target:** 80%+
**Key Functionality:**
- Final submission preparation & validation
- Missing recording detection
- Submission status management
- Audio analysis trigger coordination
- Error recovery and user feedback

**Test Scenarios:**
- ✅ Complete submission workflow
- ✅ Missing recording validation
- ✅ Submission error handling
- ✅ Analysis service integration
- ✅ User feedback and navigation

## Phase 2: Service Layer Testing (Week 2)

### 2.1 Audio Upload Service Tests
**File:** `tests/unit/services/audioUploadService.test.ts`
**Priority:** HIGH
**Functions:**
- `uploadAudioToStorage()` - File upload with auth validation
- `prepareRecordingsForSubmission()` - Batch processing
- File path generation and collision prevention

### 2.2 Assignment Service Tests  
**File:** `tests/unit/services/assignmentService.test.ts`
**Priority:** HIGH
**Functions:**
- Data transformation and JSON parsing
- Multi-table query aggregation
- Statistics calculation
- Error handling for malformed data

### 2.3 Submission Service Validation Tests
**File:** `tests/unit/services/submissionService.test.ts`
**Priority:** HIGH  
**Functions:**
- `validateSubmissionData()` - Validation chain
- `validateRecordingData()` - Individual validation
- `formatSubmissionData()` - Data transformation

## Phase 3: Integration & Redux Testing (Week 3)

### 3.1 Redux Thunk Integration Tests
**Files:** 
- `tests/unit/redux/assignmentThunks.test.ts`
- `tests/unit/redux/submissionThunks.test.ts`
**Priority:** MEDIUM-HIGH

### 3.2 Complex UI State Management Tests
**Files:**
- `tests/unit/hooks/useStateSubmission.test.ts`
- `tests/unit/hooks/useStateHandlers.test.ts`
**Priority:** MEDIUM

## Testing Strategy

### Test Development Approach:
1. **Test-First Development** - Write failing tests first
2. **Iterative Testing** - Run tests after each implementation
3. **Mock Strategy** - Mock external dependencies (Supabase, APIs)
4. **Coverage Monitoring** - Aim for 80%+ coverage on critical functions

### Test Categories:
- **Unit Tests** - Individual function testing
- **Hook Tests** - React Hook testing with renderHook
- **Integration Tests** - Service layer interaction testing
- **Error Scenario Tests** - Edge cases and failure handling

### Mock Management:
- Supabase client mocking
- React Router navigation mocking  
- Toast notification mocking
- Audio API mocking
- Redux store mocking

## Success Metrics

### Coverage Targets:
- **useRecordingSession**: 80%+ coverage
- **useSubmissionManager**: 80%+ coverage  
- **Score Utils**: 100% coverage
- **Service Functions**: 75%+ coverage
- **Redux Thunks**: 70%+ coverage

### Quality Gates:
- All tests must pass
- No console errors during test runs
- Proper error handling coverage
- Mock validation for external dependencies
- Performance testing for complex hooks

## Implementation Timeline

### Week 1 (Days 1-7):
- Day 1-2: Score calculation utilities tests
- Day 3-5: useRecordingSession hook tests
- Day 6-7: useSubmissionManager hook tests

### Week 2 (Days 8-14):
- Day 8-10: Audio upload service tests
- Day 11-12: Assignment service tests  
- Day 13-14: Submission service tests

### Week 3 (Days 15-21):
- Day 15-17: Redux thunk tests
- Day 18-19: UI state management tests
- Day 20-21: Integration test refinement and documentation

## Risk Mitigation

### High-Risk Areas:
1. **Complex State Management** - Multiple useEffect dependencies
2. **Async Operations** - Background uploads and database operations
3. **External Dependencies** - Supabase API integration
4. **File Handling** - Audio blob processing and URL management

### Mitigation Strategies:
- Comprehensive mocking of external services
- Timeout handling for async operations
- Error boundary testing
- Resource cleanup validation 