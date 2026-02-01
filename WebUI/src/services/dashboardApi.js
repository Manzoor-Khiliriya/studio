import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // GET DASHBOARD SUMMARY
    // Matches: GET /api/dashboard/summary
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      // We provide 'Task', 'User', and 'Leave' tags because if any of those 
      // change, the summary numbers (counts/stats) need to be refreshed.
      providesTags: ['Task', 'User', 'Leave', 'TimeLog'],
    }),

  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;