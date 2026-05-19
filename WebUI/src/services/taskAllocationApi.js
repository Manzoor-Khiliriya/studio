import { apiSlice } from "./apiSlice";

export const taskAllocationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTaskAllocation: builder.mutation({
      query: (data) => ({
        url: "/task-allocations",
        method: "POST",
        body: data,
      }),

      invalidatesTags: [
        { type: "TaskAllocation", id: "LIST" },
        { type: "Task", id: "LIST" },
      ],
    }),
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
    getTaskAllocations: builder.query({
      query: (taskId) => ({
        url: `/task-allocations/task/${taskId}`,
      }),

      transformResponse: (response) => response.allocations || [],

      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({
                type: "TaskAllocation",
                id: _id,
              })),
              { type: "TaskAllocation", id: "LIST" },
            ]
          : [{ type: "TaskAllocation", id: "LIST" }],
    }),
    getEmployeeTaskQueue: builder.query({
      query: (employeeId) => ({
        url: `/task-allocations/employee/${employeeId}`,
      }),

      transformResponse: (response) => response.allocations || [],

      providesTags: [{ type: "TaskAllocation", id: "QUEUE" }],
    }),
    getMyTaskQueue: builder.query({
      query: () => ({
        url: "/task-allocations/my-queue",
      }),

      transformResponse: (response) => response.allocations || [],

      providesTags: [{ type: "TaskAllocation", id: "MY_QUEUE" }],
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
  useCreateTaskAllocationMutation,
  useUpdateTaskAllocationMutation,
  useDeleteTaskAllocationMutation,
  useGetTaskAllocationsQuery,
  useGetEmployeeTaskQueueQuery,
  useGetMyTaskQueueQuery,
  useGetEmployeeAllocationsQuery,
} = taskAllocationApiSlice;
