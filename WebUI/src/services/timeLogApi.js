import { apiSlice } from './apiSlice';

export const timeLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. GET TODAY'S LOGS & ACTIVE STATUS
    getMyTodayLogs: builder.query({
      query: () => '/timelogs/my',
      providesTags: ['TimeLog'],
    }),

    // 2. START TIMER
    startTimer: builder.mutation({
      query: (taskId) => ({
        url: '/timelogs/start',
        method: 'POST',
        body: { taskId },
      }),
      invalidatesTags: ['TimeLog', 'Task', 'Project'], 
    }),

    // 3. TOGGLE PAUSE (Work <-> Break)
    togglePause: builder.mutation({
      query: () => ({
        url: '/timelogs/pause',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
    }),

    // 4. STOP TIMER
    stopTimer: builder.mutation({
      query: () => ({
        url: '/timelogs/stop',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
    }),

    // 5. GET TASK PERFORMANCE REPORT (Admin - Optimized for Projects)
    // Now accepts an object: { page, limit, search }
    getTaskPerformanceReport: builder.query({
      query: (params) => ({
        url: '/timelogs/report/tasks',
        params, // Automatically appends ?page=X&limit=Y&search=Z
      }),
      // Providing tags for both Projects and Tasks to ensure the report stays live
      providesTags: (result) =>
        result?.projects
          ? [
              ...result.projects.map(({ _id }) => ({ type: 'Project', id: _id })),
              { type: 'Project', id: 'REPORT_LIST' },
              { type: 'Task', id: 'REPORT_LIST' }
            ]
          : [{ type: 'Project', id: 'REPORT_LIST' }],
    }),

    // 6. EMPLOYEE WEEKLY REPORT
    getWeeklyReport: builder.query({
      query: (userId) => `/timelogs/report/employee/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'TimeLog', id: userId }],
    }),
  }),
});

export const {
  useGetMyTodayLogsQuery,
  useStartTimerMutation,
  useTogglePauseMutation,
  useStopTimerMutation,
  useGetTaskPerformanceReportQuery, // Use this with params in your component
  useGetWeeklyReportQuery,
} = timeLogApiSlice;