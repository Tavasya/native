//Contains the global data
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@/features/auth/authSlice';
import classReducer from '@/features/class/classSlice'
import assignmentReducer from '@/features/assignments/assignmentSlice'
import submissionsReducer from '@/features/submissions/submissionsSlice'
import assignmentTemplateReducer from '@/features/assignmentTemplates/assignmentTemplateSlice'
import ttsReducer from '@/features/tts/ttsSlice'
import metricsReducer from '@/features/metrics/metricsSlice'

// Configure persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  classes: classReducer,
  assignments: assignmentReducer,
  submissions: submissionsReducer,
  assignmentTemplates: assignmentTemplateReducer,
  tts: ttsReducer,
  metrics: metricsReducer,
});

// Create a root reducer that handles clearing all state
const rootReducerWithReset = (state: any, action: any) => {
  if (action.type === 'auth/clearAuth') {
    // Reset all state to initial values
    return {
      auth: authReducer(undefined, action),
      classes: classReducer(undefined, action),
      assignments: assignmentReducer(undefined, action),
      submissions: submissionsReducer(undefined, action),
      assignmentTemplates: assignmentTemplateReducer(undefined, action),
      tts: ttsReducer(undefined, action),
      metrics: metricsReducer(undefined, action),
    };
  }
  return rootReducer(state, action);
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducerWithReset);

// Configure store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>; //Auuto checks types of state for typescript
export type AppDispatch = typeof store.dispatch; 