import { apiSlice } from './apiSlice';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // GET DASHBOARD SUMMARY
    // Matches: GET /api/dashboard/summary
    // This provides a combined view for both Admin and Employee
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      // This endpoint depends on almost all major data types
      providesTags: ['Dashboard', 'Task', 'TimeLog', 'Leave'],
    }),

  }),
});

export const {
  useGetDashboardSummaryQuery,
} = dashboardApiSlice;