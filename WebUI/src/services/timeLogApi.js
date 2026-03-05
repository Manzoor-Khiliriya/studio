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
  useGetWeeklyReportQuery,
} = timeLogApiSlice;