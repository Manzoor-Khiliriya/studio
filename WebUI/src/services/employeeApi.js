import { apiSlice } from './apiSlice';

export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllEmployees: builder.query({
      query: (params) => ({
        url: '/employee',
        params,
      }),
      providesTags: (result) =>
        result?.employees
          ? [
            ...result.employees.map(({ _id }) => ({ type: 'Employee', id: _id })),
            { type: 'Employee', id: 'LIST' },
          ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),
    getEmployeeProfile: builder.query({
      query: (userId) => `/employee/${userId}`,
      providesTags: (result, error, userId) => [
        { type: 'Employee', id: userId }
      ],
    }),
    updateEmployeeStats: builder.mutation({
      query: ({ userId, ...updateData }) => ({
        url: `/employee/${userId}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: userId },
        { type: 'User', id: userId },
      ],
    }),
    getMyEmployeeProfile: builder.query({
      query: () => '/employee/my/profile',
      providesTags: ['Employee'],
    }),
    getActiveEmployees: builder.query({
      query: () => '/employee/active-list',
      providesTags: ['Employee'],
    }),
  }),
});

export const {
  useGetAllEmployeesQuery,
  useGetEmployeeProfileQuery,
  useUpdateEmployeeStatsMutation,
  useGetMyEmployeeProfileQuery,
  useGetActiveEmployeesQuery
} = employeeApiSlice;