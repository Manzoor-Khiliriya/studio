import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),

    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-read',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;