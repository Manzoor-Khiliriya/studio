import { apiSlice } from './apiSlice';

export const leaveApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        // --- EMPLOYEE ENDPOINTS ---

        // Apply for leave: POST /api/leaves/apply
        applyLeave: builder.mutation({
            query: (body) => ({
                url: '/leaves/apply',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Leave'],
        }),

        // Get personal leave history: GET /api/leaves/my-leaves
        getMyLeaves: builder.query({
            query: () => '/leaves/my-leaves',
            providesTags: ['Leave'],
        }),

        // Update pending leave: PUT /api/leaves/update/:id
        updateLeave: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/leaves/update/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Leave', id }, 'Leave'],
        }),

        // Cancel leave: DELETE /api/leaves/cancel/:id
        cancelLeave: builder.mutation({
            query: (id) => ({
                url: `/leaves/cancel/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Leave'],
        }),


        // --- ADMIN ENDPOINTS ---

        // Get all leaves: GET /api/leaves/all
        getAllLeaves: builder.query({
            query: (params) => ({
                url: '/leaves/all',
                method: 'GET',
                params: params, // Automatically turns { search: '...', status: '...' } into ?search=...&status=...
            }),
            providesTags: ['Leave'],
        }),

        // Approve/Reject leave: PATCH /api/leaves/process/:id
        processLeave: builder.mutation({
            query: ({ id, status, adminComment }) => ({ // Changed adminRemarks to adminComment
                url: `/leaves/process/${id}`,
                method: 'PATCH',
                body: { status, adminComment }, // Match the key in your controller
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Leave', id }, 'Leave'],
        }),
        // Admin delete record: DELETE /api/leaves/admin/delete/:id
        adminDeleteLeave: builder.mutation({
            query: (id) => ({
                url: `/leaves/admin/delete/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Leave'],
        }),
        // Add inside your leaveApi.js builder
        getHolidays: builder.query({
            query: () => '/holidays',
            providesTags: ['Holiday'],
        }),
        addHoliday: builder.mutation({
            query: (body) => ({ url: '/holidays', method: 'POST', body }),
            invalidatesTags: ['Holiday', 'Leave'], // Refresh leaves too if holidays change!
        }),
        deleteHoliday: builder.mutation({
            query: (id) => ({ url: `/holidays/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Holiday', 'Leave'],
        }),
    }),
});

export const {
    useApplyLeaveMutation,
    useGetMyLeavesQuery,
    useUpdateLeaveMutation,
    useCancelLeaveMutation,
    useGetAllLeavesQuery,
    useProcessLeaveMutation,
    useAdminDeleteLeaveMutation,
} = leaveApi;