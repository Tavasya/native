-- Migration: Add streaks and word save features
-- Created: 2025-01-06

-- Table for tracking user learning streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streak_type VARCHAR(50) NOT NULL CHECK (streak_type IN ('daily_practice', 'weekly_goals', 'pronunciation', 'conversation')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  total_activities INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one streak record per user per type
  UNIQUE(user_id, streak_type)
);

-- Table for logging user activities that contribute to streaks
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('assignment_completed', 'practice_session', 'pronunciation_practice', 'conversation_completed')),
  activity_date DATE NOT NULL,
  activity_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate activities on the same day for the same type
  UNIQUE(user_id, activity_type, activity_date)
);

-- Table for users' saved vocabulary words
CREATE TABLE IF NOT EXISTS public.saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word VARCHAR(255) NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  pronunciation VARCHAR(500),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  word_type VARCHAR(50),
  source_context JSONB DEFAULT '{}',
  is_mastered BOOLEAN DEFAULT FALSE,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate words per user
  UNIQUE(user_id, word)
);

-- Table for tracking word review sessions and spaced repetition
CREATE TABLE IF NOT EXISTS public.word_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  saved_word_id UUID REFERENCES public.saved_words(id) ON DELETE CASCADE NOT NULL,
  review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('recognition', 'recall', 'pronunciation', 'usage')),
  success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
  next_review_date DATE,
  review_interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking user achievements and milestones
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criteria_met JSONB DEFAULT '{}',
  
  -- Prevent duplicate achievements per user
  UNIQUE(user_id, achievement_type, achievement_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON public.user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_date ON public.user_activity_log(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_saved_words_user_id ON public.saved_words(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_words_mastered ON public.saved_words(user_id, is_mastered);
CREATE INDEX IF NOT EXISTS idx_word_review_next_date ON public.word_review_sessions(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Row Level Security policies
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for user_streaks
CREATE POLICY "Users can manage their own streaks" ON public.user_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for user_activity_log
CREATE POLICY "Users can manage their own activity log" ON public.user_activity_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for saved_words
CREATE POLICY "Users can manage their own saved words" ON public.saved_words
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for word_review_sessions
CREATE POLICY "Users can manage their own word reviews" ON public.word_review_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update streak when user completes activity
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_activity_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_streak_type VARCHAR(50);
  v_current_streak INTEGER;
  v_last_activity_date DATE;
  v_streak_start_date DATE;
BEGIN
  -- Map activity type to streak type
  v_streak_type := CASE 
    WHEN p_activity_type IN ('assignment_completed', 'practice_session') THEN 'daily_practice'
    WHEN p_activity_type = 'conversation_completed' THEN 'conversation'
    WHEN p_activity_type = 'pronunciation_practice' THEN 'pronunciation'
    ELSE 'daily_practice'
  END;

  -- Get current streak data
  SELECT current_streak, last_activity_date, streak_start_date
  INTO v_current_streak, v_last_activity_date, v_streak_start_date
  FROM user_streaks 
  WHERE user_id = p_user_id AND streak_type = v_streak_type;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date, total_activities)
    VALUES (p_user_id, v_streak_type, 1, 1, p_activity_date, p_activity_date, 1);
    RETURN;
  END IF;

  -- Check if this is a consecutive day
  IF v_last_activity_date IS NULL OR p_activity_date = v_last_activity_date + INTERVAL '1 day' THEN
    -- Continue or start streak
    v_current_streak := v_current_streak + 1;
    IF v_streak_start_date IS NULL THEN
      v_streak_start_date := p_activity_date;
    END IF;
  ELSIF p_activity_date > v_last_activity_date + INTERVAL '1 day' THEN
    -- Streak broken, restart
    v_current_streak := 1;
    v_streak_start_date := p_activity_date;
  ELSE
    -- Same day or past date, just update activity count
    NULL;
  END IF;

  -- Update streak record
  UPDATE user_streaks 
  SET 
    current_streak = v_current_streak,
    longest_streak = GREATEST(longest_streak, v_current_streak),
    last_activity_date = p_activity_date,
    streak_start_date = v_streak_start_date,
    total_activities = total_activities + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id AND streak_type = v_streak_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity and update streak
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_activity_data JSONB DEFAULT '{}',
  p_points_earned INTEGER DEFAULT 10
) RETURNS VOID AS $$
BEGIN
  -- Insert activity log (ON CONFLICT DO NOTHING to prevent duplicates)
  INSERT INTO user_activity_log (user_id, activity_type, activity_date, activity_data, points_earned)
  VALUES (p_user_id, p_activity_type, CURRENT_DATE, p_activity_data, p_points_earned)
  ON CONFLICT (user_id, activity_type, activity_date) DO NOTHING;

  -- Update streak
  PERFORM update_user_streak(p_user_id, p_activity_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;