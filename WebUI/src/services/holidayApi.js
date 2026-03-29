import { apiSlice } from './apiSlice';

export const holidayApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getHolidays: builder.query({
      query: (params) => ({
        url: '/holidays',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ _id }) => ({ type: 'Holiday', id: _id })),
            { type: 'Holiday', id: 'LIST' },
          ]
          : [{ type: 'Holiday', id: 'LIST' }],
    }),
    addHoliday: builder.mutation({
      query: (newHoliday) => ({
        url: '/holidays',
        method: 'POST',
        body: newHoliday,
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),
    bulkAddHolidays: builder.mutation({
      query: (holidays) => ({
        url: '/holidays/bulk',
        method: 'POST',
        body: { holidays },
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),
    updateHoliday: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/holidays/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Holiday', id: 'LIST' },
        { type: 'Holiday', id },
      ],
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useBulkAddHolidaysMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = holidayApiSlice;