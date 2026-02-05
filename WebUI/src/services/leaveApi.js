import { apiSlice } from './apiSlice';

export const leaveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // --- EMPLOYEE ENDPOINTS ---

    // 1. GET MY LEAVES (History + Stats)
    // Matches: GET /api/leaves/my
    getMyLeaves: builder.query({
      query: () => '/leaves/my',
      providesTags: ['Leave'],
    }),

    // 2. APPLY FOR LEAVE
    applyLeave: builder.mutation({
      query: (newLeave) => ({
        url: '/leaves',
        method: 'POST',
        body: newLeave,
      }),
      invalidatesTags: ['Leave'],
    }),

    // 3. UPDATE LEAVE (Pending only)
    updateLeave: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/leaves/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        'Leave'
      ],
    }),

    // 4. DELETE LEAVE
    deleteLeave: builder.mutation({
      query: (id) => ({
        url: `/leaves/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Leave'],
    }),

    // --- ADMIN ENDPOINTS ---

    // 5. GET ALL LEAVES (Admin View)
    // Matches: GET /api/leaves?status=Pending&search=John
    getAllLeaves: builder.query({
      query: (params) => ({
        url: '/leaves',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Leave', id: _id })),
              { type: 'Leave', id: 'LIST' },
            ]
          : [{ type: 'Leave', id: 'LIST' }],
    }),

    // 6. PROCESS LEAVE (Approve/Reject)
    // Matches: PATCH /api/leaves/process/:id
    processLeave: builder.mutation({
      query: ({ id, status, adminComment }) => ({
        url: `/leaves/process/${id}`,
        method: 'PATCH',
        body: { status, adminComment },
      }),
      // Invalidates Leave so balance recalculates for the employee
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        'Leave',
        { type: 'Leave', id: 'LIST' }
      ],
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
} = leaveApiSlice;