import { apiSlice } from './apiSlice';

export const timeLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getMyTodayLogs: builder.query({
      query: () => '/timelogs/my',
      providesTags: ['TimeLog'],
    }),

    startTimer: builder.mutation({
      query: (taskId) => ({
        url: '/timelogs/start',
        method: 'POST',
        body: { taskId },
      }),
      invalidatesTags: ['TimeLog', 'Task', 'Project'], 
    }),

    togglePause: builder.mutation({
      query: () => ({
        url: '/timelogs/pause',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
    }),

    stopTimer: builder.mutation({
      query: () => ({
        url: '/timelogs/stop',
        method: 'POST',
      }),
      invalidatesTags: ['TimeLog'],
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