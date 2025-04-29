// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';          // ← ADD ME
import './index.css';

import App from './App';
import { store } from '@/app/store';
import { loadSession } from '@/features/auth/authThunks';

// hydrate Redux with any saved Supabase session
store.dispatch(loadSession());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>                    {/* ← WRAPS THE WHOLE APP */}
      <App />
    </Provider>
  </StrictMode>
);
