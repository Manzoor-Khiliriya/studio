import { apiSlice } from './apiSlice';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // GET DASHBOARD SUMMARY
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard', 'Task', 'TimeLog', 'Leave'],
    }),

    // ADD THIS: PERMANENT CLEAR LOGS
    // Matches: DELETE /api/timelogs/clear-all
    clearLogs: builder.mutation({
      query: () => ({
        url: '/timelogs/clear-all',
        method: 'DELETE',
      }),
      // This tells RTK Query to refetch the summary, emptying the list immediately
      invalidatesTags: ['Dashboard', 'TimeLog'],
    }),

    stopAllSessions: builder.mutation({
      query: () => ({ url: '/timelogs/stop-all-live', method: 'DELETE' }),
      invalidatesTags: ['Dashboard', 'TimeLog'],
    }),

  }),
});

export const {
  useGetDashboardSummaryQuery,
  useClearLogsMutation, // Export the new hook
  useStopAllSessionsMutation
} = dashboardApiSlice;