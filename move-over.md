# Multi-Domain Architecture Migration Plan
## Safe File Operations - Move First, Delete Later

### Overview
Split current single-domain app into:
- **Landing Page**: `nativespeaking.ai` (marketing site)
- **App**: `app.nativespeaking.ai` (full application)

### Phase 1: Create Directory Structure (Safe - No Deletion)

```bash
# Create new project directories
mkdir -p ../nativespeaking-landing
mkdir -p ../nativespeaking-app

# Create subdirectories in landing project
mkdir -p ../nativespeaking-landing/src/components
mkdir -p ../nativespeaking-landing/src/pages
mkdir -p ../nativespeaking-landing/src/pages/landing-page
mkdir -p ../nativespeaking-landing/src/pages/legal
mkdir -p ../nativespeaking-landing/public

# Create subdirectories in app project
mkdir -p ../nativespeaking-app/src/features
mkdir -p ../nativespeaking-app/src/pages
mkdir -p ../nativespeaking-app/src/pages/auth
mkdir -p ../nativespeaking-app/src/pages/student
mkdir -p ../nativespeaking-app/src/pages/teacher
mkdir -p ../nativespeaking-app/src/pages/onboarding
mkdir -p ../nativespeaking-app/src/components
mkdir -p ../nativespeaking-app/src/integrations
mkdir -p ../nativespeaking-app/src/integrations/supabase
mkdir -p ../nativespeaking-app/src/app
mkdir -p ../nativespeaking-app/src/utils
mkdir -p ../nativespeaking-app/src/hooks
mkdir -p ../nativespeaking-app/src/lib
mkdir -p ../nativespeaking-app/supabase
mkdir -p ../nativespeaking-app/public
```

### Phase 2: Copy Landing Page Files (Safe - No Deletion)

#### Landing Page Components
```bash
# Copy landing-specific components
cp src/components/LandingNavBar.tsx ../nativespeaking-landing/src/components/
cp src/components/HeroSection.tsx ../nativespeaking-landing/src/components/
cp src/components/UniversityLogos.tsx ../nativespeaking-landing/src/components/
cp src/components/FeaturesSection.tsx ../nativespeaking-landing/src/components/
cp src/components/TimeCalculator.tsx ../nativespeaking-landing/src/components/
cp src/components/Testimonials.tsx ../nativespeaking-landing/src/components/
cp src/components/Value.tsx ../nativespeaking-landing/src/components/
cp src/components/FAQSection.tsx ../nativespeaking-landing/src/components/
cp src/components/CTASection.tsx ../nativespeaking-landing/src/components/
cp src/components/Footer.tsx ../nativespeaking-landing/src/components/
```

#### Landing Page Pages
```bash
# Copy landing page
cp src/pages/landing-page/Index.tsx ../nativespeaking-landing/src/pages/landing-page/
cp src/pages/landing-page/landing.css ../nativespeaking-landing/src/pages/landing-page/

# Copy legal pages
cp src/pages/legal/TermsAndConditions.tsx ../nativespeaking-landing/src/pages/legal/
cp src/pages/legal/PrivacyPolicy.tsx ../nativespeaking-landing/src/pages/legal/
```

#### Landing Page Configuration Files
```bash
# Copy essential config files
cp package.json ../nativespeaking-landing/
cp vite.config.ts ../nativespeaking-landing/
cp tailwind.config.ts ../nativespeaking-landing/
cp postcss.config.cjs ../nativespeaking-landing/
cp tsconfig.json ../nativespeaking-landing/
cp tsconfig.app.json ../nativespeaking-landing/
cp tsconfig.node.json ../nativespeaking-landing/
cp index.html ../nativespeaking-landing/
cp .gitignore ../nativespeaking-landing/
cp eslint.config.js ../nativespeaking-landing/

# Copy public assets
cp -r public/* ../nativespeaking-landing/public/
```

### Phase 3: Copy App Files (Safe - No Deletion)

#### App Features
```bash
# Copy all auth features
cp -r src/features/auth ../nativespeaking-app/src/features/
```

#### App Pages
```bash
# Copy auth pages
cp -r src/pages/auth ../nativespeaking-app/src/pages/

# Copy student pages
cp -r src/pages/student ../nativespeaking-app/src/pages/

# Copy teacher pages
cp -r src/pages/teacher ../nativespeaking-app/src/pages/

# Copy onboarding pages
cp -r src/pages/onboarding ../nativespeaking-app/src/pages/
```

#### App Components (Exclude Landing Components)
```bash
# Copy all components except landing-specific ones
cp -r src/components/* ../nativespeaking-app/src/components/

# Remove landing components from app (safe - we have copies)
rm ../nativespeaking-app/src/components/LandingNavBar.tsx
rm ../nativespeaking-app/src/components/HeroSection.tsx
rm ../nativespeaking-app/src/components/UniversityLogos.tsx
rm ../nativespeaking-app/src/components/FeaturesSection.tsx
rm ../nativespeaking-app/src/components/TimeCalculator.tsx
rm ../nativespeaking-app/src/components/Testimonials.tsx
rm ../nativespeaking-app/src/components/Value.tsx
rm ../nativespeaking-app/src/components/FAQSection.tsx
rm ../nativespeaking-app/src/components/CTASection.tsx
rm ../nativespeaking-app/src/components/Footer.tsx
```

#### App Integrations
```bash
# Copy Supabase integration
cp -r src/integrations/supabase ../nativespeaking-app/src/integrations/
```

#### App Configuration
```bash
# Copy app-specific config files
cp package.json ../nativespeaking-app/
cp vite.config.ts ../nativespeaking-app/
cp tailwind.config.ts ../nativespeaking-app/
cp postcss.config.cjs ../nativespeaking-app/
cp tsconfig.json ../nativespeaking-app/
cp tsconfig.app.json ../nativespeaking-app/
cp tsconfig.node.json ../nativespeaking-app/
cp index.html ../nativespeaking-app/
cp .gitignore ../nativespeaking-app/
cp eslint.config.js ../nativespeaking-app/

# Copy Supabase config
cp -r supabase ../nativespeaking-app/

# Copy public assets
cp -r public/* ../nativespeaking-app/public/
```

#### App Core Files
```bash
# Copy core app files
cp src/App.tsx ../nativespeaking-app/src/
cp src/main.tsx ../nativespeaking-app/src/
cp src/index.css ../nativespeaking-app/src/
cp -r src/app ../nativespeaking-app/src/
cp -r src/utils ../nativespeaking-app/src/
cp -r src/hooks ../nativespeaking-app/src/
cp -r src/lib ../nativespeaking-app/src/
cp -r src/routes ../nativespeaking-app/src/
```

### Phase 4: Create Landing Page App.tsx

```typescript:../nativespeaking-landing/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/landing-page/Index';
import TermsAndConditions from './pages/legal/TermsAndConditions';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/legal/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Phase 5: Create Landing Page main.tsx

```typescript:../nativespeaking-landing/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Phase 6: Update Landing Page CTASection

```typescript:../nativespeaking-landing/src/components/CTASection.tsx
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-brand-secondary to-brand-primary text-white">
      <div className="container text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Help Your Students <br/>Speak Better English?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of teachers saving time and improving student results with Native.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              className="bg-white text-brand-secondary hover:bg-white/90 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all" 
              onClick={() => window.location.href = "https://app.nativespeaking.ai/sign-up"}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
```

### Phase 7: Update App Routes (Remove Landing)

```typescript:../nativespeaking-app/src/routes/index.tsx
// Remove landing page route and redirect root to login
export default function AppRoutes() {
  return ( 
    <Suspense fallback={<EnhancedLoadingSpinner />}>
      <Routes>
        {/* Redirect root to login - landing page is on different domain */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Keep all existing app routes */}
        <Route path="/login" element={<NewLogin />} />
        <Route path="/sign-up" element={<SignUpSimple />} />
        // ... rest of existing routes
      </Routes>
    </Suspense>
  );
}
```

### Phase 8: Create Landing Page package.json

```json:../nativespeaking-landing/package.json
{
  "name": "nativespeaking-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### Phase 9: Create App package.json

```json:../nativespeaking-app/package.json
{
  "name": "nativespeaking-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^1.9.7",
    "@supabase/supabase-js": "^2.38.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.3",
    "react-router-dom": "^6.8.1",
    "redux-persist": "^6.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "jest": "^29.7.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### Phase 10: Create Landing Page vercel.json

```json:../nativespeaking-landing/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Phase 11: Create App vercel.json

```json:../nativespeaking-app/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Phase 12: Environment Variables

#### Landing Page (.env)
```bash:../nativespeaking-landing/.env
VITE_APP_URL=https://app.nativespeaking.ai
```

#### App (.env)
```bash:../nativespeaking-app/.env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_LANDING_URL=https://nativespeaking.ai
```

### Phase 13: Test Both Projects

```bash
# Test landing page
cd ../nativespeaking-landing
npm install
npm run dev

# Test app (in new terminal)
cd ../nativespeaking-app
npm install
npm run dev
```

### Phase 14: Deploy to Vercel

1. **Deploy Landing Page:**
   - Connect `nativespeaking.ai` domain
   - Deploy from `../nativespeaking-landing`

2. **Deploy App:**
   - Connect `app.nativespeaking.ai` subdomain
   - Deploy from `../nativespeaking-app`

### Phase 15: Verification (Before Deletion)

1. ✅ Landing page loads at `nativespeaking.ai`
2. ✅ App loads at `app.nativespeaking.ai`
3. ✅ Navigation between domains works
4. ✅ Authentication works in app
5. ✅ All features work in app

### Phase 16: Cleanup (Only After Verification)

```bash
# Only after everything is working and deployed
# Archive original project
mv native-3 native-3-archive

# Or delete if confident
# rm -rf native-3
```

### Safety Notes

- ✅ All files are **copied** first, never moved
- ✅ Original project remains intact until verification
- ✅ Each phase can be tested independently
- ✅ Rollback is possible at any point
- ✅ No data loss risk

### Rollback Plan

If anything goes wrong:
```bash
# Restore from original
cp -r native-3-archive native-3-restored
cd native-3-restored
npm install
npm run dev
```

### Next Steps After Migration

1. Set up cookie sharing between domains
2. Configure CORS for API calls
3. Set up analytics tracking across domains
4. Configure email templates with correct URLs 