-- Add current_page column to support_tickets table
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS current_page TEXT;

-- Add screenshot_url column to support_tickets table
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Add feature_request to the category enum
-- First, we need to check the current enum values
-- If the enum doesn't include 'feature_request', we need to add it

-- Step 1: Create a new enum type with all values
CREATE TYPE category_new AS ENUM ('bug_report', 'feedback', 'feature_request');

-- Step 2: Alter the column to use the new enum
ALTER TABLE support_tickets 
ALTER COLUMN category TYPE category_new 
USING category::text::category_new;

-- Step 3: Drop the old enum type
DROP TYPE IF EXISTS category_old;

-- Step 4: Rename the old type to category_old (if it exists)
ALTER TYPE category RENAME TO category_old;

-- Step 5: Rename the new type to category
ALTER TYPE category_new RENAME TO category;

-- Optional: If you want to remove the title column completely (not recommended for existing data)
-- ALTER TABLE support_tickets DROP COLUMN IF EXISTS title;

-- Note: The title column is still used internally but auto-generated based on category
-- So we're keeping it in the database for backward compatibility and data integrity