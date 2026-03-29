import { apiSlice } from './apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: (params) => ({
        url: '/projects',
        params: params, 
      }),
      transformResponse: (response) => ({
        projects: response.projects || [],
        pagination: response.pagination || {}
      }),
      providesTags: (result) =>
        result?.projects
          ? [
            ...result.projects.map(({ _id }) => ({ type: 'Project', id: _id })),
            { type: 'Project', id: 'LIST' },
          ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getProjectCalendar: builder.query({
      query: (search) => ({
        url: '/projects/calendar',
        params: { search },
      }),
      transformResponse: (response) => response || [],
      providesTags: (result) => [
        { type: 'Project', id: 'CALENDAR' },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    getProjectDetail: builder.query({
      query: (id) => `/projects/${id}`,
      transformResponse: (response) => response.project || {},
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation({
      query: (newProject) => ({
        url: '/projects',
        method: 'POST',
        body: newProject,
      }),
      transformResponse: (response) => response.project || {},
      invalidatesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id: 'CALENDAR' }
      ],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      transformResponse: (response) => response.project || {},
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id: 'CALENDAR' },
        { type: 'Project', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id: 'CALENDAR' },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    getProjectEstimate: builder.query({
      query: (projectId) => `/projects/${projectId}/calculate-estimate`,
      transformResponse: (response) => response.hours,
      providesTags: (result, error, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    getTaskPerformanceReport: builder.query({
      query: (params) => ({
        url: '/projects/reports/performance',
        params, 
      }),
      providesTags: (result) =>
        result?.projects
          ? [
              ...result.projects.map(({ _id }) => ({ type: 'Project', id: _id })),
              { type: 'Project', id: 'REPORT_LIST' },
              { type: 'Task', id: 'LIST' }
            ]
          : [{ type: 'Project', id: 'REPORT_LIST' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectCalendarQuery,
  useGetProjectDetailQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectEstimateQuery,
  useGetTaskPerformanceReportQuery,
} = projectApiSlice;