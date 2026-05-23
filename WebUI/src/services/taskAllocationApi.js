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
      query: () => ({
        url: "/task-allocations/employee-allocation",
      }),

      transformResponse: (response) => response.employees || [],

      providesTags: [
        {
          type: "TaskAllocation",

          id: "EMPLOYEE_WORKLOAD",
        },
      ],
    }),
  }),
});

export const {
  useUpdateTaskAllocationMutation,
  useDeleteTaskAllocationMutation,
  useGetEmployeeAllocationsQuery,
  useUpdateDailyAllocationMutation,
} = taskAllocationApiSlice;
