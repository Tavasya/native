-- Check if there are any RLS policies on submissions table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'submissions';

-- Check if submissions is a view
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'submissions'
AND table_schema = 'public';

-- Direct count from submissions table
SELECT COUNT(*) as direct_count FROM public.submissions;

-- Count with same conditions as the app
SELECT COUNT(*) as app_conditions_count
FROM public.submissions
WHERE status IN ('graded', 'awaiting_review', 'pending')
AND submitted_at IS NOT NULL;

-- Check if there's a different schema or view
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE viewname LIKE '%submission%';

-- Check current user and permissions
SELECT current_user, session_user;

-- Test the exact query structure used in the app
SELECT COUNT(*) as test_count
FROM submissions s
LEFT JOIN assignments a ON s.assignment_id = a.id
LEFT JOIN users u ON s.student_id = u.id
WHERE s.status IN ('graded', 'awaiting_review', 'pending')
AND s.submitted_at IS NOT NULL;