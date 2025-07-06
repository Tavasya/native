import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { App as MainApp } from '@/components/app';
import { APP_CONFIG_DEFAULTS } from '@/../app-config';
import { AppConfig } from '@/lib/types';
import { getAppConfig } from '../../lib/util_voice_agent';
import { ApplyThemeScript, ThemeToggle } from '@/components/theme-toggle';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/700.css';

function App() {
  const [appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG_DEFAULTS);

  useEffect(() => {
    // Get app config from environment or use defaults
    const loadAppConfig = async () => {
      try {
        const config = await getAppConfig();
        setAppConfig(config);
      } catch (error) {
        console.error('Error loading app config:', error);
        setAppConfig(APP_CONFIG_DEFAULTS);
      }
    };

    loadAppConfig();
  }, []);

  return (
    <div className="min-h-screen font-sans">
      <ApplyThemeScript />
      <header className="fixed top-0 left-0 z-50 hidden w-full flex-row justify-between p-6 md:flex">
       
    
      </header>
      
      <Routes>
        <Route path="/" element={<MainApp appConfig={appConfig} />} />
      </Routes>
      
      <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
        <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
      </div>
    </div>
  );
}

export default App;