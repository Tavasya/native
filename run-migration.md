# Database Migration Instructions

To apply the streaks and words features database migration, run:

```bash
# Navigate to your project directory
cd /Users/rexordonez/native-3

# Apply the migration using Supabase CLI
npx supabase db push

# OR if you prefer to run it manually in Supabase dashboard:
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the content from:
#    supabase/migrations/20250106000000_add_streaks_and_words.sql
# 4. Run the query
```

## What this migration adds:

1. **user_streaks** - Track daily practice streaks
2. **user_activity_log** - Log all user activities 
3. **saved_words** - Store user's vocabulary words
4. **word_review_sessions** - Spaced repetition system
5. **user_achievements** - Achievement tracking
6. **Functions** - Automatic streak updates when activities are logged

## Features implemented:

✅ **Streaks System**
- Tracks daily practice streaks
- Automatically updates when assignments are completed
- Calendar view showing orange dots for completed days
- Monthly navigation with < > buttons

✅ **Database Schema for Word Save**
- Ready for vocabulary feature implementation
- Spaced repetition system built-in
- Word difficulty levels and categorization

✅ **Activity Logging**
- Every assignment completion is tracked
- Points system for gamification
- Supports different activity types

## How it works:

1. When a user completes an assignment, `completionService.markAssignmentComplete()` is called
2. This automatically logs the activity via `streakService.logActivity()`
3. The database function `log_user_activity()` handles streak updates
4. The `StreakCalendar` component displays the streak visually
5. Orange circles = completed practice days
6. Gray circles = no practice
7. Blue circle with border = today

The streak counts any assignment completion (conversation or pronunciation) as a daily practice activity.