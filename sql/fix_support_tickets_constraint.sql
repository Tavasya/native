-- Update the category constraint to include feature_request
ALTER TABLE support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_category_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_category_check 
CHECK (category IN ('bug_report', 'feedback', 'feature_request'));