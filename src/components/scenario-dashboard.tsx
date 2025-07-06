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

const scenarios: Scenario[] = [
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
    id: 'job-interview',
    name: 'Job Interview',
    level: 'INTERMEDIATE',
    description: 'Practice job interview skills with dynamic conversations',
    greeting: 'Tell me about your previous work experience.',
    instructions: 'You are a professional interviewer. Ask follow-up questions about work experience, skills, and career goals. Adapt to the candidate\'s responses naturally.',
    turns: 5,
    icon: '💼',
    conversationScript: [
      {
        turn: 1,
        agent: 'Tell me about your previous work experience.',
        suggestedResponse: 'I worked at [company] for [time period] as a [position]...'
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Conversation Practice Scenarios
        </h1>
        <p className="text-gray-600">
          Choose a scenario to practice your English conversation skills with AI guidance
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedScenario?.id === scenario.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            } ${
              hoveredScenario === scenario.id ? 'scale-105' : ''
            }`}
            onMouseEnter={() => setHoveredScenario(scenario.id)}
            onMouseLeave={() => setHoveredScenario(null)}
            onClick={() => onScenarioSelect(scenario)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{scenario.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getLevelColor(scenario.level)}>
                        {scenario.level}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ~{scenario.turns} turns
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="text-sm mb-4">
                {scenario.description}
              </CardDescription>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Opening line:
                </p>
                <p className="text-sm text-gray-600 italic">
                  "{scenario.greeting}"
                </p>
              </div>
              
              {selectedScenario?.id === scenario.id && (
                <Button className="w-full" size="sm">
                  Selected ✓
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedScenario && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            Selected: {selectedScenario.name}
          </h3>
          <p className="text-blue-800 text-sm">
            Click "Start Conversation" below to begin practicing with this scenario.
          </p>
        </div>
      )}
    </div>
  );
}