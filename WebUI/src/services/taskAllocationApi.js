import { apiSlice } from "./apiSlice";

export const taskAllocationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateTaskAllocation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/task-allocations/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [{ type: "TaskAllocation", id: "EMPLOYEE_WORKLOAD" }],
    }),
    getEmployeeAllocations: builder.query({
      query: ({ date, employeeName } = {}) => ({
        url: "/task-allocations/employee-allocation",
        params: {
          ...(date ? { date } : {}),
          ...(employeeName ? { employeeName } : {}),
        },
      }),
      transformResponse: (response) => response.employees || [],
      providesTags: [{ type: "TaskAllocation", id: "EMPLOYEE_WORKLOAD" }],
    }),
  }),
});

export const {
  useUpdateTaskAllocationMutation,
  useGetEmployeeAllocationsQuery,
} = taskAllocationApiSlice;
