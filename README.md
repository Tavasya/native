# Native - AI-Powered Speaking Assessment Platform

**Native** is an intelligent educational platform that revolutionizes language learning by providing automated speaking assessments with detailed AI-powered feedback. Designed specifically for IELTS, TOEFL, and TOEIC test preparation, Native helps English teachers deliver comprehensive speaking evaluations while dramatically reducing grading workload.

## 🎯 What Native Does

Native automates the complex process of evaluating student speaking assignments by analyzing four critical language competencies:

- **🗣️ Fluency**: Speech flow analysis, coherence metrics, and words-per-minute tracking
- **📢 Pronunciation**: Phoneme-level accuracy scoring with critical error identification
- **📝 Grammar**: Automated error detection with detailed corrections and explanations
- **📚 Vocabulary**: Lexical complexity analysis with enhancement suggestions

## 👥 User Roles & Workflows

### 👩‍🏫 Teachers
**Streamline assessment with powerful tools:**
- **Class Management**: Create classes with unique join codes
- **Assignment Creation**: Design custom speaking tasks with flexible question types
- **Template Library**: Save and reuse assignment templates across classes
- **Progress Analytics**: Monitor student performance and completion rates
- **AI Review**: Verify automated scores and add personalized feedback
- **Bulk Operations**: Efficiently manage multiple classes and assignments

### 🎓 Students
**Practice and improve with instant feedback:**
- **Easy Enrollment**: Join classes using teacher-provided codes
- **Browser Recording**: Record responses directly in the browser (no downloads)
- **Real-time Feedback**: Receive detailed analysis across all four criteria
- **Progress Tracking**: Monitor improvement over time with comprehensive metrics
- **Test Simulation**: Practice with authentic IELTS/TOEFL/TOEIC formats
- **Audio Playback**: Review recordings with pronunciation guidance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd native-3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file with required environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLOUD_API_KEY=your_google_cloud_key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 🏗️ Architecture Overview

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Redux Toolkit with persistence
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **Routing**: React Router with role-based route protection
- **Audio Processing**: WebM recording with real-time visualization

### Backend Services
- **Database**: Supabase (PostgreSQL) for user data and assignments
- **Authentication**: Supabase Auth with role-based access control
- **File Storage**: Google Cloud Storage for audio recordings
- **AI Services**: Custom transcription and analysis endpoints
- **TTS Integration**: Google Cloud Text-to-Speech API

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui component library
│   ├── student/         # Student-specific components
│   ├── teacher/         # Teacher dashboard components
│   └── assignment/      # Assignment flow components
├── features/            # Redux slices and services
│   ├── auth/           # Authentication logic
│   ├── assignments/    # Assignment management
│   ├── submissions/    # Recording and feedback
│   └── classes/        # Class management
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
└── utils/              # Utility functions
```

## 🛠️ Development

### Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Create production build
- **`npm run lint`** - Run ESLint for code quality
- **`npm run preview`** - Preview production build locally

### Testing

The platform uses Playwright for comprehensive end-to-end testing:

```bash
# Run E2E tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed
```

### Code Conventions

- **TypeScript**: Strict type checking enabled throughout
- **Component Structure**: Functional components with hooks
- **State Management**: Redux Toolkit with typed selectors
- **Styling**: Tailwind CSS with component variants
- **File Naming**: kebab-case for files, PascalCase for components

## 🔧 Key Features

### Audio Recording & Analysis
- **Browser-based Recording**: No plugins or downloads required
- **Real-time Visualization**: Audio waveform during recording
- **Format Validation**: Automatic WebM validation and repair
- **Cloud Processing**: Scalable audio analysis pipeline
- **Quality Assurance**: Corrupted file detection and recovery

### Educational Assessment
- **Multi-criteria Scoring**: Comprehensive language competency analysis
- **Test Preparation**: IELTS/TOEFL/TOEIC specific question formats
- **Adaptive Feedback**: Personalized improvement suggestions
- **Progress Analytics**: Long-term learning trajectory tracking
- **Template System**: Reusable assignment structures

### User Experience
- **Role-based Access**: Secure teacher/student separation
- **Responsive Design**: Mobile-first approach for all devices
- **Progressive Loading**: Optimized performance with lazy loading
- **Accessibility**: WCAG compliant with screen reader support
- **Real-time Updates**: Live submission status and notifications

## 🚢 Deployment

### Production Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Configure production environment variables
3. **Deploy**: Automatic deployment on push to main branch

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x
- **Framework**: Static Site (SPA)

### Environment Variables

Required for production deployment:
```env
VITE_SUPABASE_URL=production_supabase_url
VITE_SUPABASE_ANON_KEY=production_supabase_key
VITE_GOOGLE_CLOUD_API_KEY=production_google_cloud_key
```

## 📊 Educational Impact

Native addresses critical challenges in language education:

- **⏱️ Time Efficiency**: Reduces teacher grading time by 70-80%
- **📈 Consistency**: Provides objective, standardized scoring
- **🔄 Scalability**: Enables frequent practice without teacher bottleneck
- **📋 Actionable Feedback**: Students receive specific improvement guidance
- **📊 Data-Driven**: Evidence-based progress tracking and insights

## 🎯 Target Use Cases

- **IELTS Preparation**: Official speaking test simulation with band scoring
- **TOEFL Speaking**: Academic speaking task practice with rubric alignment
- **TOEIC Assessment**: Business English communication evaluation
- **ESL Instruction**: General conversation practice and fluency building
- **Formative Assessment**: Regular classroom speaking evaluations

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation wiki

## Improved Transcript Feature

The improved transcript feature allows users to view an enhanced version of their original transcript. The enhanced version shows more sophisticated vocabulary and grammar structures.

### How it works

1. **Toggle Button**: When viewing feedback for a submission, if an improved transcript is available, a "Show Improved" button with a sparkles icon appears in the transcript section.

2. **Enhanced Display**: When toggled on, the transcript shows:
   - The improved version of the text
   - A visual indicator showing the band level improvement (e.g., B2 → C1)
   - A note explaining this is an enhanced version

3. **Data Structure**: The improved transcript data should be included in the submission JSON under:
   ```json
   {
     "section_feedback": {
       "paragraph_restructuring": {
         "target_band": "C1",
         "original_band": "B2", 
         "improved_transcript": "Enhanced version of the transcript..."
       }
     }
   }
   ```

### Features

- **Lightweight Toggle**: Simple button to switch between original and improved versions
- **Visual Indicators**: Clear labeling and visual cues for the enhanced version
- **Responsive Design**: Works on both desktop and mobile interfaces
- **Backwards Compatible**: Gracefully handles submissions without improved transcripts

### Usage

The feature automatically detects when improved transcript data is available and shows the toggle button. Users can click to switch between versions at any time while viewing their feedback.

---

**Native** - Transforming language education through intelligent assessment technology.