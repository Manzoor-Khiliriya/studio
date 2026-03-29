import { apiSlice } from './apiSlice';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard', 'Task', 'TimeLog', 'Leave'],
    }),
    clearLogs: builder.mutation({
      // Accept 'body' which will contain { date: "YYYY-MM-DD" }
      query: (body) => ({
        url: '/timelogs/clear-all',
        method: 'POST',
        body, // This sends the date object to your controller
      }),
      invalidatesTags: ['Dashboard'],
    }),
    stopAllSessions: builder.mutation({
      query: () => ({
        url: '/timelogs/stop-all',
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