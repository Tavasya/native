-- 1. Total submissions count
SELECT COUNT(*) as total_submissions FROM submissions;

-- 2. Breakdown by status
SELECT status, COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY count DESC;

-- 3. Count of graded submissions only
SELECT COUNT(*) as graded_count
FROM submissions
WHERE status = 'graded';

-- 4. Count by submitted_at null/not null
SELECT 
    CASE 
        WHEN submitted_at IS NULL THEN 'null_submitted_at'
        ELSE 'has_submitted_at'
    END as submitted_status,
    COUNT(*) as count
FROM submissions
GROUP BY submitted_status;

-- 5. Target statuses (what shows in trends)
SELECT COUNT(*) as trends_total
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending', 'rejected')
  AND submitted_at IS NOT NULL;

-- 6. Breakdown of target statuses
SELECT status, COUNT(*) as count
FROM submissions
WHERE status IN ('graded', 'awaiting_review', 'pending', 'rejected')
  AND submitted_at IS NOT NULL
GROUP BY status;

-- 7. What statuses are being excluded
SELECT status, COUNT(*) as count
FROM submissions
WHERE status NOT IN ('graded', 'awaiting_review', 'pending', 'rejected')
GROUP BY status
ORDER BY count DESC;

-- 8. Status vs submitted_at analysis
SELECT 
    status,
    COUNT(*) as total,
    SUM(CASE WHEN submitted_at IS NOT NULL THEN 1 ELSE 0 END) as with_date,
    SUM(CASE WHEN submitted_at IS NULL THEN 1 ELSE 0 END) as no_date
FROM submissions
GROUP BY status
ORDER BY total DESC;