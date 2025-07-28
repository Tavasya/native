-- Seed data for assignment parts
-- This file contains sample assignment parts for testing the builder feature

-- Sample Part 1 questions (standalone)
INSERT INTO assignment_parts (title, description, part_type, topic, difficulty_level, questions, is_public, usage_count) VALUES
(
  'Personal Introduction',
  'Basic personal information and background questions',
  'part1',
  'Personal',
  'beginner',
  '[
    {
      "id": "p1-q1",
      "type": "normal",
      "question": "Can you tell me about yourself?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "p1-q2", 
      "type": "normal",
      "question": "Where are you from?",
      "speakAloud": true,
      "timeLimit": "1"
    },
    {
      "id": "p1-q3",
      "type": "normal", 
      "question": "What do you do for work or study?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Hobbies and Interests',
  'Questions about free time activities and personal interests',
  'part1',
  'Personal',
  'beginner',
  '[
    {
      "id": "h1-q1",
      "type": "normal",
      "question": "What do you like to do in your free time?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "h1-q2",
      "type": "normal",
      "question": "Do you have any hobbies?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "h1-q3",
      "type": "normal",
      "question": "What kind of music do you enjoy?",
      "speakAloud": true,
      "timeLimit": "1"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Travel Experiences',
  'Questions about travel and places visited',
  'part1',
  'Travel',
  'intermediate',
  '[
    {
      "id": "t1-q1",
      "type": "normal",
      "question": "Have you traveled to any interesting places?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "t1-q2",
      "type": "normal",
      "question": "What was your most memorable trip?",
      "speakAloud": true,
      "timeLimit": "3"
    },
    {
      "id": "t1-q3",
      "type": "normal",
      "question": "Where would you like to visit in the future?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Technology and Innovation',
  'Questions about technology and its impact on society',
  'part1',
  'Technology',
  'advanced',
  '[
    {
      "id": "tech1-q1",
      "type": "normal",
      "question": "How has technology changed your life?",
      "speakAloud": true,
      "timeLimit": "3"
    },
    {
      "id": "tech1-q2",
      "type": "normal",
      "question": "What do you think about artificial intelligence?",
      "speakAloud": true,
      "timeLimit": "3"
    },
    {
      "id": "tech1-q3",
      "type": "normal",
      "question": "How do you use technology in your daily life?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
);

-- Sample Part 2 questions (bullet points)
INSERT INTO assignment_parts (title, description, part_type, topic, difficulty_level, questions, is_public, usage_count) VALUES
(
  'Describe Your Hometown',
  'Detailed description of hometown with bullet points',
  'part2_only',
  'Personal',
  'intermediate',
  '[
    {
      "id": "hometown-p2",
      "type": "bulletPoints",
      "question": "Describe your hometown. You should say:",
      "bulletPoints": [
        "Where it is located",
        "What it is famous for",
        "What you like most about it",
        "How it has changed over the years"
      ],
      "speakAloud": true,
      "timeLimit": "4"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Describe a Book You Enjoyed',
  'Detailed description of a favorite book',
  'part2_only',
  'Entertainment',
  'intermediate',
  '[
    {
      "id": "book-p2",
      "type": "bulletPoints",
      "question": "Describe a book you enjoyed reading. You should say:",
      "bulletPoints": [
        "What the book is about",
        "When you read it",
        "Why you chose to read it",
        "What you learned from it"
      ],
      "speakAloud": true,
      "timeLimit": "4"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Describe a Memorable Event',
  'Detailed description of an important event',
  'part2_only',
  'Personal',
  'advanced',
  '[
    {
      "id": "event-p2",
      "type": "bulletPoints",
      "question": "Describe a memorable event in your life. You should say:",
      "bulletPoints": [
        "What the event was",
        "When it happened",
        "Who was involved",
        "Why it was memorable"
      ],
      "speakAloud": true,
      "timeLimit": "4"
    }
  ]'::jsonb,
  true,
  0
);

-- Sample Part 3 questions (follow-up to Part 2)
INSERT INTO assignment_parts (title, description, part_type, topic, difficulty_level, questions, is_public, usage_count) VALUES
(
  'Hometown Discussion',
  'Follow-up questions about hometowns and cities',
  'part3_only',
  'Personal',
  'intermediate',
  '[
    {
      "id": "hometown-p3-1",
      "type": "normal",
      "question": "Do you think it is better to live in a big city or a small town?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "hometown-p3-2",
      "type": "normal",
      "question": "What are the advantages and disadvantages of living in your hometown?",
      "speakAloud": true,
      "timeLimit": "3"
    },
    {
      "id": "hometown-p3-3",
      "type": "normal",
      "question": "How do you think cities will change in the future?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Reading and Literature',
  'Follow-up questions about reading habits and literature',
  'part3_only',
  'Entertainment',
  'intermediate',
  '[
    {
      "id": "reading-p3-1",
      "type": "normal",
      "question": "Do you think reading is important in today''s digital age?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "reading-p3-2",
      "type": "normal",
      "question": "What types of books do people in your country prefer to read?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "reading-p3-3",
      "type": "normal",
      "question": "How has the way people read changed over the years?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
),
(
  'Life Events and Memories',
  'Follow-up questions about life events and memories',
  'part3_only',
  'Personal',
  'advanced',
  '[
    {
      "id": "events-p3-1",
      "type": "normal",
      "question": "Why do you think people remember certain events more than others?",
      "speakAloud": true,
      "timeLimit": "2"
    },
    {
      "id": "events-p3-2",
      "type": "normal",
      "question": "How do you think technology has changed the way we remember events?",
      "speakAloud": true,
      "timeLimit": "3"
    },
    {
      "id": "events-p3-3",
      "type": "normal",
      "question": "Do you think it is important to celebrate special occasions?",
      "speakAloud": true,
      "timeLimit": "2"
    }
  ]'::jsonb,
  true,
  0
);

-- Sample Part 2 & 3 combinations
INSERT INTO part_combinations (title, description, topic, part2_id, part3_id, is_public, usage_count) VALUES
(
  'Hometown Complete',
  'Complete hometown topic with Part 2 description and Part 3 discussion',
  'Personal',
  (SELECT id FROM assignment_parts WHERE title = 'Describe Your Hometown'),
  (SELECT id FROM assignment_parts WHERE title = 'Hometown Discussion'),
  true,
  0
),
(
  'Reading Complete',
  'Complete reading topic with Part 2 book description and Part 3 literature discussion',
  'Entertainment',
  (SELECT id FROM assignment_parts WHERE title = 'Describe a Book You Enjoyed'),
  (SELECT id FROM assignment_parts WHERE title = 'Reading and Literature'),
  true,
  0
),
(
  'Life Events Complete',
  'Complete life events topic with Part 2 event description and Part 3 memory discussion',
  'Personal',
  (SELECT id FROM assignment_parts WHERE title = 'Describe a Memorable Event'),
  (SELECT id FROM assignment_parts WHERE title = 'Life Events and Memories'),
  true,
  0
); 