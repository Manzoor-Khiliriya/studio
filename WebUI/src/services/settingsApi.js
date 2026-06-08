import { apiSlice } from "./apiSlice";

export const settingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => "/departments",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({
                type: "Department",
                id: _id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),

    createDepartment: builder.mutation({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id },
        { type: "Department", id: "LIST" },
      ],
    }),

    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),

    getDesignations: builder.query({
      query: () => "/designations",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({
                type: "Designation",
                id: _id,
              })),
              { type: "Designation", id: "LIST" },
            ]
          : [{ type: "Designation", id: "LIST" }],
    }),

    createDesignation: builder.mutation({
      query: (body) => ({
        url: "/designations",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Designation", id: "LIST" },
        { type: "Employee", id: "LIST" },
      ],
    }),

    updateDesignation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/designations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Designation", id },
        { type: "Designation", id: "LIST" },
        { type: "Employee", id: "LIST" },
      ],
    }),

    deleteDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Designation", id: "LIST" },
        { type: "Employee", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
} = settingApiSlice;
