-- Migration: Add profile completion tracking fields
-- This migration adds essential fields for the new auth flow

-- Add essential tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Mark existing users as complete based on current data
UPDATE users SET profile_complete = TRUE 
WHERE email_verified = TRUE 
  AND role IS NOT NULL 
  AND agreed_to_terms = TRUE
  AND (role = 'teacher' OR (phone_number IS NOT NULL AND date_of_birth IS NOT NULL));

-- Update auth_provider for existing users
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

-- Add index for performance on profile completion checks
CREATE INDEX IF NOT EXISTS idx_users_profile_complete ON users(profile_complete);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider); 