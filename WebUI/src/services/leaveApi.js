import { apiSlice } from './apiSlice';

export const leaveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // --- EMPLOYEE ENDPOINTS ---

    // 1. GET MY LEAVES (History + Stats + Pagination)
    // Updated to accept { page, limit }
    getMyLeaves: builder.query({
      query: (params) => ({
        url: '/leaves/my-leaves',
        params, // Sends ?page=x&limit=y
      }),
      providesTags: (result) =>
        result?.history
          ? [
            ...result.history.map(({ _id }) => ({ type: 'Leave', id: _id })),
            { type: 'Leave', id: 'PARTIAL-LIST' },
          ]
          : [{ type: 'Leave', id: 'PARTIAL-LIST' }],
    }),

    // 2. APPLY FOR LEAVE
    applyLeave: builder.mutation({
      query: (newLeave) => ({
        url: '/leaves/apply',
        method: 'POST',
        body: newLeave,
      }),
      // Invalidates the list so the new leave appears on page 1
      invalidatesTags: [
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: "Leave", id: "CALENDAR" }
      ],

    }),

    // 3. UPDATE LEAVE (Pending only)
    updateLeave: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/leaves/update/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        { type: 'Leave', id: 'PARTIAL-LIST' }
      ],
    }),

    // 4. DELETE LEAVE
    deleteLeave: builder.mutation({
      query: (id) => ({
        url: `/leaves/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Leave', id: 'PARTIAL-LIST' },
        { type: "Leave", id: "CALENDAR" }
      ],
    }),

    // 5. GET ALL LEAVES (Admin View + Pagination)
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
            { type: 'Leave', id: 'SETTINGS' }, // Added tag for settings context
          ]
          : [{ type: 'Leave', id: 'ADMIN-LIST' }],
    }),

    // 6. PROCESS LEAVE (Approve/Reject)
    processLeave: builder.mutation({
      query: ({ id, status, adminComment }) => ({
        url: `/leaves/process/${id}`,
        method: 'PATCH',
        body: { status, adminComment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        { type: 'Leave', id: 'PARTIAL-LIST' }, // Recalculates employee stats
        { type: 'Leave', id: 'ADMIN-LIST' },
        { type: "Leave", id: "CALENDAR" }
      ],
    }),

    getLeaveSettings: builder.query({
      query: () => '/leaves/settings',
      providesTags: [{ type: 'Leave', id: 'SETTINGS' }],
    }),

    // 8. UPDATE GLOBAL LEAVE SETTINGS
    updateLeaveSettings: builder.mutation({
      query: (newSettings) => ({
        url: '/leaves/settings',
        method: 'PUT',
        body: newSettings,
      }),
      // This is the "Magic" part: 
      // Updating settings forces all leave lists to refresh with new proportions
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