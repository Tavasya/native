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
<<<<<<< HEAD
-- Beginner Conversation Scenarios with Complete Scripts

('Coffee Corner', 'conversation', 'BEGINNER', 'Practice ordering coffee with guided prompts and suggestions', 
 '{"id": "coffee-corner", "name": "Coffee Corner", "level": "BEGINNER", "description": "Practice ordering coffee with guided prompts and suggestions", "greeting": "Hi! Welcome to Coffee Corner. What can I get for you today?", "instructions": "You are a friendly coffee shop barista. Follow the exact script for guided practice. Guide the customer through ordering coffee step by step.", "turns": 5, "icon": "☕", "conversationScript": [{"turn": 1, "agent": "Hi! Welcome to Coffee Corner. What can I get for you today?", "suggestedResponse": "I want a coffee, please"}, {"turn": 2, "agent": "Great! What size would you like - small, medium, or large?", "suggestedResponse": "Medium, please"}, {"turn": 3, "agent": "Perfect! Would you like anything else? We have muffins and sandwiches.", "suggestedResponse": "How much is a muffin?"}, {"turn": 4, "agent": "The blueberry muffin is $3 and the chocolate chip is $3.50.", "suggestedResponse": "I''ll take the blueberry muffin"}, {"turn": 5, "agent": "Excellent! That''s one medium coffee and one blueberry muffin. That''ll be $8.50 total.", "suggestedResponse": "Here you go"}]}'),

('Restaurant Visit', 'conversation', 'BEGINNER', 'Learn to order food and interact with restaurant staff',
 '{"id": "restaurant-visit", "name": "Restaurant Visit", "level": "BEGINNER", "description": "Learn to order food and interact with restaurant staff", "greeting": "Good evening! Welcome to our restaurant. How many people are in your party?", "instructions": "You are a friendly restaurant host and waiter. Help the customer with seating, menu questions, and taking their order.", "turns": 5, "icon": "🍽️", "conversationScript": [{"turn": 1, "agent": "Good evening! Welcome to our restaurant. How many people are in your party?", "suggestedResponse": "Table for two, please"}, {"turn": 2, "agent": "Perfect! Right this way. Here are your menus. Can I start you with something to drink?", "suggestedResponse": "Two glasses of water, please"}, {"turn": 3, "agent": "Of course! Are you ready to order, or do you need a few more minutes?", "suggestedResponse": "What do you recommend?"}, {"turn": 4, "agent": "Our pasta special is very popular, and the grilled salmon is excellent tonight.", "suggestedResponse": "I''ll have the pasta special"}, {"turn": 5, "agent": "Great choice! And for your companion?", "suggestedResponse": "They''ll have the salmon, please"}]}'),

('Shopping Mall', 'conversation', 'BEGINNER', 'Practice asking for help and making purchases',
 '{"id": "shopping-mall", "name": "Shopping Mall", "level": "BEGINNER", "description": "Practice asking for help and making purchases", "greeting": "Hi there! Can I help you find anything today?", "instructions": "You are a helpful sales assistant. Help customers find products, answer questions about sizes and prices.", "turns": 5, "icon": "🛍️", "conversationScript": [{"turn": 1, "agent": "Hi there! Can I help you find anything today?", "suggestedResponse": "I''m looking for a birthday gift"}, {"turn": 2, "agent": "How nice! What kind of gift are you thinking of? For a man or woman?", "suggestedResponse": "For my sister"}, {"turn": 3, "agent": "Wonderful! How about this nice scarf or maybe some jewelry?", "suggestedResponse": "How much is the scarf?"}, {"turn": 4, "agent": "This one is $25, and it comes in three colors - blue, red, or green.", "suggestedResponse": "I''ll take the blue one"}, {"turn": 5, "agent": "Excellent choice! Would you like me to gift wrap it for you?", "suggestedResponse": "Yes, please"}]}'),

('Doctor Appointment', 'conversation', 'BEGINNER', 'Learn to describe symptoms and book appointments',
 '{"id": "doctors-appointment", "name": "Doctor Appointment", "level": "BEGINNER", "description": "Learn to describe symptoms and book appointments", "greeting": "Good morning! How can I help you today?", "instructions": "You are a receptionist and doctor. Help the patient schedule an appointment and discuss their health concerns.", "turns": 5, "icon": "🏥", "conversationScript": [{"turn": 1, "agent": "Good morning! How can I help you today?", "suggestedResponse": "I''d like to make an appointment"}, {"turn": 2, "agent": "Of course! What seems to be the problem?", "suggestedResponse": "I have a headache and feel tired"}, {"turn": 3, "agent": "I see. How long have you been feeling this way?", "suggestedResponse": "About three days"}, {"turn": 4, "agent": "We have an opening this afternoon at 2 PM. Does that work for you?", "suggestedResponse": "Yes, that''s perfect"}, {"turn": 5, "agent": "Great! I have you down for 2 PM today. Please arrive 15 minutes early.", "suggestedResponse": "Thank you very much"}]}'),
 
('Hotel Check-in', 'conversation', 'BEGINNER', 'Practice hotel conversations and making requests',
 '{"id": "hotel-checkin", "name": "Hotel Check-in", "level": "BEGINNER", "description": "Practice hotel conversations and making requests", "greeting": "Welcome to Grand Hotel! How may I assist you today?", "instructions": "You are a hotel receptionist. Help guests with check-in, room preferences, and hotel amenities.", "turns": 5, "icon": "🏨", "conversationScript": [{"turn": 1, "agent": "Welcome to Grand Hotel! How may I assist you today?", "suggestedResponse": "I have a reservation under Smith"}, {"turn": 2, "agent": "Yes, I see your reservation here. You''re staying for two nights, correct?", "suggestedResponse": "That''s right"}, {"turn": 3, "agent": "Perfect! I have a room on the 5th floor with a city view. Is that acceptable?", "suggestedResponse": "Do you have anything higher up?"}, {"turn": 4, "agent": "Certainly! I can give you a room on the 8th floor with a great view.", "suggestedResponse": "That sounds perfect"}, {"turn": 5, "agent": "Wonderful! Here are your key cards. Breakfast is served until 10 AM.", "suggestedResponse": "Thank you very much"}]}'),

('Public Transport', 'conversation', 'BEGINNER', 'Learn to ask for directions and buy tickets',
 '{"id": "public-transport", "name": "Public Transport", "level": "BEGINNER", "description": "Learn to ask for directions and buy tickets", "greeting": "Hello! Can I help you with tickets or directions?", "instructions": "You are a helpful station assistant. Help passengers with tickets, schedules, and directions.", "turns": 5, "icon": "🚌", "conversationScript": [{"turn": 1, "agent": "Hello! Can I help you with tickets or directions?", "suggestedResponse": "I need to get to the airport"}, {"turn": 2, "agent": "Sure! You''ll need to take the blue line to Central Station, then transfer to the airport express.", "suggestedResponse": "How much does it cost?"}, {"turn": 3, "agent": "A single ticket is $4.50, or you can get a day pass for $12.", "suggestedResponse": "I''ll take a single ticket"}, {"turn": 4, "agent": "Here you go! The next train leaves in 8 minutes from platform 2.", "suggestedResponse": "How long does the journey take?"}, {"turn": 5, "agent": "About 45 minutes total, including the transfer. Have a safe trip!", "suggestedResponse": "Thank you for your help"}]}'),

('Bank Visit', 'conversation', 'BEGINNER', 'Practice banking conversations and transactions',
 '{"id": "bank-visit", "name": "Bank Visit", "level": "BEGINNER", "description": "Practice banking conversations and transactions", "greeting": "Good afternoon! Welcome to City Bank. How can I help you today?", "instructions": "You are a bank teller. Help customers with deposits, withdrawals, and account questions.", "turns": 5, "icon": "🏦", "conversationScript": [{"turn": 1, "agent": "Good afternoon! Welcome to City Bank. How can I help you today?", "suggestedResponse": "I''d like to withdraw some money"}, {"turn": 2, "agent": "Certainly! Do you have your bank card and ID with you?", "suggestedResponse": "Yes, here they are"}, {"turn": 3, "agent": "Thank you. How much would you like to withdraw today?", "suggestedResponse": "Two hundred dollars, please"}, {"turn": 4, "agent": "Perfect! Would you like that in twenties or mixed bills?", "suggestedResponse": "Mixed bills, please"}, {"turn": 5, "agent": "Here you go - $200. Your remaining balance is $1,350. Anything else today?", "suggestedResponse": "No, that''s all. Thank you"}]}'),

('Grocery Store', 'conversation', 'BEGINNER', 'Learn to ask about products and prices',
 '{"id": "grocery-store", "name": "Grocery Store", "level": "BEGINNER", "description": "Learn to ask about products and prices", "greeting": "Hi! Welcome to Fresh Market. Can I help you find anything?", "instructions": "You are a grocery store employee. Help customers find products and answer questions about prices and freshness.", "turns": 5, "icon": "🛒", "conversationScript": [{"turn": 1, "agent": "Hi! Welcome to Fresh Market. Can I help you find anything?", "suggestedResponse": "Where can I find the milk?"}, {"turn": 2, "agent": "The dairy section is at the back of the store, aisle 7. Are you looking for any particular type?", "suggestedResponse": "Just regular whole milk"}, {"turn": 3, "agent": "Perfect! We have several brands. The store brand is $3.99 and the organic is $5.49.", "suggestedResponse": "I''ll take the store brand"}, {"turn": 4, "agent": "Great choice! Is there anything else you need help finding today?", "suggestedResponse": "Where is the bread section?"}, {"turn": 5, "agent": "The bakery and bread section is right up front, aisle 1. Fresh bread comes out at 2 PM!", "suggestedResponse": "Perfect, thank you"}]}'),

('Phone Call', 'conversation', 'BEGINNER', 'Practice making and receiving phone calls',
 '{"id": "phone-call", "name": "Phone Call", "level": "BEGINNER", "description": "Practice making and receiving phone calls", "greeting": "Hello, this is Sarah from City Services. How can I help you?", "instructions": "You are a customer service representative. Help callers with their questions and requests professionally.", "turns": 5, "icon": "📞", "conversationScript": [{"turn": 1, "agent": "Hello, this is Sarah from City Services. How can I help you?", "suggestedResponse": "Hi, I have a question about my bill"}, {"turn": 2, "agent": "I''d be happy to help with that. Can I get your account number, please?", "suggestedResponse": "Yes, it''s 12345678"}, {"turn": 3, "agent": "Thank you. I see your account here. What specific question did you have about your bill?", "suggestedResponse": "Why is it higher this month?"}, {"turn": 4, "agent": "I see the increase is due to additional usage last month. Your usage was 20% higher than usual.", "suggestedResponse": "Oh, that makes sense. Thank you"}, {"turn": 5, "agent": "You''re welcome! Is there anything else I can help you with today?", "suggestedResponse": "No, that''s all. Have a good day"}]}'),

('Weather Chat', 'conversation', 'BEGINNER', 'Learn to discuss weather and make small talk',
 '{"id": "weather-chat", "name": "Weather Chat", "level": "BEGINNER", "description": "Learn to discuss weather and make small talk", "greeting": "Beautiful day today, isn''t it?", "instructions": "You are having a casual conversation about weather. Keep it light and friendly, typical small talk.", "turns": 5, "icon": "🌤️", "conversationScript": [{"turn": 1, "agent": "Beautiful day today, isn''t it?", "suggestedResponse": "Yes, it''s lovely and sunny"}, {"turn": 2, "agent": "Perfect weather for a walk in the park. Have you been outside much today?", "suggestedResponse": "Not yet, but I''m planning to"}, {"turn": 3, "agent": "That sounds nice! I heard it might rain tomorrow though.", "suggestedResponse": "Really? I hadn''t heard that"}, {"turn": 4, "agent": "Yes, the forecast shows thunderstorms in the afternoon. Better enjoy today!", "suggestedResponse": "I definitely will. Thanks for letting me know"}, {"turn": 5, "agent": "You''re welcome! Hope you have a wonderful day outside.", "suggestedResponse": "You too! Take care"}]}'),

-- 10 Additional Beginner Scenarios

('Post Office', 'conversation', 'BEGINNER', 'Learn to send mail and packages',
 '{"id": "post-office", "name": "Post Office", "level": "BEGINNER", "description": "Learn to send mail and packages", "greeting": "Good morning! How can I help you today?", "instructions": "You are a postal worker. Help customers with mailing packages, buying stamps, and postal services.", "turns": 5, "icon": "📮", "conversationScript": [{"turn": 1, "agent": "Good morning! How can I help you today?", "suggestedResponse": "I need to send this package"}, {"turn": 2, "agent": "Of course! Where is it going?", "suggestedResponse": "To New York City"}, {"turn": 3, "agent": "Great! Would you like regular delivery or express?", "suggestedResponse": "How much is express?"}, {"turn": 4, "agent": "Express is $15.99 and arrives tomorrow. Regular is $8.50 and takes 3-5 days.", "suggestedResponse": "I''ll go with regular, please"}, {"turn": 5, "agent": "Perfect! That''ll be $8.50. Here''s your tracking number.", "suggestedResponse": "Thank you very much"}]}'),

('Gas Station', 'conversation', 'BEGINNER', 'Practice asking for directions and buying fuel',
 '{"id": "gas-station", "name": "Gas Station", "level": "BEGINNER", "description": "Practice asking for directions and buying fuel", "greeting": "Hi there! Need help with anything?", "instructions": "You are a gas station attendant. Help customers with fuel, directions, and convenience store items.", "turns": 5, "icon": "⛽", "conversationScript": [{"turn": 1, "agent": "Hi there! Need help with anything?", "suggestedResponse": "Can you help me with the pump?"}, {"turn": 2, "agent": "Sure! What type of gas do you need - regular, mid-grade, or premium?", "suggestedResponse": "Regular, please"}, {"turn": 3, "agent": "Perfect! Just insert your card here and select regular on the screen.", "suggestedResponse": "How do I get a receipt?"}, {"turn": 4, "agent": "After you finish pumping, the machine will ask if you want a receipt. Just press yes.", "suggestedResponse": "Great, thank you"}, {"turn": 5, "agent": "You''re welcome! Have a safe drive!", "suggestedResponse": "Thanks, you too"}]}'),

('Library Visit', 'conversation', 'BEGINNER', 'Learn to check out books and ask for help',
 '{"id": "library-visit", "name": "Library Visit", "level": "BEGINNER", "description": "Learn to check out books and ask for help", "greeting": "Hello! Welcome to the city library. How can I assist you?", "instructions": "You are a helpful librarian. Help patrons find books, use library services, and check out materials.", "turns": 5, "icon": "📚", "conversationScript": [{"turn": 1, "agent": "Hello! Welcome to the city library. How can I assist you?", "suggestedResponse": "I''m looking for books about cooking"}, {"turn": 2, "agent": "Wonderful! What type of cooking are you interested in?", "suggestedResponse": "Italian cuisine"}, {"turn": 3, "agent": "Great choice! The cooking section is on the second floor, aisle 12. We have many Italian cookbooks.", "suggestedResponse": "Do I need a library card to borrow books?"}, {"turn": 4, "agent": "Yes, but it''s free to get one! Just bring an ID and proof of address.", "suggestedResponse": "Perfect, I have those with me"}, {"turn": 5, "agent": "Excellent! Let me set that up for you right now.", "suggestedResponse": "Thank you so much"}]}'),

('Pharmacy Visit', 'conversation', 'BEGINNER', 'Practice picking up prescriptions and asking about medications',
 '{"id": "pharmacy-visit", "name": "Pharmacy Visit", "level": "BEGINNER", "description": "Practice picking up prescriptions and asking about medications", "greeting": "Good afternoon! Are you here to pick up or drop off?", "instructions": "You are a pharmacy technician. Help customers with prescriptions, over-the-counter medications, and health questions.", "turns": 5, "icon": "💊", "conversationScript": [{"turn": 1, "agent": "Good afternoon! Are you here to pick up or drop off?", "suggestedResponse": "I''m here to pick up a prescription"}, {"turn": 2, "agent": "Sure! What''s your last name and date of birth?", "suggestedResponse": "Johnson, January 15th, 1990"}, {"turn": 3, "agent": "Perfect! I have your medication ready. That''ll be $12.50.", "suggestedResponse": "Do I take this with food?"}, {"turn": 4, "agent": "Yes, it''s best to take it with a meal to avoid stomach upset. Take one pill twice daily.", "suggestedResponse": "Got it, thank you"}, {"turn": 5, "agent": "You''re welcome! Any other questions about your medication?", "suggestedResponse": "No, that covers everything"}]}'),

('Car Rental', 'conversation', 'BEGINNER', 'Learn to rent a car and discuss rental terms',
 '{"id": "car-rental", "name": "Car Rental", "level": "BEGINNER", "description": "Learn to rent a car and discuss rental terms", "greeting": "Welcome to Quick Car Rental! How can I help you today?", "instructions": "You are a car rental agent. Help customers choose vehicles, explain rental terms, and process reservations.", "turns": 5, "icon": "🚗", "conversationScript": [{"turn": 1, "agent": "Welcome to Quick Car Rental! How can I help you today?", "suggestedResponse": "I need to rent a car for the weekend"}, {"turn": 2, "agent": "Perfect! What size car are you looking for - compact, mid-size, or full-size?", "suggestedResponse": "A compact car is fine"}, {"turn": 3, "agent": "Great! We have a Toyota Corolla available for $35 per day. Does that work?", "suggestedResponse": "Yes, that sounds good"}, {"turn": 4, "agent": "Excellent! I''ll need your driver''s license and a credit card.", "suggestedResponse": "Here you go"}, {"turn": 5, "agent": "Perfect! Your car is ready in spot 15. Please return it by Sunday at 6 PM.", "suggestedResponse": "Thank you very much"}]}'),

('Taxi Ride', 'conversation', 'BEGINNER', 'Practice giving directions and communicating with taxi drivers',
 '{"id": "taxi-ride", "name": "Taxi Ride", "level": "BEGINNER", "description": "Practice giving directions and communicating with taxi drivers", "greeting": "Good evening! Where to tonight?", "instructions": "You are a friendly taxi driver. Help passengers get to their destination safely and efficiently.", "turns": 5, "icon": "🚕", "conversationScript": [{"turn": 1, "agent": "Good evening! Where to tonight?", "suggestedResponse": "I need to go to the train station"}, {"turn": 2, "agent": "Sure thing! Which train station - Central or North Station?", "suggestedResponse": "Central Station, please"}, {"turn": 3, "agent": "Got it! That''ll take about 15 minutes. Any particular route you prefer?", "suggestedResponse": "Whatever''s fastest is fine"}, {"turn": 4, "agent": "Perfect! I''ll take Main Street to avoid traffic. The fare will be around $12.", "suggestedResponse": "That sounds good"}, {"turn": 5, "agent": "Here we are at Central Station! That''s $11.50 total.", "suggestedResponse": "Keep the change"}]}'),

('Clothing Store', 'conversation', 'BEGINNER', 'Learn to shop for clothes and ask about sizes',
 '{"id": "clothing-store", "name": "Clothing Store", "level": "BEGINNER", "description": "Learn to shop for clothes and ask about sizes", "greeting": "Hi! Welcome to Fashion Plus. Can I help you find anything?", "instructions": "You are a clothing store associate. Help customers find clothes, sizes, and answer questions about fit and style.", "turns": 5, "icon": "👕", "conversationScript": [{"turn": 1, "agent": "Hi! Welcome to Fashion Plus. Can I help you find anything?", "suggestedResponse": "I''m looking for a dress shirt"}, {"turn": 2, "agent": "Great! What size do you wear?", "suggestedResponse": "I think I''m a medium"}, {"turn": 3, "agent": "Perfect! Here are our medium dress shirts. What color were you thinking?", "suggestedResponse": "Do you have anything in blue?"}, {"turn": 4, "agent": "Absolutely! This light blue one is very popular, and we have navy blue too.", "suggestedResponse": "Can I try on the light blue one?"}, {"turn": 5, "agent": "Of course! The fitting rooms are right over there.", "suggestedResponse": "Thank you for your help"}]}'),

('Barber Shop', 'conversation', 'BEGINNER', 'Practice describing what haircut you want',
 '{"id": "barber-shop", "name": "Barber Shop", "level": "BEGINNER", "description": "Practice describing what haircut you want", "greeting": "Hi there! What can I do for you today?", "instructions": "You are a friendly barber. Help customers describe the haircut they want and provide good service.", "turns": 5, "icon": "✂️", "conversationScript": [{"turn": 1, "agent": "Hi there! What can I do for you today?", "suggestedResponse": "I need a haircut"}, {"turn": 2, "agent": "Sure thing! How would you like it cut?", "suggestedResponse": "Not too short, just trim it up"}, {"turn": 3, "agent": "Got it! How about the sides - shorter than the top?", "suggestedResponse": "Yes, please"}, {"turn": 4, "agent": "Perfect! Would you like me to trim your beard too?", "suggestedResponse": "Yes, just a little off the sides"}, {"turn": 5, "agent": "All done! How does that look?", "suggestedResponse": "Looks great, thank you"}]}'),

('Movie Theater', 'conversation', 'BEGINNER', 'Learn to buy movie tickets and concessions',
 '{"id": "movie-theater", "name": "Movie Theater", "level": "BEGINNER", "description": "Learn to buy movie tickets and concessions", "greeting": "Welcome to Starlight Cinema! What movie would you like to see?", "instructions": "You are a movie theater employee. Help customers buy tickets, choose showtimes, and purchase concessions.", "turns": 5, "icon": "🎬", "conversationScript": [{"turn": 1, "agent": "Welcome to Starlight Cinema! What movie would you like to see?", "suggestedResponse": "What movies are playing tonight?"}, {"turn": 2, "agent": "We have the new action movie at 7 PM and 9:30 PM, and a comedy at 8 PM.", "suggestedResponse": "I''ll take two tickets for the 7 PM show"}, {"turn": 3, "agent": "Perfect! That''s $24 for two adult tickets. Would you like any snacks?", "suggestedResponse": "How much is popcorn?"}, {"turn": 4, "agent": "A large popcorn is $6, medium is $4.50.", "suggestedResponse": "One medium popcorn and two sodas, please"}, {"turn": 5, "agent": "Great! That''s $33 total. Theater 3 is down the hall on your right.", "suggestedResponse": "Thank you very much"}]}'),

('Fitness Center', 'conversation', 'BEGINNER', 'Learn to inquire about gym membership and facilities',
 '{"id": "fitness-center", "name": "Fitness Center", "level": "BEGINNER", "description": "Learn to inquire about gym membership and facilities", "greeting": "Hi! Welcome to FitLife Gym. Are you interested in a membership?", "instructions": "You are a gym staff member. Help potential members learn about facilities, classes, and membership options.", "turns": 5, "icon": "💪", "conversationScript": [{"turn": 1, "agent": "Hi! Welcome to FitLife Gym. Are you interested in a membership?", "suggestedResponse": "Yes, I''d like to know about your membership options"}, {"turn": 2, "agent": "Great! We have monthly for $39 or yearly for $299. Both include all equipment and classes.", "suggestedResponse": "What kind of classes do you offer?"}, {"turn": 3, "agent": "We have yoga, spinning, aerobics, and strength training classes throughout the week.", "suggestedResponse": "Do I need to sign up for classes?"}, {"turn": 4, "agent": "Yes, but you can sign up online or at the front desk. Most classes have space available.", "suggestedResponse": "That sounds perfect. I''ll take the monthly membership"}, {"turn": 5, "agent": "Excellent choice! Let me get you signed up and show you around.", "suggestedResponse": "Thank you, I''m excited to get started"}]}');


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