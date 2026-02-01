import { apiSlice } from './apiSlice';

export const holidayApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: () => '/holidays',
      providesTags: ['Holiday'],
    }),
    addHoliday: builder.mutation({
      query: (body) => ({ url: '/holidays', method: 'POST', body }),
      // CRITICAL: Adding a holiday invalidates 'Leave' so balances refresh!
      invalidatesTags: ['Holiday', 'Leave'], 
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({ url: `/holidays/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Holiday', 'Leave'],
    }),
  }),
  overrideExisting: false,
});

export const { 
  useGetHolidaysQuery, 
  useAddHolidayMutation, 
  useDeleteHolidayMutation 
} = holidayApi;