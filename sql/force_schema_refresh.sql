-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Alternative method: restart PostgREST by updating a table comment
COMMENT ON TABLE support_tickets IS 'Support tickets table - updated to refresh schema cache';

-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND column_name IN ('current_page', 'screenshot_url');