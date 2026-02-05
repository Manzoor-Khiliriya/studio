import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL USERS (Admin)
    getAllUsers: builder.query({
      query: () => '/users',
      // Provides 'User' for the list and specific IDs for granular updates
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'User', id: _id })),
            { type: 'User', id: 'LIST' },
          ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // GET SINGLE USER
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // CREATE USER (Admin only)
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }   // 👈 ADD THIS
      ],
    }),

    // UPDATE USER (Admin)
    updateUser: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }   // 👈 ADD THIS
      ],
    }),

    // CHANGE USER STATUS (PATCH)
    changeUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/users/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }   // 👈 ADD THIS
      ],
    }),

    // DELETE USER
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }   // 👈 ADD THIS
      ]

    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserStatusMutation,
  useDeleteUserMutation,
} = userApi;