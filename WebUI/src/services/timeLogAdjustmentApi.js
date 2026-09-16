import { apiSlice } from './apiSlice';

export const timeAdjustmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Employee: sessions eligible for a correction request
    getEligibleLogs: builder.query({
      query: () => '/time-adjustments/eligible',
      providesTags: ['TimeAdjustment'],
    }),

    // Employee: submit a request
    requestAdjustment: builder.mutation({
      query: (body) => ({
        url: '/time-adjustments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TimeAdjustment', 'TimeLog'],
    }),

    // Employee: view own requests
    getMyAdjustmentRequests: builder.query({
      query: () => '/time-adjustments/mine',
      providesTags: ['TimeAdjustment'],
    }),

    // Admin: list all requests
    getAdjustmentRequests: builder.query({
      query: (status) => ({
        url: '/time-adjustments',
        params: status && status !== 'All' ? { status } : {},
      }),
      providesTags: ['TimeAdjustment'],
    }),

    // Admin: approve / reject
    reviewAdjustmentRequest: builder.mutation({
      query: ({ id, decision, adminNote }) => ({
        url: `/time-adjustments/${id}/review`,
        method: 'PUT',
        body: { decision, adminNote },
      }),
      invalidatesTags: ['TimeAdjustment', 'TimeLog', 'Dashboard'],
    }),

  }),
});

export const {
  useGetEligibleLogsQuery,
  useRequestAdjustmentMutation,
  useGetMyAdjustmentRequestsQuery,
  useGetAdjustmentRequestsQuery,
  useReviewAdjustmentRequestMutation,
} = timeAdjustmentApiSlice;