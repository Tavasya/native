//Contains the global data
import { configureStore } from "@reduxjs/toolkit";
import authReducer from '@/features/auth/authSlice';

export const store = configureStore({ 
    reducer: {
        auth: authReducer,
        //classes: classesReducer
        //assingments: assingmentReducer
    } });
    
export type RootState = ReturnType<typeof store.getState>; //Auuto checks types of state for typescript
export type AppDispatch = typeof store.dispatch; 