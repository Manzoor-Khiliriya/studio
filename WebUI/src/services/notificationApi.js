import { apiSlice } from './apiSlice';
import { io } from 'socket.io-client';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // GET ALL NOTIFICATIONS
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],

      // REAL-TIME LISTENER
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        // Initialize socket
        const socket = io("http://localhost:5000");

        try {
          await cacheDataLoaded;
          const user = getState().auth.user;

          if (user?._id) {
            socket.emit("join", user._id);

            // Listen for the event emitted by notifier.js on the backend
            socket.on("notification", (newNotif) => {
              updateCachedData((draft) => {
                // Add new notification to the beginning of the array
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

    // MARK ALL AS READ
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-read',
        method: 'PATCH',
      }),
      // This clears the "unread" status locally
      invalidatesTags: ['Notification'],
    }),

    // DELETE NOTIFICATION
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