import { apiSlice } from './apiSlice';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. GET DASHBOARD SUMMARY
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      // Refresh when any of these change
      providesTags: ['Dashboard', 'Task', 'TimeLog', 'Leave'],
    }),

    // 2. CLEAR OPERATIONAL LOGS
    // Backend: exports.clearAllLogs (TimeLog controller)
   // Inside dashboardApiSlice.js
clearLogs: builder.mutation({
  query: () => ({
    url: '/timelogs/clear-all', // Updated to match router
    method: 'POST',
  }),
  invalidatesTags: ['Dashboard'],
}),

stopAllSessions: builder.mutation({
  query: () => ({ 
    url: '/timelogs/stop-all', // Updated to match router
    method: 'POST', 
  }),
  invalidatesTags: ['Dashboard', 'TimeLog'],
}),

  }),
});

export const {
  useGetDashboardSummaryQuery,
  useClearLogsMutation,
  useStopAllSessionsMutation
} = dashboardApiSlice;