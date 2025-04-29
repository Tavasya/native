//Contains the global data
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({ reducer: {} }); //Reducers will go here
export type RootState = ReturnType<typeof store.getState>; //Auuto checks types of state for typescript
export type AppDispatch = typeof store.dispatch; 