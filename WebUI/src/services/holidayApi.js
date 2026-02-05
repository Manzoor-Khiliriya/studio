import { apiSlice } from './apiSlice';

export const holidayApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. GET HOLIDAYS
    // Matches: GET /api/holidays?year=2026
    getHolidays: builder.query({
      query: (params) => ({
        url: '/holidays',
        params, // year filter
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Holiday', id: _id })),
              { type: 'Holiday', id: 'LIST' },
            ]
          : [{ type: 'Holiday', id: 'LIST' }],
    }),

    // 2. ADD SINGLE HOLIDAY (Admin)
    addHoliday: builder.mutation({
      query: (newHoliday) => ({
        url: '/holidays',
        method: 'POST',
        body: newHoliday,
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),

    // 3. BULK ADD HOLIDAYS (Admin)
    bulkAddHolidays: builder.mutation({
      query: (holidays) => ({
        url: '/holidays/bulk',
        method: 'POST',
        body: { holidays }, // Expects { holidays: [...] }
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),

    // 4. UPDATE HOLIDAY (Admin)
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

    // 5. DELETE HOLIDAY (Admin)
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