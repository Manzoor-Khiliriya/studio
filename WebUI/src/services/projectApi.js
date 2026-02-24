import { apiSlice } from './apiSlice';

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. GET ALL PROJECTS (Used for dropdowns & management)
    getProjects: builder.query({
      query: () => '/projects',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Project', id: _id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    // 2. CREATE PROJECT
    createProject: builder.mutation({
      query: (newProject) => ({
        url: '/projects',
        method: 'POST',
        body: newProject,
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // 3. UPDATE PROJECT
    updateProject: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id },
        // We invalidate Task LIST because task table shows project titles
        { type: 'Task', id: 'LIST' }, 
      ],
    }),

    // 4. DELETE PROJECT
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // 5. GET SINGLE PROJECT DETAILS (Optional)
    getProjectDetail: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectDetailQuery,
} = projectApiSlice;