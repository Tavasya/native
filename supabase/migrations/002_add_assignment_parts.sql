-- Migration: Add assignment parts and combinations tables
-- This migration adds tables for the new assignment builder feature

-- Create assignment_parts table for storing reusable parts
CREATE TABLE IF NOT EXISTS assignment_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  part_type VARCHAR(50) NOT NULL CHECK (part_type IN ('part1', 'part2_3', 'part2_only', 'part3_only')),
  topic VARCHAR(100),
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  questions JSONB NOT NULL, -- Array of QuestionCard objects
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create part_combinations table for Part 2 & 3 combinations
CREATE TABLE IF NOT EXISTS part_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  part2_id UUID REFERENCES assignment_parts(id) ON DELETE CASCADE,
  part3_id UUID REFERENCES assignment_parts(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_parts_topic ON assignment_parts(topic);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_type ON assignment_parts(part_type);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_public ON assignment_parts(is_public);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_created_by ON assignment_parts(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_parts_difficulty ON assignment_parts(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_part_combinations_topic ON part_combinations(topic);
CREATE INDEX IF NOT EXISTS idx_part_combinations_public ON part_combinations(is_public);
CREATE INDEX IF NOT EXISTS idx_part_combinations_created_by ON part_combinations(created_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for assignment_parts updated_at
CREATE TRIGGER update_assignment_parts_updated_at 
    BEFORE UPDATE ON assignment_parts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE assignment_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_combinations ENABLE ROW LEVEL SECURITY;

-- Policies for assignment_parts
CREATE POLICY "Users can view public assignment parts" ON assignment_parts
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own assignment parts" ON assignment_parts
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own assignment parts" ON assignment_parts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own assignment parts" ON assignment_parts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own assignment parts" ON assignment_parts
    FOR DELETE USING (auth.uid() = created_by);

-- Policies for part_combinations
CREATE POLICY "Users can view public part combinations" ON part_combinations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own part combinations" ON part_combinations
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own part combinations" ON part_combinations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own part combinations" ON part_combinations
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own part combinations" ON part_combinations
    FOR DELETE USING (auth.uid() = created_by); 