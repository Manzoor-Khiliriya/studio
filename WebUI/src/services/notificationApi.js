import { apiSlice } from './apiSlice';
import { io } from 'socket.io-client';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],

      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        const socket = io("http://localhost:5000");

        try {
          await cacheDataLoaded;
          const user = getState().auth.user;

          if (user?._id) {
            socket.emit("join", user._id);

            socket.on("notification", (newNotif) => {
              updateCachedData((draft) => {
                draft.unshift(newNotif);
              });
            });
          }
        } catch (err) {
          console.error("Socket Error:", err);
        }

        await cacheEntryRemoved;
        socket.close();
      },
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