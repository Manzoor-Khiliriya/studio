import { apiSlice } from './apiSlice';

export const timeLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. GET TODAY'S LOGS & ACTIVE STATUS
    // Matches: GET /api/timelogs/my
    getMyTodayLogs: builder.query({
      query: () => '/timelogs/my',
      providesTags: ['TimeLog'],
    }),

    // 2. START TIMER
    // Matches: POST /api/timelogs/start
    startTimer: builder.mutation({
      query: (taskId) => ({
        url: '/timelogs/start',
        method: 'POST',
        body: { taskId },
      }),
      // Invalidates TimeLog to refresh the log list, 
      // and Task because status might change to "In Progress"
      invalidatesTags: ['TimeLog', 'Task'],
    }),

    // 3. TOGGLE PAUSE (Work <-> Break)
    // Matches: POST /api/timelogs/pause
    togglePause: builder.mutation({
      query: () => ({
        url: '/timelogs/pause',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
    }),

    // 4. STOP TIMER
    // Matches: POST /api/timelogs/stop
    stopTimer: builder.mutation({
      query: () => ({
        url: '/timelogs/stop',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
    }),

    // 5. GET TASK PERFORMANCE REPORT (Admin)
    // Matches: GET /api/timelogs/report/tasks
    getTaskPerformanceReport: builder.query({
      query: () => '/timelogs/report/tasks',
      providesTags: ['TimeLog', 'Task'],
    }),

    // 6. EMPLOYEE WEEKLY REPORT (Admin or Self)
    // Matches: GET /api/timelogs/report/employee/:userId
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
  useGetTaskPerformanceReportQuery,
  useGetWeeklyReportQuery,
} = timeLogApiSlice;