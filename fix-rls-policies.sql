-- Fix RLS policies for curriculum system

-- Drop existing policies to recreate them
drop policy if exists "Users can view their curriculum assignments" on public.curriculum_assignments;
drop policy if exists "Users can update their curriculum assignments" on public.curriculum_assignments;
drop policy if exists "Users can insert their own curricula" on public.personalized_curricula;

-- Recreate policies with proper permissions

-- Allow users to insert their own curricula
create policy "Users can insert their own curricula" 
  on public.personalized_curricula for insert 
  with check (auth.uid() = user_id);

-- Allow users to update their own curricula  
create policy "Users can update their own curricula"
  on public.personalized_curricula for update
  using (auth.uid() = user_id);

-- Allow users to view their curriculum assignments
create policy "Users can view their curriculum assignments" 
  on public.curriculum_assignments for select
  using (
    curriculum_id in (
      select id from public.personalized_curricula where user_id = auth.uid()
    )
  );

-- Allow users to insert curriculum assignments for their own curricula
create policy "Users can insert their curriculum assignments"
  on public.curriculum_assignments for insert
  with check (
    curriculum_id in (
      select id from public.personalized_curricula where user_id = auth.uid()
    )
  );

-- Allow users to update their curriculum assignments (for completion tracking)
create policy "Users can update their curriculum assignments" 
  on public.curriculum_assignments for update
  using (
    curriculum_id in (
      select id from public.personalized_curricula where user_id = auth.uid()
    )
  );

-- Make sure practice_onboarding has proper policies
drop policy if exists "Users can manage their own onboarding metrics" on public.practice_onboarding;

create policy "Users can view their own onboarding metrics"
  on public.practice_onboarding for select
  using (auth.uid() = user_id);

create policy "Users can insert their own onboarding metrics"
  on public.practice_onboarding for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own onboarding metrics"
  on public.practice_onboarding for update
  using (auth.uid() = user_id);