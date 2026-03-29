import { apiSlice } from './apiSlice';

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

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
    createTask: builder.mutation({
      query: (newTask) => ({
        url: '/tasks',
        method: 'POST',
        body: newTask,
      }),
      transformResponse: (response) => response.task || {},
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Project', id: 'LIST' },
      ],
    }),
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
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'MY_LIST' },
        { type: 'Project', id: 'LIST' },
      ],
    }),
    getTasksByEmployee: builder.query({
      query: (userId) => `/tasks/employee-tasks/${userId}`,
      transformResponse: (response) => ({
        currentlyAssigned: response.currentlyAssigned || [],
        workedAndAssigned: response.workedAndAssigned || [],
      }),
      providesTags: (result) => {
        const allTasks = [
          ...(result?.currentlyAssigned || []),
          ...(result?.workedAndAssigned || []),
        ];

        return result
          ? [
            ...allTasks.map(({ _id }) => ({ type: 'Task', id: _id })),
            { type: 'Task', id: 'LIST' },
            { type: 'Task', id: 'EMPLOYEE_TASKS' }, 
          ]
          : [{ type: 'Task', id: 'LIST' }];
      },
    }),
    getTaskDetail: builder.query({
      query: (id) => `/tasks/detail/${id}`,
      transformResponse: (response) => response.task || null,
      providesTags: (result, error, id) => (result ? [{ type: 'Task', id }] : []),
    }),
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
        { type: 'Project', id: 'LIST' },
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