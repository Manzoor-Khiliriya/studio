import { apiSlice } from './apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // 1. Get All Projects
    getProjects: builder.query({
      query: () => '/projects',
      // Backend returns { success: true, data: projects[] }
      transformResponse: (response) => response.projects || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Project', id: _id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    // 2. Create a New Project
    createProject: builder.mutation({
      query: (newProject) => ({
        url: '/projects',
        method: 'POST',
        body: newProject,
      }),
      // Extracts the project object from { success, message, data: {...} }
      transformResponse: (response) => response.project || {},
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // 3. Update Project
    updateProject: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      transformResponse: (response) => response.project || {},
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // 4. Delete Project
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      // No transform needed for 204 No Content
      invalidatesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // 6. Get Project Hours Estimate
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
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectDetailQuery,
  useGetProjectEstimateQuery,
} = projectApiSlice;