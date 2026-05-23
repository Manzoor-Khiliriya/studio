import { apiSlice } from "./apiSlice";

export const taskAllocationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateTaskAllocation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/task-allocations/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "TaskAllocation", id },
        { type: "TaskAllocation", id: "LIST" },
      ],
    }),
    deleteTaskAllocation: builder.mutation({
      query: (id) => ({
        url: `/task-allocations/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [{ type: "TaskAllocation", id: "LIST" }],
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
    updateDailyAllocation: builder.mutation({
      query: ({ id, allocatedHours }) => ({
        url: `/task-allocations/${id}/daily`,
        method: "PATCH",
        body: { allocatedHours },
      }),
      invalidatesTags: [{ type: "TaskAllocation", id: "EMPLOYEE_WORKLOAD" }],
    }),
  }),
});

export const {
  useUpdateTaskAllocationMutation,
  useDeleteTaskAllocationMutation,
  useGetEmployeeAllocationsQuery,
  useUpdateDailyAllocationMutation,
} = taskAllocationApiSlice;
