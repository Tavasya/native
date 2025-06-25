# Master Plan: Assignment Builder Feature

## Overview
Implement a new "Builder" button next to the "Create Assignment" button on the teacher dashboard. The builder will allow teachers to create assignments by selecting and combining pre-defined parts from a database, rather than creating questions from scratch.

## Current State Analysis
- **Location**: Teacher dashboard (`/teacher/dashboard`) → Class detail page (`/class/:id`) → "Create Assignment" button
- **Current Flow**: Teachers create assignments by adding individual questions with drag-and-drop functionality
- **Question Types**: Currently supports "Part 1 or Part 3" (normal) and "Part 2" (bulletPoints) question styles
- **Database**: Uses Supabase with assignments table storing questions as JSON

## Feature Requirements

### Core Functionality
1. **Builder Button**: Add a "Builder" button next to "Create Assignment" on class detail page
2. **Part-Based Structure**: 
   - Part 1: Standalone questions (current "normal" type)
   - Part 2 & 3: Combined questions (Part 2 = bulletPoints, Part 3 = normal)
3. **Database of Parts**: Store reusable parts that teachers can select from
4. **Flexible Assembly**: Allow adding multiple blocks of Part 1 or Part 2&3 combinations

### Part Categories
- **Part 1 Blocks**: Individual standalone questions by topic
- **Part 2 & 3 Blocks**: Related question pairs (Part 2 + Part 3) by topic
- **Topic Organization**: Parts organized by subject/topic areas

## Implementation Plan

### Phase 1: Database Schema & Backend (Week 1)

#### 1.1 Database Schema Updates
```sql
-- New table for storing reusable parts
CREATE TABLE assignment_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  part_type VARCHAR(50) NOT NULL, -- 'part1', 'part2_3', 'part2_only', 'part3_only'
  topic VARCHAR(100),
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  questions JSONB NOT NULL, -- Array of QuestionCard objects
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for part combinations (Part 2 & 3)
CREATE TABLE part_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  part2_id UUID REFERENCES assignment_parts(id),
  part3_id UUID REFERENCES assignment_parts(id),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assignment_parts_topic ON assignment_parts(topic);
CREATE INDEX idx_assignment_parts_type ON assignment_parts(part_type);
CREATE INDEX idx_assignment_parts_public ON assignment_parts(is_public);
```

#### 1.2 Backend Services
- **Assignment Parts Service**: CRUD operations for parts
- **Part Combinations Service**: Manage Part 2 & 3 combinations
- **Part Selection Service**: Search and filter parts by topic/type

### Phase 2: Frontend Components (Week 2)

#### 2.1 New Pages & Routes
```
/class/:id/builder → AssignmentBuilderPage
/teacher/parts → PartsLibraryPage (optional admin interface)
```

#### 2.2 Core Components
- **AssignmentBuilderPage**: Main builder interface
- **PartSelector**: Component for browsing and selecting parts
- **PartPreview**: Preview selected parts before adding
- **BuilderHeader**: Similar to CreateAssignmentPage header
- **PartBlock**: Individual part display in builder
- **TopicFilter**: Filter parts by topic/difficulty

#### 2.3 UI/UX Design
- **Header Card**: Same design as CreateAssignmentPage
- **Part Selection Area**: Grid/list view of available parts
- **Builder Canvas**: Drag-and-drop area for assembled parts
- **Preview Mode**: Real-time preview of final assignment

### Phase 3: Builder Interface (Week 3)

#### 3.1 Builder Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header Card (Title, Due Date, Settings)                │
├─────────────────────────────────────────────────────────┤
│ Part Selection Panel (Left) │ Builder Canvas (Right)   │
│ ┌─────────────────────────┐ │ ┌───────────────────────┐ │
│ │ Topic Filter            │ │ │ Part 1 Block          │ │
│ │ Part 1 Options          │ │ │ Part 2 & 3 Block      │ │
│ │ Part 2 & 3 Options      │ │ │ Part 1 Block          │ │
│ │                         │ │ │ [Add Part Button]     │ │
│ └─────────────────────────┘ │ └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 Part Selection Flow
1. **Topic Selection**: Choose topic (e.g., "Travel", "Education", "Technology")
2. **Part Type Filter**: Filter by Part 1, Part 2 & 3, or both
3. **Part Preview**: Hover/click to preview part content
4. **Add to Builder**: Click to add part to assignment
5. **Reorder**: Drag-and-drop to reorder parts in builder

#### 3.3 Builder Features
- **Real-time Preview**: See how parts will appear in final assignment
- **Part Removal**: Remove parts from builder
- **Part Duplication**: Add same part multiple times
- **Validation**: Ensure assignment has required parts
- **Save as Template**: Save builder configuration as template

### Phase 4: Integration & Polish (Week 4)

#### 4.1 Integration Points
- **Navigation**: Add Builder button to ClassDetail component
- **Routing**: Add builder routes to main router
- **State Management**: Integrate with existing Redux store
- **API Integration**: Connect to new backend services

#### 4.2 Data Flow
```
Teacher Dashboard → Class Detail → Builder Button → AssignmentBuilderPage
                                                      ↓
Part Selection → Part Preview → Add to Builder → Final Assignment
                                                      ↓
Publish Assignment → Create Assignment → Redirect to Class Detail
```

#### 4.3 Error Handling & Validation
- **Part Validation**: Ensure selected parts are valid
- **Assignment Validation**: Minimum/maximum part requirements
- **Error Recovery**: Graceful handling of API failures
- **Loading States**: Proper loading indicators

## Technical Implementation Details

### File Structure
```
src/
├── pages/teacher/
│   ├── AssignmentBuilderPage.tsx (new)
│   └── PartsLibraryPage.tsx (optional)
├── components/teacher/
│   ├── AssignmentBuilder/
│   │   ├── index.tsx
│   │   ├── PartSelector.tsx
│   │   ├── PartPreview.tsx
│   │   ├── BuilderCanvas.tsx
│   │   └── TopicFilter.tsx
│   └── ClassDetail.tsx (modified)
├── features/
│   ├── assignmentParts/
│   │   ├── assignmentPartsSlice.ts
│   │   ├── assignmentPartsThunks.ts
│   │   ├── assignmentPartsService.ts
│   │   └── types.ts
│   └── partCombinations/
│       ├── partCombinationsSlice.ts
│       ├── partCombinationsThunks.ts
│       ├── partCombinationsService.ts
│       └── types.ts
└── routes/
    └── index.tsx (modified)
```

### Key Components Breakdown

#### AssignmentBuilderPage
- Similar structure to CreateAssignmentPage
- Header card with title, due date, settings
- Two-panel layout: part selection + builder canvas
- Preview and publish functionality

#### PartSelector
- Topic-based filtering
- Part type filtering (Part 1, Part 2 & 3)
- Search functionality
- Part preview on hover/click
- Add to builder functionality

#### BuilderCanvas
- Drag-and-drop reordering
- Part removal
- Visual representation of final assignment
- Real-time preview updates

### Database Operations

#### Part Management
- **Create Part**: Teachers can create custom parts
- **Browse Parts**: Public parts + teacher's private parts
- **Part Usage Tracking**: Track how often parts are used
- **Part Rating**: Optional rating system for parts

#### Assignment Creation
- **Part Assembly**: Combine selected parts into assignment
- **Question Flattening**: Convert parts to question array
- **Metadata Preservation**: Maintain part information in assignment metadata

## Migration Strategy

### Phase 1: Backward Compatibility
- Existing assignments continue to work unchanged
- New builder creates assignments in same format
- Gradual migration path for existing content

### Phase 2: Content Migration
- Convert existing assignment templates to parts
- Create default part library
- Migrate popular question patterns to reusable parts

### Phase 3: Feature Enhancement
- Advanced part creation tools
- Part sharing between teachers
- Part marketplace (future consideration)

## Success Metrics

### User Adoption
- Builder usage vs. traditional create assignment
- Time saved in assignment creation
- Teacher satisfaction scores

### Content Quality
- Assignment completion rates
- Student performance improvements
- Part reuse frequency

### Technical Performance
- Builder page load times
- Part selection responsiveness
- Assignment creation success rate

## Risk Mitigation

### Technical Risks
- **Performance**: Large part libraries may impact load times
- **Complexity**: Builder interface may be overwhelming
- **Data Integrity**: Part combinations must be validated

### Mitigation Strategies
- **Pagination**: Load parts in chunks
- **Progressive Disclosure**: Show advanced features gradually
- **Validation**: Comprehensive input validation
- **Testing**: Extensive testing of part combinations

## Future Enhancements

### Advanced Features
- **AI-Powered Suggestions**: Recommend parts based on topic
- **Part Analytics**: Track part effectiveness
- **Collaborative Parts**: Teachers can share and rate parts
- **Custom Part Creation**: Visual part builder interface

### Integration Opportunities
- **Curriculum Alignment**: Parts aligned with educational standards
- **Difficulty Progression**: Parts organized by skill level
- **Multilingual Support**: Parts in multiple languages
- **Accessibility**: Screen reader support for part selection

## Timeline Summary

- **Week 1**: Database schema, backend services
- **Week 2**: Frontend components, basic UI
- **Week 3**: Builder interface, part selection
- **Week 4**: Integration, testing, polish
- **Week 5**: Content migration, user testing
- **Week 6**: Launch preparation, documentation

## Conclusion

The Assignment Builder feature will significantly improve the teacher experience by providing a more efficient and flexible way to create assignments. By leveraging reusable parts and a topic-based organization system, teachers can quickly assemble high-quality assignments while maintaining the flexibility to customize content for their specific needs.

The implementation follows the existing codebase patterns and architecture, ensuring consistency and maintainability. The phased approach allows for iterative development and testing, reducing risk and enabling early feedback from users. 