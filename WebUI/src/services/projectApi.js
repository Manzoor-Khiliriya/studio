import { apiSlice } from './apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. Get All Projects (Paginated for List View)
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

    // 2. NEW: Get Project Calendar Stacks (Timeline Bars)
    // Used in: TaskCalendar.jsx
    getProjectCalendar: builder.query({
      query: (search) => ({
        url: '/projects/calendar',
        params: { search }, // matches GET /api/projects/calendar?search=...
      }),
      // We return the raw array of events for FullCalendar
      transformResponse: (response) => response || [],
      providesTags: (result) => [
        { type: 'Project', id: 'CALENDAR' },
        { type: 'Task', id: 'LIST' }, // Invalidate if tasks change
      ],
    }),

    // 3. Get Project Detail
    getProjectDetail: builder.query({
      query: (id) => `/projects/${id}`,
      transformResponse: (response) => response.project || {},
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),

    // 4. Create a New Project
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

    // 5. Update Project
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

    // 6. Delete Project
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

    // 7. Get Project Hours Estimate
    getProjectEstimate: builder.query({
      query: (projectId) => `/projects/${projectId}/calculate-estimate`,
      transformResponse: (response) => response.hours,
      providesTags: (result, error, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectCalendarQuery, // <--- EXPORT THIS
  useGetProjectDetailQuery,   // <--- EXPORT THIS
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectEstimateQuery,
} = projectApiSlice;