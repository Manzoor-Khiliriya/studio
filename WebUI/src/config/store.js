import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../services/apiSlice';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    // Handles all server-side cached data
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // Handles local UI/Auth state
    auth: authReducer,
  },
  
  // Required for RTK-Query's caching and invalidation logic
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
    
  devTools: true,
});