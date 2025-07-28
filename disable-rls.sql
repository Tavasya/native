-- Disable RLS entirely on curriculum tables to test
ALTER TABLE public.personalized_curricula DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_onboarding DISABLE ROW LEVEL SECURITY;

-- Grant select permissions to authenticated users
GRANT SELECT ON public.personalized_curricula TO authenticated;
GRANT SELECT ON public.curriculum_assignments TO authenticated;
GRANT SELECT ON public.practice_assignments TO authenticated;
GRANT SELECT ON public.practice_onboarding TO authenticated;