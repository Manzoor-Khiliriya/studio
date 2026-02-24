import { apiSlice } from './apiSlice';

export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. Get Today's Status (Checks if already clocked in)
    getTodayStatus: builder.query({
      query: () => '/attendance/today',
      providesTags: ['Attendance'],
    }),

    // 2. Clock In
    clockIn: builder.mutation({
      query: () => ({
        url: '/attendance/clock-in',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),

    // 3. Clock Out
    clockOut: builder.mutation({
      query: () => ({
        url: '/attendance/clock-out',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),

    // 4. Get Attendance History (For a table/list)
    getAttendanceHistory: builder.query({
      query: (params) => ({
        url: '/attendance/history',
        params, // { page, limit, startDate, endDate }
      }),
      providesTags: (result) =>
        result?.history
          ? [
              ...result.history.map(({ _id }) => ({ type: 'Attendance', id: _id })),
              { type: 'Attendance', id: 'LIST' },
            ]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTodayStatusQuery,
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceHistoryQuery,
} = attendanceApiSlice;