import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. GET ALL USERS (Admin only)
    // Matches: GET /api/users/
    getAllUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params, // Pass search, page, limit, dates here
      }),
      providesTags: ['User'],
    }),

    // 2. GET USER BY ID
    // Matches: GET /api/users/:id
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // 3. CREATE USER
    // Matches: POST /api/users/
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),

    // 4. UPDATE USER
    // Matches: PUT /api/users/:id
    updateUser: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => ['User', { type: 'User', id }],
    }),

    // 5. CHANGE USER STATUS (Enable/Disable)
    // Matches: PATCH /api/users/status/:id
    changeUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/users/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => ['User', { type: 'User', id }],
    }),

    // 6. DELETE USER
    // Matches: DELETE /api/users/:id
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export hooks for your components
export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserStatusMutation,
  useDeleteUserMutation,
} = userApi;