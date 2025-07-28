-- Total submissions count
SELECT COUNT(*) as total_submissions 
FROM submissions;

-- Breakdown by status
SELECT 
    status, 
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric * 100.0 / (SELECT COUNT(*) FROM submissions), 2) as percentage
FROM submissions
GROUP BY status
ORDER BY count DESC;

-- Count of graded submissions
SELECT COUNT(*) as graded_submissions
FROM submissions
WHERE status = 'graded';

-- Submissions with non-null submitted_at
SELECT 
    COUNT(*) as total_with_submitted_at
FROM submissions
WHERE submitted_at IS NOT NULL;

-- Submissions by status with submitted_at breakdown
SELECT 
    status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as with_submitted_at,
    COUNT(CASE WHEN submitted_at IS NULL THEN 1 END) as null_submitted_at
FROM submissions
GROUP BY status
ORDER BY total_count DESC;

-- Target statuses for submission trends
SELECT 
    COUNT(*) as submission_trends_count
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending', 'rejected')
AND submitted_at IS NOT NULL;

-- Breakdown of target statuses
SELECT 
    status,
    COUNT(*) as count
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending', 'rejected')
AND submitted_at IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- Sample of submissions with different statuses
SELECT 
    id,
    status,
    submitted_at,
    created_at,
    assignment_id,
    student_id
FROM submissions
WHERE status NOT IN ('graded', 'awaiting_review', 'pending', 'rejected')
LIMIT 20;

-- Submissions created in last 30 days by status
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as submitted_count
FROM submissions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status
ORDER BY count DESC;