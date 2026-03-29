import { apiSlice } from './apiSlice';

export const leaveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getMyLeaves: builder.query({
      query: (params) => ({
        url: '/leaves/my-leaves',
        params,
      }),
      providesTags: (result) =>
        result?.history
          ? [
            ...result.history.map(({ _id }) => ({ type: 'Leave', id: _id })),
            { type: 'Leave', id: 'PARTIAL-LIST' },
          ]
          : [{ type: 'Leave', id: 'PARTIAL-LIST' }],
    }),

    applyLeave: builder.mutation({
      query: (newLeave) => ({
        url: '/leaves/apply',
        method: 'POST',
        body: newLeave,
      }),
      invalidatesTags: [
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: "Leave", id: "CALENDAR" }
      ],

    }),
    updateLeave: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/leaves/update/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: 'Leave', id: 'ADMIN-LIST' },
        { type: 'Leave', id: 'CALENDAR' }
      ],
    }),
    deleteLeave: builder.mutation({
      query: (id) => ({
        url: `/leaves/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: 'Leave', id: 'ADMIN-LIST' },
        { type: 'Leave', id: 'CALENDAR' }
      ],
    }),
    getAllLeaves: builder.query({
      query: (params) => ({
        url: '/leaves/all',
        params,
      }),
      providesTags: (result) =>
        result?.leaves
          ? [
            ...result.leaves.map(({ _id }) => ({ type: 'Leave', id: _id })),
            { type: 'Leave', id: 'ADMIN-LIST' },
            { type: 'Leave', id: 'SETTINGS' },
          ]
          : [{ type: 'Leave', id: 'ADMIN-LIST' }],
    }),
    processLeave: builder.mutation({
      query: ({ id, status, adminComment }) => ({
        url: `/leaves/process/${id}`,
        method: 'PATCH',
        body: { status, adminComment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: 'Leave', id: 'ADMIN-LIST' },
        { type: "Leave", id: "CALENDAR" }
      ],
    }),
    getLeaveSettings: builder.query({
      query: () => '/leaves/settings',
      providesTags: [{ type: 'Leave', id: 'SETTINGS' }],
    }),
    updateLeaveSettings: builder.mutation({
      query: (newSettings) => ({
        url: '/leaves/settings',
        method: 'PUT',
        body: newSettings,
      }),
      invalidatesTags: [
        { type: 'Leave', id: 'SETTINGS' },
        { type: 'Leave', id: 'ADMIN-LIST' },
        { type: 'Leave', id: 'PARTIAL-LIST' }
      ],
    }),
    getLeaveCalendar: builder.query({
      query: (params) => ({
        url: "/leaves/calendar",
        params,
      }),
      transformResponse: (response) => response || [],
      providesTags: [{ type: "Leave", id: "CALENDAR" }],
    }),
  }),
});

export const {
  useGetMyLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveMutation,
  useDeleteLeaveMutation,
  useGetAllLeavesQuery,
  useProcessLeaveMutation,
  useGetLeaveSettingsQuery,
  useUpdateLeaveSettingsMutation,
  useGetLeaveCalendarQuery
} = leaveApiSlice;