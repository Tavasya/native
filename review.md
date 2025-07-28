# Review Assignment Feature Implementation Plan

## Overview
The feature will add a teacher review workflow where students can't see their report until a teacher reviews and finalizes it. The system will need to track the review status and modify the UI accordingly.

## Current Status
- Current submission statuses: `'in_progress' | 'pending' | 'graded' | 'rejected'`
- Backend API automatically changes status from pending to graded after analysis
- Students can currently see their feedback immediately after submission
- Teachers can review submissions but there's no formal review workflow

## Required Changes

### 1. Database Changes
- Add new submission status: `'awaiting_review'` to `SubmissionStatus` type in `src/features/submissions/types.ts`

### 2. Backend Changes
- Update Types (`src/features/submissions/types.ts`)
  - Update `SubmissionStatus` type to include `awaiting_review`
  - Add review-related types for API responses
  - Update section feedback interface to include review status

### 3. Backend API Changes
- Modify the analysis completion endpoint to:
  - Set status to `awaiting_review` after analysis
  - Set status to `graded` after teacher finalizes
ntend Changes

#### Teacher Side (`src/components/teacher/ClassDetail.tsx`)
- Modify the submission status display:
  - Change "Review" button to "Grade" when status is `'awaiting_review'`
  - Add visual indicator for submissions awaiting review
- Create new teacher review page (`src/pages/teacher/SubmissionReview.tsx`):
  - Show student's submission
  - Allow editing of section feedback and grades
  - Add finalization button
  - Show warning if trying to leave without finalizing

#### Student Side (`src/pages/student/SubmissionFeedback.tsx`)
- Add review status check:
  - Show "Analysis finished. Awaiting teacher's finalization" message when status is `'awaiting_review'`
  - Hide detailed feedback until status is `'graded'`
  - Add visual indicator for review status
- Update submission status flow:
  - Handle new `awaiting_review` status
  - Only show full feedback after teacher finalizes

### 5. Redux Changes
- Update Submissions Slice (`src/features/submissions/submissionsSlice.ts`)
  - Add new actions:
    - `finalizeReview`
    - `updateReviewStatus`
  - Update state to include review-related fields

### 6. API Service Changes (`src/features/submissions/submissionsService.ts`)
- Add new methods:
  - `finalizeReview`
  - `updateReviewStatus`
- Update existing methods to handle new status

## Implementation Steps

### Backend API Updates
1. Modify analysis completion endpoint
2. Add new review-related endpoints
3. Update status transition logic

### Database Migration
1. Add new status to enum
2. Add new columns to submissions table

### Backend Implementation
1. Update types and interfaces
2. Add new API endpoints for review workflow
3. Update existing endpoints to handle new status
4. Implement review workflow logic

### Teacher Interface
1. Create new review page
2. Update class detail view
3. Add review workflow UI elements

### Student Interface
1. Update submission feedback page
2. Add review status indicators
3. Implement conditional rendering based on review status

### Testing
1. Test review workflow
2. Test status transitions
3. Test UI updates
4. Test permission checks
5. Test API status changes

## UI/UX Considerations

### Teacher View
- Clear indication of submissions needing review
- Easy access to review interface
- Ability to save review progress
- Clear finalization process

### Student View
- Clear status indication
- Professional waiting message
- Smooth transition when feedback becomes available

## Security Considerations
- Ensure only teachers can finalize reviews
- Validate review status transitions
- Protect review data
- Add appropriate permission checks
- Validate API status changes

## Future Enhancements
- Review history tracking
- Review deadlines
- Review notifications
- Review templates
- Review statistics
- Configurable review requirements per assignment

This implementation plan provides a comprehensive approach to adding the review assignment feature while maintaining the existing functionality and ensuring a smooth user experience for both teachers and students. The plan now includes the necessary backend API changes to handle the status transitions and review requirements. 