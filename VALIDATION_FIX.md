# Validation Fix for In-Progress Submissions

## Issue
The "Redo Assignment" functionality was failing with the error:
```
Error: At least one recording is required
```

## Root Cause
The submission validation logic was requiring at least one recording for ALL submissions, including in-progress submissions that haven't recorded anything yet.

## Solution
Enhanced the validation system to support two different validation modes:

### 1. **Updated `validateSubmissionData` Function**
```typescript
const validateSubmissionData = async (data: CreateSubmissionDto, allowEmptyRecordings = false) => {
  // Allow empty recordings for in-progress submissions
  if (!allowEmptyRecordings && (!data.recordings || !Array.isArray(data.recordings) || data.recordings.length === 0)) {
    throw new Error('At least one recording is required');
  }
  
  // Ensure recordings is an array even if empty
  if (!data.recordings || !Array.isArray(data.recordings)) {
    data.recordings = [];
  }
}
```

### 2. **Updated `formatSubmissionData` Function**
```typescript
const formatSubmissionData = async (data: CreateSubmissionDto, allowEmptyRecordings = false) => {
  const formattedData = {
    // ... other fields
    recordings: (data.recordings || []).map(recording => { /* format */ }),
    status: allowEmptyRecordings ? 'in_progress' as const : 'pending' as const,
    submitted_at: allowEmptyRecordings ? null : new Date().toISOString()
  };
}
```

### 3. **Enhanced `createInProgressSubmission` Function**
Now directly creates in-progress submissions without going through the regular submission flow:
- Uses `formatSubmissionData` with `allowEmptyRecordings = true`
- Sets status to 'in_progress' 
- Sets submitted_at to null
- Allows empty recordings array

## Validation Logic

### For Regular Submissions (Final Submit):
- `allowEmptyRecordings = false` (default)
- Requires at least one recording
- Status: 'pending'
- submitted_at: current timestamp

### For In-Progress Submissions (Redo/New Attempt):
- `allowEmptyRecordings = true` 
- Allows empty recordings array
- Status: 'in_progress'
- submitted_at: null

## Result
✅ Users can now successfully click "Redo Assignment" from feedback pages
✅ Creates proper in-progress submissions with empty recordings
✅ Maintains validation for final submissions requiring recordings
✅ Proper attempt number calculation and navigation flow