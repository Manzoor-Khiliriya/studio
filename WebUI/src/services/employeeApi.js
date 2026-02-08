import { apiSlice } from './apiSlice';

export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. GET ALL EMPLOYEES (Admin)
    // Matches: GET /api/employees?search=...&page=...&limit=...
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

    // 2. GET EMPLOYEE PROFILE (Admin viewing specific user)
    // Matches: GET /api/employees/:userId
    getEmployeeProfile: builder.query({
      query: (userId) => `/employee/${userId}`,
      providesTags: (result, error, userId) => [
        { type: 'Employee', id: userId }
      ],
    }),

    // 3. UPDATE EMPLOYEE STATS (Admin)
    // Matches: PUT /api/employees/:userId
    updateEmployeeStats: builder.mutation({
      query: ({ userId, ...updateData }) => ({
        url: `/employee/${userId}`,
        method: 'PUT',
        body: updateData,
      }),
      // Invalidates both the specific employee and the list (to reflect changes in tables)
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: userId },
        { type: 'User', id: userId }, // Also invalidates User tag since backend populates User
      ],
    }),

    // 4. GET LOGGED-IN EMPLOYEE PROFILE (Self)
    // Matches: GET /api/employees/my/profile
    getMyEmployeeProfile: builder.query({
      query: () => '/employee/my/profile',
      providesTags: ['Employee'],
    }),

    getActiveEmployees: builder.query({
      query: () => '/employee/active-list', // Adjust path based on your routes
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