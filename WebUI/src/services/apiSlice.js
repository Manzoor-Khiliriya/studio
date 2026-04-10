import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL + "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }

  }),
  tagTypes: ['Task', 'Project', 'Attendance', 'User', 'Employee', 'TimeLog', 'Leave', 'Dashboard', 'Holiday', 'Notification'],
  endpoints: () => ({}),
});