import { apiSlice } from './apiSlice';

export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getTodayStatus: builder.query({
      query: () => '/attendance/today',
      providesTags: ['Attendance'],
    }),
    clockIn: builder.mutation({
      query: () => ({
        url: '/attendance/clock-in',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),
    clockOut: builder.mutation({
      query: () => ({
        url: '/attendance/clock-out',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceHistory: builder.query({
      query: (params) => ({
        url: '/attendance/history',
        params,
      }),
      providesTags: (result) =>
        result?.history
          ? [
            ...result.history.map(({ _id }) => ({ type: 'Attendance', id: _id })),
            { type: 'Attendance', id: 'LIST' },
          ]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({
        url: '/attendance/admin/all',
        params,
      }),
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetTodayStatusQuery,
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceHistoryQuery,
  useGetAllAttendanceQuery, // Export this new hook
} = attendanceApiSlice;