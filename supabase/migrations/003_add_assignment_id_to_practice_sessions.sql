-- Add assignment_id column to practice_sessions table to track which assignment the practice was done from
ALTER TABLE practice_sessions
ADD COLUMN assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL;

-- Add index for better query performance when filtering by assignment
CREATE INDEX idx_practice_sessions_assignment_id ON practice_sessions(assignment_id);

-- Add comments to document the purpose
COMMENT ON COLUMN practice_sessions.assignment_id IS 'ID of the assignment this practice session was created from. NULL for general practice sessions not tied to a specific assignment.'; 