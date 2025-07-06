-- Simple onboarding metrics table
create table public.practice_onboarding (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  target_score text not null,
  study_time text not null,
  test_timeline text not null,
  current_score text not null,
  assessed_level text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.practice_onboarding enable row level security;

-- RLS Policies
create policy "Users can manage their own onboarding metrics"
  on public.practice_onboarding for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function to assess level
create or replace function assess_user_level(
  target_score text,
  current_score text,
  study_time text,
  timeline text
) returns text as $$
begin
  if current_score in ('7.5+', '6.5-7.0') or 
     (target_score in ('8.0', '8.5+') and study_time in ('15', '30')) then
    return 'ADVANCED';
  end if;
  
  if current_score in ('4.0-5.0', 'not-sure') or 
     (study_time = '5' and timeline = '1-month') then
    return 'BEGINNER';
  end if;
  
  return 'INTERMEDIATE';
end;
$$ language plpgsql;