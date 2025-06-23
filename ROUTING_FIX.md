# Routing Fix for Redo Assignment Navigation

## Issue Identified
The "Redo Assignment" buttons were navigating to the wrong route, causing errors when trying to fetch submission data.

## Root Cause
There are two different practice-related routes in the application:

1. **`/student/practice/:submissionId`** → `Practice` component (for transcript improvement from existing submissions)
2. **`/student/assignment/:id/practice`** → `AssignmentPractice` component (for assignment practice/recording)

The redo buttons were incorrectly navigating to route #1 when they should go to route #2.

## Routes Overview

### `/student/practice/:submissionId` - Practice Component
- **Purpose**: Transcript improvement and pronunciation practice
- **Expected param**: Submission ID (UUID of existing submission)
- **Use case**: Student wants to practice pronunciation using their previous submission transcript

### `/student/assignment/:id/practice` - AssignmentPractice Component  
- **Purpose**: Assignment practice and recording
- **Expected param**: Assignment ID (UUID of assignment)
- **Use case**: Student wants to practice/record answers for an assignment

## Fix Applied

Updated all redo navigation calls from:
```typescript
// ❌ WRONG - goes to transcript practice
navigate(`/student/practice/${assignmentId}`);
```

To:
```typescript
// ✅ CORRECT - goes to assignment practice  
navigate(`/student/assignment/${assignmentId}/practice`);
```

## Files Updated

1. **`PendingSubmission.tsx`** - Fixed redo button navigation
2. **`SubmissionFeedback.tsx`** - Fixed redo button navigation  
3. **`SubmissionResults.tsx`** - Fixed retry button navigation
4. **`Practice.tsx`** - Enhanced error handling for missing submissions

## Error Resolution

The original error:
```
GET .../submissions?select=*&id=eq.8d0bcf7b-49d5-45a1-8290-22264a05e9e2&student_id=eq.95da30f5-82cb-445d-bd68-cb84f1e48aef 406 (Not Acceptable)
Error: JSON object requested, multiple (or no) rows returned
```

Was caused because:
1. User clicked "Redo Assignment" 
2. Navigation went to `/student/practice/{assignmentId}` (wrong route)
3. Practice component tried to fetch submission by ID, but was given an assignment ID
4. Query failed because assignment ID ≠ submission ID

## Result
✅ Redo buttons now correctly navigate to assignment practice page  
✅ Users can properly start new recording sessions  
✅ No more routing conflicts or data fetching errors  
✅ Proper separation of transcript practice vs assignment practice flows