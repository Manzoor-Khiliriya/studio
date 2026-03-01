import { apiSlice } from './apiSlice';

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. Get All Tasks with Pagination
    getAllTasks: builder.query({
      query: (params) => ({
        url: '/tasks/all',
        params,
      }),
      transformResponse: (response) => ({
        tasks: response.tasks || [],
        allProjects: response.allProjects || [],
        pagination: response.pagination || {},
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
            ...result.tasks.map(({ _id }) => ({ type: 'Task', id: _id })),
            { type: 'Task', id: 'LIST' },
          ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    // 2. Create a New Task
    createTask: builder.mutation({
      query: (newTask) => ({
        url: '/tasks',
        method: 'POST',
        body: newTask,
      }),
      // Picks the created task object from the response
      transformResponse: (response) => response.task || {},
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    // 3. Update an Existing Task
    updateTask: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      transformResponse: (response) => response.task || {},
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_LIST' },
        { type: 'Task', id },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    // 4. Delete a Task
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      // No transform needed for 204 No Content
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_LIST' },
        { type: 'Project', id: 'LIST' },
      ],
    }),

    // 5. Get Tasks for a Specific Employee
    getTasksByEmployee: builder.query({
      query: (userId) => `/tasks/employee-tasks/${userId}`,
      transformResponse: (response) => response.tasks || [],
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
            ...result.map(({ _id }) => ({ type: 'Task', id: _id })),
            { type: 'Task', id: 'LIST' },
          ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    // 6. Get Single Task Detail
    getTaskDetail: builder.query({
      query: (id) => `/tasks/detail/${id}`,
      // Extracts the task object
      transformResponse: (response) => response.task || null,
      providesTags: (result, error, id) => (result ? [{ type: 'Task', id }] : []),
    }),

    // 7. Get Logged-in User's Tasks (with Pagination)
    getMyTasks: builder.query({
      query: (params) => ({
        url: '/tasks/my-tasks',
        params,
      }),
      transformResponse: (response) => ({
        tasks: response.tasks || [],
        pagination: response.pagination || {},
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
            ...result.tasks.map(({ _id }) => ({ type: 'Task', id: _id })),
            { type: 'Task', id: 'MY_LIST' },
          ]
          : [{ type: 'Task', id: 'MY_LIST' }],
    }),

    // 8. Update Task Status (Patch)
    updateTaskStatus: builder.mutation({
      query: ({ id, ...statusData }) => ({
        url: `/tasks/${id}/status`,
        method: 'PATCH',
        body: statusData,
      }),
      transformResponse: (response) => response.task || {},
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_LIST' },
        { type: 'Task', id },
      ],
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
  useUpdateTaskStatusMutation,
} = taskApiSlice;