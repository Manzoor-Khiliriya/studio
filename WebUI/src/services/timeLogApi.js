import { apiSlice } from './apiSlice';

export const timeLogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // --- EMPLOYEE ENDPOINTS ---

    // Start/Resume Timer: POST /api/timelogs/start
    startTimer: builder.mutation({
      query: (body) => ({
        url: '/timelogs/start',
        method: 'POST',
        body, // Expects { taskId, userId }
      }),
      invalidatesTags: ['Task', 'TimeLog'], 
    }),

    // Stop Timer: POST /api/timelogs/stop
    stopTimer: builder.mutation({
      query: (body) => ({
        url: '/timelogs/stop',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task', 'TimeLog'],
    }),

    // Toggle Pause: POST /api/timelogs/pause
    togglePause: builder.mutation({
      query: (body) => ({
        url: '/timelogs/pause',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TimeLog'],
    }),

    // Get My Logs: GET /api/timelogs/my
    getMyLogs: builder.query({
      query: () => '/timelogs/my',
      providesTags: ['TimeLog'],
    }),


    // --- ADMIN ENDPOINTS ---

    // Daily Performance Report: GET /api/timelogs/report
    getDailyReport: builder.query({
      query: () => '/timelogs/report',
      providesTags: ['TimeLog'],
    }),

    // Employee Weekly Report: GET /api/timelogs/report/employee/:id
    getEmployeeWeeklyReport: builder.query({
      query: (id) => `/timelogs/report/employee/${id}`,
      providesTags: (result, error, id) => [{ type: 'TimeLog', id }],
    }),
  }),
});

export const {
  useStartTimerMutation,
  useStopTimerMutation,
  useTogglePauseMutation,
  useGetMyLogsQuery,
  useGetDailyReportQuery,
  useGetEmployeeWeeklyReportQuery,
} = timeLogApi;