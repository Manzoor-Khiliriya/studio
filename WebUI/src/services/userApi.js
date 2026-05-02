import { apiSlice } from './apiSlice';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    heartbeat: builder.mutation({
      query: () => ({
        url: "/users/heartbeat",
        method: "POST",
      }),
    }),
    getAllUsers: builder.query({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'User', id: _id })),
            { type: 'User', id: 'LIST' },
          ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }
      ],
    }),
    updateUser: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }
      ],
    }),
    changeUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/users/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'User', id: 'LIST' },
        { type: 'Employee', id: 'LIST' }
      ]
    }),
  }),
});

export const {
  useHeartbeatMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserStatusMutation,
  useDeleteUserMutation,
} = userApi;