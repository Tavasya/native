import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface ConversationTurn {
  turn: number;
  agent: string;
  suggestedResponse?: string;
}

export interface Scenario {
  id: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
  greeting: string;
  instructions: string;
  turns: number;
  icon: string;
  conversationScript: ConversationTurn[];
}

export const scenarios: Scenario[] = [
  {
    id: 'coffee-corner',
    name: 'Coffee Corner',
    level: 'BEGINNER',
    description: 'Practice ordering coffee with guided prompts and suggestions',
    greeting: 'Hi! Welcome to Coffee Corner. What can I get for you today?',
    instructions: 'You are a friendly coffee shop barista. Follow the exact script for guided practice. Guide the customer through ordering coffee step by step.',
    turns: 5,
    icon: '☕',
    conversationScript: [
      {
        turn: 1,
        agent: 'Hi! Welcome to Coffee Corner. What can I get for you today?',
        suggestedResponse: 'I want a coffee, please'
      },
      {
        turn: 2,
        agent: 'Great! What size would you like - small, medium, or large?',
        suggestedResponse: 'Medium, please'
      },
      {
        turn: 3,
        agent: 'Perfect! Would you like anything else? We have muffins and sandwiches.',
        suggestedResponse: 'How much is a muffin?'
      },
      {
        turn: 4,
        agent: 'The blueberry muffin is $3 and the chocolate chip is $3.50.',
        suggestedResponse: 'I\'ll take the blueberry muffin'
      },
      {
        turn: 5,
        agent: 'Excellent! That\'s one medium coffee and one blueberry muffin. That\'ll be $8.50 total.',
        suggestedResponse: 'Here you go'
      }
    ]
  },
  {
    id: 'restaurant-visit',
    name: 'Restaurant Visit',
    level: 'BEGINNER',
    description: 'Learn to order food and interact with restaurant staff',
    greeting: 'Good evening! Welcome to our restaurant. How many people are in your party?',
    instructions: 'You are a friendly restaurant host and waiter. Help the customer with seating, menu questions, and taking their order.',
    turns: 5,
    icon: '🍽️',
    conversationScript: [
      {
        turn: 1,
        agent: 'Good evening! Welcome to our restaurant. How many people are in your party?',
        suggestedResponse: 'Table for two, please'
      },
      {
        turn: 2,
        agent: 'Perfect! Right this way. Here are your menus. Can I start you with something to drink?',
        suggestedResponse: 'Two glasses of water, please'
      },
      {
        turn: 3,
        agent: 'Of course! Are you ready to order, or do you need a few more minutes?',
        suggestedResponse: 'What do you recommend?'
      },
      {
        turn: 4,
        agent: 'Our pasta special is very popular, and the grilled salmon is excellent tonight.',
        suggestedResponse: 'I\'ll have the pasta special'
      },
      {
        turn: 5,
        agent: 'Great choice! And for your companion?',
        suggestedResponse: 'They\'ll have the salmon, please'
      }
    ]
  },
  {
    id: 'shopping-mall',
    name: 'Shopping Mall',
    level: 'BEGINNER',
    description: 'Practice asking for help and making purchases',
    greeting: 'Hi there! Can I help you find anything today?',
    instructions: 'You are a helpful sales assistant. Help customers find products, answer questions about sizes and prices.',
    turns: 5,
    icon: '🛍️',
    conversationScript: [
      {
        turn: 1,
        agent: 'Hi there! Can I help you find anything today?',
        suggestedResponse: 'I\'m looking for a birthday gift'
      },
      {
        turn: 2,
        agent: 'How nice! What kind of gift are you thinking of? For a man or woman?',
        suggestedResponse: 'For my sister'
      },
      {
        turn: 3,
        agent: 'Wonderful! How about this nice scarf or maybe some jewelry?',
        suggestedResponse: 'How much is the scarf?'
      },
      {
        turn: 4,
        agent: 'This one is $25, and it comes in three colors - blue, red, or green.',
        suggestedResponse: 'I\'ll take the blue one'
      },
      {
        turn: 5,
        agent: 'Excellent choice! Would you like me to gift wrap it for you?',
        suggestedResponse: 'Yes, please'
      }
    ]
  },
  {
    id: 'doctors-appointment',
    name: 'Doctor\'s Appointment',
    level: 'BEGINNER',
    description: 'Learn to describe symptoms and book appointments',
    greeting: 'Good morning! How can I help you today?',
    instructions: 'You are a receptionist and doctor. Help the patient schedule an appointment and discuss their health concerns.',
    turns: 5,
    icon: '🏥',
    conversationScript: [
      {
        turn: 1,
        agent: 'Good morning! How can I help you today?',
        suggestedResponse: 'I\'d like to make an appointment'
      },
      {
        turn: 2,
        agent: 'Of course! What seems to be the problem?',
        suggestedResponse: 'I have a headache and feel tired'
      },
      {
        turn: 3,
        agent: 'I see. How long have you been feeling this way?',
        suggestedResponse: 'About three days'
      },
      {
        turn: 4,
        agent: 'We have an opening this afternoon at 2 PM. Does that work for you?',
        suggestedResponse: 'Yes, that\'s perfect'
      },
      {
        turn: 5,
        agent: 'Great! I have you down for 2 PM today. Please arrive 15 minutes early.',
        suggestedResponse: 'Thank you very much'
      }
    ]
  },
  {
    id: 'hotel-checkin',
    name: 'Hotel Check-in',
    level: 'BEGINNER',
    description: 'Practice hotel conversations and making requests',
    greeting: 'Welcome to Grand Hotel! How may I assist you today?',
    instructions: 'You are a hotel receptionist. Help guests with check-in, room preferences, and hotel amenities.',
    turns: 5,
    icon: '🏨',
    conversationScript: [
      {
        turn: 1,
        agent: 'Welcome to Grand Hotel! How may I assist you today?',
        suggestedResponse: 'I have a reservation under Smith'
      },
      {
        turn: 2,
        agent: 'Yes, I see your reservation here. You\'re staying for two nights, correct?',
        suggestedResponse: 'That\'s right'
      },
      {
        turn: 3,
        agent: 'Perfect! I have a room on the 5th floor with a city view. Is that acceptable?',
        suggestedResponse: 'Do you have anything higher up?'
      },
      {
        turn: 4,
        agent: 'Certainly! I can give you a room on the 8th floor with a great view.',
        suggestedResponse: 'That sounds perfect'
      },
      {
        turn: 5,
        agent: 'Wonderful! Here are your key cards. Breakfast is served until 10 AM.',
        suggestedResponse: 'Thank you very much'
      }
    ]
  },
  {
    id: 'public-transport',
    name: 'Public Transport',
    level: 'BEGINNER',
    description: 'Learn to ask for directions and buy tickets',
    greeting: 'Hello! Can I help you with tickets or directions?',
    instructions: 'You are a helpful station assistant. Help passengers with tickets, schedules, and directions.',
    turns: 5,
    icon: '🚌',
    conversationScript: [
      {
        turn: 1,
        agent: 'Hello! Can I help you with tickets or directions?',
        suggestedResponse: 'I need to get to the airport'
      },
      {
        turn: 2,
        agent: 'Sure! You\'ll need to take the blue line to Central Station, then transfer to the airport express.',
        suggestedResponse: 'How much does it cost?'
      },
      {
        turn: 3,
        agent: 'A single ticket is $4.50, or you can get a day pass for $12.',
        suggestedResponse: 'I\'ll take a single ticket'
      },
      {
        turn: 4,
        agent: 'Here you go! The next train leaves in 8 minutes from platform 2.',
        suggestedResponse: 'How long does the journey take?'
      },
      {
        turn: 5,
        agent: 'About 45 minutes total, including the transfer. Have a safe trip!',
        suggestedResponse: 'Thank you for your help'
      }
    ]
  },
  {
    id: 'bank-visit',
    name: 'Bank Visit',
    level: 'BEGINNER',
    description: 'Practice banking conversations and transactions',
    greeting: 'Good afternoon! Welcome to City Bank. How can I help you today?',
    instructions: 'You are a bank teller. Help customers with deposits, withdrawals, and account questions.',
    turns: 5,
    icon: '🏦',
    conversationScript: [
      {
        turn: 1,
        agent: 'Good afternoon! Welcome to City Bank. How can I help you today?',
        suggestedResponse: 'I\'d like to withdraw some money'
      },
      {
        turn: 2,
        agent: 'Certainly! Do you have your bank card and ID with you?',
        suggestedResponse: 'Yes, here they are'
      },
      {
        turn: 3,
        agent: 'Thank you. How much would you like to withdraw today?',
        suggestedResponse: 'Two hundred dollars, please'
      },
      {
        turn: 4,
        agent: 'Perfect! Would you like that in twenties or mixed bills?',
        suggestedResponse: 'Mixed bills, please'
      },
      {
        turn: 5,
        agent: 'Here you go - $200. Your remaining balance is $1,350. Anything else today?',
        suggestedResponse: 'No, that\'s all. Thank you'
      }
    ]
  },
  {
    id: 'grocery-store',
    name: 'Grocery Store',
    level: 'BEGINNER',
    description: 'Learn to ask about products and prices',
    greeting: 'Hi! Welcome to Fresh Market. Can I help you find anything?',
    instructions: 'You are a grocery store employee. Help customers find products and answer questions about prices and freshness.',
    turns: 5,
    icon: '🛒',
    conversationScript: [
      {
        turn: 1,
        agent: 'Hi! Welcome to Fresh Market. Can I help you find anything?',
        suggestedResponse: 'Where can I find the milk?'
      },
      {
        turn: 2,
        agent: 'The dairy section is at the back of the store, aisle 7. Are you looking for any particular type?',
        suggestedResponse: 'Just regular whole milk'
      },
      {
        turn: 3,
        agent: 'Perfect! We have several brands. The store brand is $3.99 and the organic is $5.49.',
        suggestedResponse: 'I\'ll take the store brand'
      },
      {
        turn: 4,
        agent: 'Great choice! Is there anything else you need help finding today?',
        suggestedResponse: 'Where is the bread section?'
      },
      {
        turn: 5,
        agent: 'The bakery and bread section is right up front, aisle 1. Fresh bread comes out at 2 PM!',
        suggestedResponse: 'Perfect, thank you'
      }
    ]
  },
  {
    id: 'phone-call',
    name: 'Phone Call',
    level: 'BEGINNER',
    description: 'Practice making and receiving phone calls',
    greeting: 'Hello, this is Sarah from City Services. How can I help you?',
    instructions: 'You are a customer service representative. Help callers with their questions and requests professionally.',
    turns: 5,
    icon: '📞',
    conversationScript: [
      {
        turn: 1,
        agent: 'Hello, this is Sarah from City Services. How can I help you?',
        suggestedResponse: 'Hi, I have a question about my bill'
      },
      {
        turn: 2,
        agent: 'I\'d be happy to help with that. Can I get your account number, please?',
        suggestedResponse: 'Yes, it\'s 12345678'
      },
      {
        turn: 3,
        agent: 'Thank you. I see your account here. What specific question did you have about your bill?',
        suggestedResponse: 'Why is it higher this month?'
      },
      {
        turn: 4,
        agent: 'I see the increase is due to additional usage last month. Your usage was 20% higher than usual.',
        suggestedResponse: 'Oh, that makes sense. Thank you'
      },
      {
        turn: 5,
        agent: 'You\'re welcome! Is there anything else I can help you with today?',
        suggestedResponse: 'No, that\'s all. Have a good day'
      }
    ]
  },
  {
    id: 'weather-chat',
    name: 'Weather Chat',
    level: 'BEGINNER',
    description: 'Learn to discuss weather and make small talk',
    greeting: 'Beautiful day today, isn\'t it?',
    instructions: 'You are having a casual conversation about weather. Keep it light and friendly, typical small talk.',
    turns: 5,
    icon: '🌤️',
    conversationScript: [
      {
        turn: 1,
        agent: 'Beautiful day today, isn\'t it?',
        suggestedResponse: 'Yes, it\'s lovely and sunny'
      },
      {
        turn: 2,
        agent: 'Perfect weather for a walk in the park. Have you been outside much today?',
        suggestedResponse: 'Not yet, but I\'m planning to'
      },
      {
        turn: 3,
        agent: 'That sounds nice! I heard it might rain tomorrow though.',
        suggestedResponse: 'Really? I hadn\'t heard that'
      },
      {
        turn: 4,
        agent: 'Yes, the forecast shows thunderstorms in the afternoon. Better enjoy today!',
        suggestedResponse: 'I definitely will. Thanks for letting me know'
      },
      {
        turn: 5,
        agent: 'You\'re welcome! Hope you have a wonderful day outside.',
        suggestedResponse: 'You too! Take care'
      }
    ]
  }
];

interface ScenarioDashboardProps {
  onScenarioSelect: (scenario: Scenario) => void;
  selectedScenario?: Scenario;
}

export function ScenarioDashboard({ onScenarioSelect, selectedScenario }: ScenarioDashboardProps) {
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
          Conversation Practice Scenarios
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Choose a scenario to practice your English conversation skills with AI guidance and real-time feedback
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
              selectedScenario?.id === scenario.id 
                ? 'ring-2 ring-primary ring-offset-2 shadow-xl border-primary/30 bg-primary/5' 
                : 'hover:shadow-lg hover:border-primary/20 border-border'
            } ${
              hoveredScenario === scenario.id ? 'scale-[1.02] -translate-y-1' : ''
            }`}
            onMouseEnter={() => setHoveredScenario(scenario.id)}
            onMouseLeave={() => setHoveredScenario(null)}
            onClick={() => onScenarioSelect(scenario)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {scenario.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {scenario.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getLevelColor(scenario.level)} variant="secondary">
                        {scenario.level}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        ~{scenario.turns} turns
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-base leading-relaxed">
                {scenario.description}
              </CardDescription>
              
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Opening line:
                </p>
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{scenario.greeting}"
                </p>
              </div>
              
              {selectedScenario?.id === scenario.id ? (
                <Button className="w-full" size="sm" variant="default">
                  <span className="mr-2">✓</span>
                  Selected
                </Button>
              ) : (
                <Button className="w-full" size="sm" variant="outline" 
                       onClick={(e) => { e.stopPropagation(); onScenarioSelect(scenario); }}>
                  Select Scenario
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedScenario && (
        <Card className="mt-8 border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="default" className="text-sm px-3 py-1">
                Ready to Start
              </Badge>
              <span className="text-lg">{selectedScenario.icon}</span>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              {selectedScenario.name}
            </h3>
            <p className="text-muted-foreground">
              Click "Start Conversation" below to begin practicing with this scenario.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}