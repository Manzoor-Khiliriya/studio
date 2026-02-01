import { apiSlice } from './apiSlice';

export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. GET ALL TASKS (Admin only)
    // Matches: GET /api/tasks/all
    getAllTasks: builder.query({
      query: (params) => ({
        url: '/tasks/all',
        params, // Pass search, page, limit, dates here
      }),
      providesTags: ['Task'],
    }),

    // 2. GET TASK DETAIL
    // Matches: GET /api/tasks/detail/:id
    getTaskDetail: builder.query({
      query: (id) => `/tasks/detail/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    // 3. GET TASKS BY EMPLOYEE (Admin only)
    // Matches: GET /api/tasks/admin/employee-tasks/:userId
    getTasksByEmployee: builder.query({
      query: (userId) => `/tasks/admin/employee-tasks/${userId}`,
      providesTags: ['Task'],
    }),

    // 4. GET MY TASKS (Logged in employee)
    // Matches: GET /api/tasks/me
    getMyTasks: builder.query({
      query: (params) => ({
        url: '/tasks/me',
        method: 'GET',
        params: {
          ...params,
          // If status is "All", we send an empty string so the backend ignores the filter
          status: params?.status === "All" ? "" : params?.status
        },
      }),
      providesTags: ['Task'],
    }),

    // 5. CREATE TASK
    // Matches: POST /api/tasks/
    createTask: builder.mutation({
      query: (newTask) => ({
        url: '/tasks',
        method: 'POST',
        body: newTask,
      }),
      invalidatesTags: ['Task'], // Refreshes all lists automatically
    }),

    // 6. UPDATE TASK
    // Matches: PUT /api/tasks/:id
    updateTask: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: (result, error, { id }) => ['Task', { type: 'Task', id }],
    }),

    // 7. DELETE TASK
    // Matches: DELETE /api/tasks/:id
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetAllTasksQuery,
  useGetTaskDetailQuery,
  useGetTasksByEmployeeQuery,
  useGetMyTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;