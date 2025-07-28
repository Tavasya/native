# Native Platform Testing Strategy

## Overview
This document outlines the critical testing strategy for Native, an AI-powered speaking assessment platform. Based on code analysis, these are the most crucial areas requiring comprehensive testing.

## 1. Critical Integration Testing Priorities

### **Audio Recording → Upload → Analysis Pipeline** (Highest Priority)

**Why Critical:** This is the core revenue-generating workflow. Failures here directly impact user experience and business value.

**Test Coverage:**
- `tests/integration/audio-recording-pipeline.test.tsx`

**Key Integration Points:**
1. **Recording → Validation → Storage**
   - `useAudioRecording` hook integration with MediaRecorder API
   - WebM validation using `validateAudioBlob`
   - Local blob storage and URL generation
   - Error handling for invalid recordings, permissions, short recordings

2. **Upload → Cloud Storage → URL Generation** 
   - `uploadAudioToStorage` integration with Supabase storage
   - File path generation and collision prevention
   - Authentication verification during upload
   - Public URL generation and accessibility

3. **Complete Session → Submission → Analysis**
   - Multi-question recording sessions using `useRecordingSession`
   - Background upload tracking and error recovery
   - Submission preparation with `prepareRecordingsForSubmission`
   - Analysis service integration via `submissionService.analyzeAudio`

**Critical Error Scenarios:**
- Microphone permission denied
- Network interruption during upload
- Storage quota exceeded
- Corrupted audio files
- Analysis service unavailable

### **Authentication → Role-Based Access** (Second Priority)

**Why Critical:** Proper authentication is essential for data security and user experience in an educational platform.

**Test Coverage:**
- `tests/integration/auth-flow.test.tsx`

**Key Integration Points:**
1. **Signup → Email Verification → Dashboard**
   - User registration with role selection (student/teacher)
   - Email verification flow with OTP
   - Profile creation in database
   - Role-based dashboard routing

2. **Login → Role Verification → Access Control**
   - Credential validation
   - Role matching and verification
   - Session establishment
   - Route protection based on role

3. **Session Persistence → State Management**
   - Session restoration on app load
   - Auth state synchronization across components
   - Logout and session cleanup

## 2. Unit Testing Targets

### **Business Logic Functions** (Focus Areas)
- `validateAudioBlob` - Audio file validation
- `prepareRecordingsForSubmission` - Data transformation
- Score calculation utilities (`calculateOverallPronunciationScore`)
- Authentication thunks (`signUpWithEmail`, `signInWithEmail`)

### **Current Unit Tests:**
- ✅ Timer functionality (`useQuestionTimer`, `QuestionTimer`)
- ✅ Utility functions
- ✅ Loading components

### **Gaps to Fill:**
- Audio validation functions
- Redux state management
- Submission data preparation
- Score calculation logic

## 3. End-to-End Testing Priorities

### **Student Journey** (Critical Path)
1. Sign up as student
2. Join class with teacher code
3. Take assignment with multiple questions
4. Record responses for each question
5. Submit assignment
6. View AI-generated feedback

### **Teacher Journey** (Critical Path)
1. Sign up as teacher
2. Create assignment with questions
3. Generate class join code
4. Monitor student submissions
5. Review AI feedback and scores
6. Export results

### **Current E2E Tests:**
- ✅ Submission feedback display (`submission-feedback.spec.ts`)

## 4. Running Tests

### **Integration Tests**
```bash
# Run all integration tests
npm test -- tests/integration/

# Run specific integration test suites
npm test -- tests/integration/audio-recording-pipeline.test.tsx
npm test -- tests/integration/auth-flow.test.tsx

# Run with coverage
npm run test:coverage -- tests/integration/
```

### **Unit Tests**
```bash
# Run all unit tests
npm test -- tests/unit/

# Run specific unit tests
npm test -- tests/unit/useQuestionTimer.test.ts
npm test -- tests/unit/utils.test.ts
```

### **E2E Tests**
```bash
# Run Playwright E2E tests
npx playwright test

# Run with UI
npx playwright test --headed

# Run specific test
npx playwright test tests/playwright/submission-feedback.spec.ts
```

## 5. Test Implementation Status

### ✅ Completed
- Timer integration testing (comprehensive)
- Basic unit tests for utilities and components
- E2E test for submission feedback

### 🚧 In Progress  
- Audio recording pipeline integration tests (implemented)
- Authentication flow integration tests (implemented)

### ❌ High Priority Gaps
- Assignment workflow integration tests
- Teacher dashboard E2E tests
- Submission analysis integration tests
- Error recovery and resilience testing

## 6. Key Testing Principles

### **Integration Over Isolation**
Given the complex cross-component workflows, integration tests provide more value than isolated unit tests for this application.

### **Error-First Testing**
Test error scenarios extensively since audio recording and upload are prone to failures:
- Network issues
- Permission problems  
- File corruption
- Service unavailability

### **Real Browser Conditions**
Use actual MediaRecorder API and browser storage in E2E tests to catch browser-specific issues.

### **Mock External Services**
Mock Supabase, Google Cloud services, and AI analysis APIs in integration tests for reliability and speed.

## 7. Coverage Goals

### **Current Coverage** (Based on existing tests)
- Audio pipeline: ~30% (timer components only)
- Authentication: ~40% (basic login/signup)
- Assignment workflow: ~10% (minimal coverage)

### **Target Coverage**
- Audio pipeline: 80%+ (critical business logic)
- Authentication: 90%+ (security-critical)
- Assignment workflow: 70%+ (user-facing features)

## 8. Test Maintenance

### **Mock Management**
- Keep mocks in sync with real API responses
- Regular validation against staging environment
- Document mock scenarios clearly

### **Test Data**
- Use consistent test user accounts
- Clean up test recordings after tests
- Maintain test assignment templates

### **CI/CD Integration**
- Run integration tests on pull requests
- E2E tests on staging deployments
- Coverage reporting and gates

## 9. Next Steps

1. **Immediate (Week 1)**
   - Fix and complete audio pipeline integration tests
   - Add assignment workflow integration tests

2. **Short-term (Month 1)**
   - Comprehensive E2E test suite
   - Error recovery testing
   - Performance testing for large audio files

3. **Medium-term (Quarter 1)**
   - Load testing for concurrent uploads
   - Cross-browser compatibility testing
   - Mobile device testing

## 10. Risk Assessment

### **High Risk Areas**
- Audio recording/upload failures
- Authentication security vulnerabilities  
- Data loss during submission
- AI analysis service dependencies

### **Medium Risk Areas**
- Timer functionality accuracy
- Role-based access control
- File storage limits
- Cross-browser compatibility

### **Low Risk Areas**
- UI component rendering
- Static content display
- Basic navigation flows

This testing strategy prioritizes the areas with highest business impact and user experience risk, ensuring robust coverage of Native's core audio assessment functionality. 