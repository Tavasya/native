# Luna Practice Curriculum System - Implementation Roadmap

## Overview
Building a personalized IELTS preparation curriculum system that automatically curates learning paths based on user onboarding responses.

## System Components

### 1. Database Schema ✅ COMPLETED
- **`practice_onboarding`** - User onboarding responses and assessed levels
- **`practice_assignments`** - Pool of conversation and pronunciation exercises
- **`personalized_curricula`** - User-specific learning paths  
- **`curriculum_assignments`** - Scheduled assignments for each curriculum

### 2. Data Population ✅ COMPLETED
**Conversation Assignments (21 total):**
- 10 Beginner scenarios (Coffee Corner, Restaurant, Shopping, etc.)
- 6 Intermediate scenarios (Job Interview, University Application, etc.)
- 5 Advanced scenarios (Academic Conference, Legal Consultation, etc.)

**Pronunciation Assignments (20 total):**
- 8 Beginner exercises (Personal info, Daily routine, Family, etc.)
- 6 Intermediate exercises (Work experience, Travel, Cultural differences, etc.)
- 6 Advanced exercises (Philosophy, Economics, Scientific research, etc.)

### 3. Curriculum Curation Algorithm 🚧 IN PROGRESS

#### Core Logic:
```
Timeline Mapping:
├── 1-month    → 15 days frequency (intensive: 3-4 assignments/week)
├── 3-months   → 30 days frequency (focused: 2 assignments/week)
├── 6-months   → 60 days frequency (steady: 1 assignment/week)
└── not-sure   → 90 days frequency (casual: 1 assignment/2 weeks)

Level Progression Paths:
├── BEGINNER   → Start with beginner assignments only
├── INTERMEDIATE → Start with intermediate assignments  
└── ADVANCED   → Start with intermediate + advanced mix

Curriculum Structure (Max 8 weeks):
├── Foundation Phase (Weeks 1-2): Core level assignments
├── Building Phase (Weeks 3-5): Progressive difficulty increase
└── Target Phase (Weeks 6-8): Focus on target score preparation
```

#### Algorithm Steps:
1. **Input Processing**: Extract onboarding data (target score, current level, timeline, study time)
2. **Frequency Calculation**: Map timeline to assignment frequency
3. **Assignment Pool Selection**: Filter assignments by appropriate levels
4. **Weekly Distribution**: Spread assignments across 8 weeks max
5. **Database Population**: Create curriculum and assignment entries

### 4. Redux Integration 🚧 IN PROGRESS
**Roadmap Feature Structure:**
```
src/features/roadmap/
├── roadmapTypes.ts      ✅ - Type definitions
├── roadmapService.ts    ✅ - API service (onboarding complete)
├── roadmapSlice.ts      ✅ - Redux state management  
├── index.ts             ✅ - Exports
└── curriculumService.ts 📋 TODO - Curriculum curation API
```

### 5. Frontend Components 📋 TODO

#### Onboarding Integration ✅ COMPLETED
- **Route**: `/luna/onboarding`
- **Component**: `LunaOnboarding.tsx` with Redux integration
- **Features**: Saves to `practice_onboarding` table with user authentication

#### Curriculum Display Components 📋 TODO
```
src/components/curriculum/
├── CurriculumOverview.tsx   📋 TODO - Learning path summary
├── WeeklySchedule.tsx       📋 TODO - Week-by-week breakdown
├── AssignmentCard.tsx       📋 TODO - Individual assignment display
├── ProgressTracker.tsx      📋 TODO - Completion progress
└── CurriculumDashboard.tsx  📋 TODO - Main curriculum page
```

### 6. Assignment Execution Integration 📋 FUTURE
- Link curriculum assignments to existing conversation practice
- Create pronunciation practice interface
- Track completion and update progress

## Implementation Timeline

### Phase 1: Core Curation ⏳ CURRENT
1. **Curriculum Curation Service** - Build the algorithm
2. **Integration with Onboarding** - Auto-generate on completion
3. **Basic Curriculum Display** - Show generated learning path

### Phase 2: Enhanced Experience 📋 FUTURE  
1. **Advanced UI Components** - Rich curriculum dashboard
2. **Progress Tracking** - Completion analytics and streaks
3. **Assignment Execution** - Direct practice integration

### Phase 3: Optimization 📋 FUTURE
1. **Smart Recommendations** - AI-powered assignment suggestions
2. **Adaptive Learning** - Dynamic difficulty adjustment
3. **Performance Analytics** - Detailed progress insights

## Key Design Decisions

### Frequency Mapping Logic
```javascript
const getFrequencyDays = (timeline) => {
  switch(timeline) {
    case '1-month': return 15;    // Intensive preparation
    case '3-months': return 30;   // Focused improvement  
    case '6-months': return 60;   // Comprehensive training
    case 'not-sure': return 90;   // Flexible timeline
  }
}
```

### Level Progression Strategy
- **Conservative Approach**: Never skip foundational levels
- **Gradual Progression**: 25% foundation → 50% building → 25% target prep
- **Mixed Content**: 70% conversation + 30% pronunciation assignments

### Assignment Duplication Strategy
- **Short-term**: Reuse existing assignments to fill curriculum slots
- **Long-term**: Expand assignment database with more variety
- **Balance**: Ensure mix of conversation types and pronunciation focuses

## Current Status
- ✅ Database schema and data population complete
- ✅ Onboarding flow with Redux integration complete  
- 🚧 Building curriculum curation algorithm
- 📋 Next: Auto-generate curricula on onboarding completion

## Files Modified/Created
- `practice-onboarding.sql` - Basic onboarding table
- `curriculum-full.sql` - Complete schema with 41 assignments
- `src/features/roadmap/` - Complete Redux feature
- `src/pages/luna/LunaOnboarding.tsx` - Enhanced with Redux
- `src/app/store.ts` - Added roadmap reducer
- `src/pages/luna/App.tsx` - Added onboarding route