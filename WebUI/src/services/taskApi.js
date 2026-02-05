import { apiSlice } from './apiSlice';

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // --- ADMIN ENDPOINTS ---

    // 1. GET ALL TASKS (Admin Dashboard)
    // Matches: GET /api/tasks/all?search=...&status=...&page=...
    getAllTasks: builder.query({
      query: (params) => ({
        url: '/tasks/all',
        params, // Handles pagination, search, and status filters
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
              ...result.tasks.map(({ _id }) => ({ type: 'Task', id: _id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    // 2. CREATE TASK
    createTask: builder.mutation({
      query: (newTask) => ({
        url: '/tasks',
        method: 'POST',
        body: newTask,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // 3. UPDATE TASK
    updateTask: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id },
      ],
    }),

    // 4. DELETE TASK
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // 5. GET TASKS BY SPECIFIC EMPLOYEE (Admin View)
    getTasksByEmployee: builder.query({
      query: (userId) => `/tasks/employee-tasks/${userId}`,
      providesTags: ['Task'],
    }),

    // --- SHARED ENDPOINTS ---

    // 6. GET TASK DETAIL
    getTaskDetail: builder.query({
      query: (id) => `/tasks/detail/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    // --- EMPLOYEE ENDPOINTS ---

    // 7. GET MY TASKS (Employee Dashboard)
    getMyTasks: builder.query({
      query: (params) => ({
        url: '/tasks/my-tasks',
        params,
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
              ...result.tasks.map(({ _id }) => ({ type: 'Task', id: _id })),
              { type: 'Task', id: 'MY_LIST' },
            ]
          : [{ type: 'Task', id: 'MY_LIST' }],
    }),
  }),
});

export const {
  useGetAllTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetTasksByEmployeeQuery,
  useGetTaskDetailQuery,
  useGetMyTasksQuery,
} = taskApiSlice;