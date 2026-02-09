import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token; // 🔥 from Redux state
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }

  }),
  // IMPORTANT: All tags must be defined here for auto-refreshing to work
  tagTypes: ['Task', 'User', 'Employee', 'TimeLog', 'Leave', 'Dashboard', 'Holiday', 'Notification'],
  endpoints: () => ({}), // Endpoints are injected from other files
});