-- Expand the practice onboarding with curriculum tables
create table if not exists public.practice_assignments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('conversation', 'pronunciation')),
  level text not null check (level in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  description text,
  content jsonb not null, -- scenario data or pronunciation transcript
  estimated_duration integer default 10, -- in minutes
  ielts_focus_areas text[] default array['speaking'], 
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.personalized_curricula (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  target_score text not null,
  current_level text not null,
  frequency_days integer not null, -- 15, 30, 60, 90
  total_weeks integer not null, -- max 8
  total_assignments integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.curriculum_assignments (
  id uuid default gen_random_uuid() primary key,
  curriculum_id uuid references public.personalized_curricula(id) on delete cascade not null,
  assignment_id uuid references public.practice_assignments(id) on delete cascade not null,
  week_number integer not null check (week_number between 1 and 8),
  sequence_order integer not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Insert conversation assignments (from existing scenarios)
insert into public.practice_assignments (title, type, level, description, content) values
-- BEGINNER conversations
('Coffee Corner', 'conversation', 'BEGINNER', 'Practice ordering coffee with guided prompts and suggestions', 
 '{"id": "coffee-corner", "name": "Coffee Corner", "level": "BEGINNER", "description": "Practice ordering coffee with guided prompts and suggestions", "greeting": "Hi! Welcome to Coffee Corner. What can I get for you today?", "instructions": "You are a friendly coffee shop barista. Follow the exact script for guided practice. Guide the customer through ordering coffee step by step.", "turns": 5, "icon": "☕"}'),

('Restaurant Visit', 'conversation', 'BEGINNER', 'Learn to order food and interact with restaurant staff',
 '{"id": "restaurant-visit", "name": "Restaurant Visit", "level": "BEGINNER", "description": "Learn to order food and interact with restaurant staff", "greeting": "Good evening! Welcome to our restaurant. How many people are in your party?", "instructions": "You are a friendly restaurant host and waiter. Help the customer with seating, menu questions, and taking their order.", "turns": 5, "icon": "🍽️"}'),

('Shopping Mall', 'conversation', 'BEGINNER', 'Practice asking for help and making purchases',
 '{"id": "shopping-mall", "name": "Shopping Mall", "level": "BEGINNER", "description": "Practice asking for help and making purchases", "greeting": "Hi there! Can I help you find anything today?", "instructions": "You are a helpful sales assistant. Help customers find products, answer questions about sizes and prices.", "turns": 5, "icon": "🛍️"}'),

('Doctor Appointment', 'conversation', 'BEGINNER', 'Learn to describe symptoms and book appointments',
 '{"id": "doctors-appointment", "name": "Doctor Appointment", "level": "BEGINNER", "description": "Learn to describe symptoms and book appointments", "greeting": "Good morning! How can I help you today?", "instructions": "You are a receptionist and doctor. Help the patient schedule an appointment and discuss their health concerns.", "turns": 5, "icon": "🏥"}'),

('Hotel Check-in', 'conversation', 'BEGINNER', 'Practice hotel conversations and making requests',
 '{"id": "hotel-checkin", "name": "Hotel Check-in", "level": "BEGINNER", "description": "Practice hotel conversations and making requests", "greeting": "Welcome to Grand Hotel! How may I assist you today?", "instructions": "You are a hotel receptionist. Help guests with check-in, room preferences, and hotel amenities.", "turns": 5, "icon": "🏨"}'),

('Public Transport', 'conversation', 'BEGINNER', 'Learn to ask for directions and buy tickets',
 '{"id": "public-transport", "name": "Public Transport", "level": "BEGINNER", "description": "Learn to ask for directions and buy tickets", "greeting": "Hello! Can I help you with tickets or directions?", "instructions": "You are a helpful station assistant. Help passengers with tickets, schedules, and directions.", "turns": 5, "icon": "🚌"}'),

('Bank Visit', 'conversation', 'BEGINNER', 'Practice banking conversations and transactions',
 '{"id": "bank-visit", "name": "Bank Visit", "level": "BEGINNER", "description": "Practice banking conversations and transactions", "greeting": "Good afternoon! Welcome to City Bank. How can I help you today?", "instructions": "You are a bank teller. Help customers with deposits, withdrawals, and account questions.", "turns": 5, "icon": "🏦"}'),

('Grocery Store', 'conversation', 'BEGINNER', 'Learn to ask about products and prices',
 '{"id": "grocery-store", "name": "Grocery Store", "level": "BEGINNER", "description": "Learn to ask about products and prices", "greeting": "Hi! Welcome to Fresh Market. Can I help you find anything?", "instructions": "You are a grocery store employee. Help customers find products and answer questions about prices and freshness.", "turns": 5, "icon": "🛒"}'),

('Phone Call', 'conversation', 'BEGINNER', 'Practice making and receiving phone calls',
 '{"id": "phone-call", "name": "Phone Call", "level": "BEGINNER", "description": "Practice making and receiving phone calls", "greeting": "Hello, this is Sarah from City Services. How can I help you?", "instructions": "You are a customer service representative. Help callers with their questions and requests professionally.", "turns": 5, "icon": "📞"}'),

('Weather Chat', 'conversation', 'BEGINNER', 'Learn to discuss weather and make small talk',
 '{"id": "weather-chat", "name": "Weather Chat", "level": "BEGINNER", "description": "Learn to discuss weather and make small talk", "greeting": "Beautiful day today, isn''t it?", "instructions": "You are having a casual conversation about weather. Keep it light and friendly, typical small talk.", "turns": 5, "icon": "🌤️"}'),

-- INTERMEDIATE conversations
('Job Interview', 'conversation', 'INTERMEDIATE', 'Practice professional interview skills and career discussions',
 '{"id": "job-interview", "name": "Job Interview", "level": "INTERMEDIATE", "description": "Practice professional interview skills and career discussions", "greeting": "Good morning! Thank you for coming in today. Please tell me about yourself.", "instructions": "You are a professional interviewer. Ask about experience, skills, and career goals. Be encouraging but thorough.", "turns": 7, "icon": "💼"}'),

('University Application', 'conversation', 'INTERMEDIATE', 'Discuss academic goals and university admission',
 '{"id": "university-application", "name": "University Application", "level": "INTERMEDIATE", "description": "Discuss academic goals and university admission", "greeting": "Welcome to the admissions office. I understand you''re interested in our programs?", "instructions": "You are a university admissions counselor. Help with program selection, requirements, and application process.", "turns": 7, "icon": "🎓"}'),

('Apartment Rental', 'conversation', 'INTERMEDIATE', 'Navigate housing discussions and rental agreements',
 '{"id": "apartment-rental", "name": "Apartment Rental", "level": "INTERMEDIATE", "description": "Navigate housing discussions and rental agreements", "greeting": "Hi! I understand you''re looking for an apartment. What are your requirements?", "instructions": "You are a real estate agent. Discuss properties, amenities, pricing, and rental terms.", "turns": 7, "icon": "🏠"}'),

('Travel Planning', 'conversation', 'INTERMEDIATE', 'Plan complex trips and discuss travel preferences',
 '{"id": "travel-planning", "name": "Travel Planning", "level": "INTERMEDIATE", "description": "Plan complex trips and discuss travel preferences", "greeting": "Good afternoon! How can I help you plan your next adventure?", "instructions": "You are a travel agent. Discuss destinations, budgets, accommodations, and create detailed itineraries.", "turns": 7, "icon": "✈️"}'),

('Healthcare Consultation', 'conversation', 'INTERMEDIATE', 'Discuss complex health issues and treatment options',
 '{"id": "healthcare-consultation", "name": "Healthcare Consultation", "level": "INTERMEDIATE", "description": "Discuss complex health issues and treatment options", "greeting": "Good morning. I''ve reviewed your file. Let''s discuss your concerns.", "instructions": "You are a healthcare professional. Discuss symptoms, treatments, and health advice professionally.", "turns": 7, "icon": "⚕️"}'),

('Business Meeting', 'conversation', 'INTERMEDIATE', 'Participate in professional business discussions',
 '{"id": "business-meeting", "name": "Business Meeting", "level": "INTERMEDIATE", "description": "Participate in professional business discussions", "greeting": "Good morning everyone. Let''s begin today''s quarterly review.", "instructions": "You are leading a business meeting. Discuss goals, performance, and strategic planning.", "turns": 7, "icon": "📊"}'),

-- ADVANCED conversations
('Academic Conference', 'conversation', 'ADVANCED', 'Present research and engage in scholarly discussion',
 '{"id": "academic-conference", "name": "Academic Conference", "level": "ADVANCED", "description": "Present research and engage in scholarly discussion", "greeting": "Thank you for joining our symposium. Could you present your research findings?", "instructions": "You are moderating an academic conference. Engage in complex discussions about research, methodology, and implications.", "turns": 10, "icon": "🔬"}'),

('Legal Consultation', 'conversation', 'ADVANCED', 'Discuss complex legal matters and procedures',
 '{"id": "legal-consultation", "name": "Legal Consultation", "level": "ADVANCED", "description": "Discuss complex legal matters and procedures", "greeting": "Good afternoon. I understand you need legal advice regarding your situation.", "instructions": "You are a legal professional. Discuss complex legal matters, procedures, and provide professional guidance.", "turns": 10, "icon": "⚖️"}'),

('Investment Advisory', 'conversation', 'ADVANCED', 'Analyze financial markets and investment strategies',
 '{"id": "investment-advisory", "name": "Investment Advisory", "level": "ADVANCED", "description": "Analyze financial markets and investment strategies", "greeting": "Welcome. Let''s review your portfolio and discuss your investment objectives.", "instructions": "You are a financial advisor. Discuss complex investment strategies, market analysis, and financial planning.", "turns": 10, "icon": "📈"}'),

('Technical Consultation', 'conversation', 'ADVANCED', 'Discuss complex technical solutions and innovations',
 '{"id": "technical-consultation", "name": "Technical Consultation", "level": "ADVANCED", "description": "Discuss complex technical solutions and innovations", "greeting": "Thank you for consulting with us. Let''s discuss your technical requirements.", "instructions": "You are a technical expert. Engage in complex discussions about technology, solutions, and implementation strategies.", "turns": 10, "icon": "⚙️"}'),

('Policy Debate', 'conversation', 'ADVANCED', 'Engage in sophisticated policy and social issue discussions',
 '{"id": "policy-debate", "name": "Policy Debate", "level": "ADVANCED", "description": "Engage in sophisticated policy and social issue discussions", "greeting": "Welcome to today''s policy forum. What are your thoughts on the proposed reforms?", "instructions": "You are moderating a policy debate. Engage in nuanced discussions about social issues, policy implications, and solutions.", "turns": 10, "icon": "🏛️"}');

-- Insert pronunciation assignments
insert into public.practice_assignments (title, type, level, description, content) values
-- BEGINNER pronunciation
('Basic Personal Information', 'pronunciation', 'BEGINNER', 'Practice saying your name, age, and where you are from', 
 '{"transcript": "My name is Sarah Johnson. I am twenty-five years old. I am from Toronto, Canada."}'),

('Daily Routine', 'pronunciation', 'BEGINNER', 'Describe simple daily activities with clear pronunciation',
 '{"transcript": "I wake up at seven o''clock every morning. I brush my teeth and eat breakfast."}'),

('Family Members', 'pronunciation', 'BEGINNER', 'Practice family vocabulary and relationships',
 '{"transcript": "I have two brothers and one sister. My parents live in the same city as me."}'),

('Food and Drinks', 'pronunciation', 'BEGINNER', 'Practice food vocabulary and preferences',
 '{"transcript": "I like pizza and chocolate ice cream. My favorite drink is orange juice."}'),

('Weather Descriptions', 'pronunciation', 'BEGINNER', 'Describe weather conditions clearly',
 '{"transcript": "Today is sunny and warm. Yesterday it was cloudy and a little bit cold."}'),

('Shopping Items', 'pronunciation', 'BEGINNER', 'Practice shopping vocabulary and quantities',
 '{"transcript": "I need to buy three apples, two bottles of milk, and one loaf of bread."}'),

('Time and Dates', 'pronunciation', 'BEGINNER', 'Practice saying times, days, and dates',
 '{"transcript": "The meeting is on Monday at three thirty in the afternoon."}'),

('Transportation', 'pronunciation', 'BEGINNER', 'Practice transportation vocabulary',
 '{"transcript": "I go to work by bus every day. Sometimes I walk when the weather is nice."}'),

-- INTERMEDIATE pronunciation
('Work Experience', 'pronunciation', 'INTERMEDIATE', 'Describe professional background and responsibilities',
 '{"transcript": "I have been working as a marketing coordinator for three years. My responsibilities include managing social media campaigns and analyzing customer feedback."}'),

('Travel Experiences', 'pronunciation', 'INTERMEDIATE', 'Share detailed travel stories and cultural observations',
 '{"transcript": "Last summer, I traveled to Japan for two weeks. The most interesting experience was visiting traditional temples in Kyoto and learning about Japanese tea ceremony."}'),

('Educational Background', 'pronunciation', 'INTERMEDIATE', 'Discuss academic achievements and learning experiences',
 '{"transcript": "I graduated from university with a degree in computer science. During my studies, I specialized in artificial intelligence and completed several challenging projects."}'),

('Future Plans and Goals', 'pronunciation', 'INTERMEDIATE', 'Express aspirations and long-term objectives',
 '{"transcript": "In the next five years, I plan to start my own technology company. I believe innovation in renewable energy will create significant opportunities for entrepreneurs."}'),

('Cultural Differences', 'pronunciation', 'INTERMEDIATE', 'Compare and contrast cultural practices and values',
 '{"transcript": "There are notable differences between Eastern and Western approaches to work-life balance. While Western cultures often emphasize individual achievement, Eastern cultures prioritize collective harmony."}'),

('Environmental Issues', 'pronunciation', 'INTERMEDIATE', 'Discuss environmental challenges and solutions',
 '{"transcript": "Climate change is one of the most pressing issues of our time. Governments and individuals must collaborate to implement sustainable practices and reduce carbon emissions."}'),

-- ADVANCED pronunciation
('Philosophical Perspectives', 'pronunciation', 'ADVANCED', 'Express complex philosophical ideas and arguments',
 '{"transcript": "The relationship between free will and determinism has been debated by philosophers for centuries. While some argue that our choices are predetermined by causal factors, others maintain that humans possess genuine autonomy in their decision-making processes."}'),

('Economic Analysis', 'pronunciation', 'ADVANCED', 'Discuss complex economic theories and market dynamics',
 '{"transcript": "The implementation of quantitative easing policies during economic recessions demonstrates the central bank''s commitment to maintaining liquidity in financial markets, although critics argue that such measures may contribute to asset price inflation and increase wealth inequality."}'),

('Scientific Research', 'pronunciation', 'ADVANCED', 'Explain research methodologies and scientific discoveries',
 '{"transcript": "Recent advances in CRISPR gene editing technology have revolutionized our understanding of genetic modification. However, the ethical implications of human genetic enhancement raise fundamental questions about the future of human evolution and the potential for creating genetic inequalities."}'),

('Political Commentary', 'pronunciation', 'ADVANCED', 'Analyze political systems and policy implications',
 '{"transcript": "The effectiveness of democratic institutions depends largely on the active participation of informed citizens. However, the proliferation of misinformation through social media platforms poses significant challenges to the democratic process and requires comprehensive regulatory frameworks."}'),

('Literary Analysis', 'pronunciation', 'ADVANCED', 'Discuss literature and artistic interpretation',
 '{"transcript": "Shakespeare''s exploration of human ambition in Macbeth reveals the psychological transformation that occurs when moral boundaries are transgressed. The protagonist''s descent into tyranny illustrates the corrupting influence of unchecked power and the inevitable consequences of betraying one''s ethical principles."}'),

('Technological Ethics', 'pronunciation', 'ADVANCED', 'Examine ethical implications of technological advancement',
 '{"transcript": "The development of artificial intelligence systems capable of autonomous decision-making raises profound questions about responsibility and accountability. As machines become increasingly sophisticated, society must establish comprehensive ethical frameworks to govern their deployment and ensure human oversight remains paramount."}'
);

-- Create indexes
create index if not exists idx_practice_assignments_type_level on public.practice_assignments(type, level);
create index if not exists idx_curriculum_assignments_curriculum_week on public.curriculum_assignments(curriculum_id, week_number);

-- Enable RLS
alter table public.practice_assignments enable row level security;
alter table public.personalized_curricula enable row level security;
alter table public.curriculum_assignments enable row level security;

-- RLS Policies
create policy "Anyone can view assignments" on public.practice_assignments for select using (true);

create policy "Users can view their own curricula" on public.personalized_curricula for select using (auth.uid() = user_id);
create policy "Users can insert their own curricula" on public.personalized_curricula for insert with check (auth.uid() = user_id);

create policy "Users can view their curriculum assignments" on public.curriculum_assignments for select using (
  curriculum_id in (select id from public.personalized_curricula where user_id = auth.uid())
);
create policy "Users can update their curriculum assignments" on public.curriculum_assignments for update using (
  curriculum_id in (select id from public.personalized_curricula where user_id = auth.uid())
);