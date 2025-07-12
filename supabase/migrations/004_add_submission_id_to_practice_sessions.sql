-- Add submission_id column to practice_sessions table to track which submission the practice was created from
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL;

-- Create index for better query performance on submission_id
CREATE INDEX IF NOT EXISTS idx_practice_sessions_submission_id ON practice_sessions(submission_id);

-- Add comment explaining the purpose of the column
COMMENT ON COLUMN practice_sessions.submission_id IS 'ID of the submission this practice session was created from. NULL for practice sessions not tied to a specific submission.'; 