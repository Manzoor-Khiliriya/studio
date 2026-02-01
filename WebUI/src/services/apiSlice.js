import axios from "axios";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


const API = axios.create({
  baseUrl: import.meta.env.VITE_API_BASE_URL
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers) => {
      // Pull token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // IMPORTANT: All tags must be defined here for auto-refreshing to work
  tagTypes: ['Task', 'User', 'TimeLog', 'Leave', 'Dashboard', 'Holiday'],
  endpoints: () => ({}), // Endpoints are injected from other files
});