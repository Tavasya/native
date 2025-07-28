-- 1. Total submissions count
SELECT COUNT(*) as total_submissions FROM submissions;

-- 2. Show all valid statuses in the enum
SELECT enum_range(NULL::submission_status);

-- 3. Breakdown by status
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY count DESC;

-- 4. Count of graded submissions only
SELECT COUNT(*) as graded_count
FROM submissions
WHERE status = 'graded';

-- 5. Count by submitted_at null/not null
SELECT 
    CASE 
        WHEN submitted_at IS NULL THEN 'null_submitted_at'
        ELSE 'has_submitted_at'
    END as submitted_status,
    COUNT(*) as count
FROM submissions
GROUP BY submitted_status;

-- 6. Target statuses (what SHOULD show in trends - without rejected)
SELECT COUNT(*) as trends_total
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending')
  AND submitted_at IS NOT NULL;

-- 7. Breakdown of target statuses (without rejected)
SELECT status, COUNT(*) as count
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending')
  AND submitted_at IS NOT NULL
GROUP BY status;

-- 8. What statuses are being excluded
SELECT status, COUNT(*) as count
FROM submissions
WHERE status NOT IN ('graded', 'awaiting_review', 'pending')
GROUP BY status
ORDER BY count DESC;

-- 9. Complete status vs submitted_at analysis
SELECT 
    status,
    COUNT(*) as total,
    SUM(CASE WHEN submitted_at IS NOT NULL THEN 1 ELSE 0 END) as with_date,
    SUM(CASE WHEN submitted_at IS NULL THEN 1 ELSE 0 END) as no_date
FROM submissions
GROUP BY status
ORDER BY total DESC;