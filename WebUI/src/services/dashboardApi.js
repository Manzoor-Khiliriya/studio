import { apiSlice } from "./apiSlice";

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: () => "/dashboard/summary",
      providesTags: ["Dashboard", "Task", "TimeLog", "Leave"],
    }),

    getManagerDashboard: builder.query({
      query: () => "/dashboard/manager-dashboard",
      providesTags: ["Dashboard", "Task", "TimeLog", "Leave"],
    }),
    getAdminOverview: builder.query({
      query: () => "/dashboard/admin-overview",
      providesTags: ["Dashboard", "Task", "TimeLog"],
    }),
    clearLogs: builder.mutation({
      // Accept 'body' which will contain { date: "YYYY-MM-DD" }
      query: (body) => ({
        url: "/timelogs/clear-all",
        method: "POST",
        body, // This sends the date object to your controller
      }),
      invalidatesTags: ["Dashboard"],
    }),
    stopAllSessions: builder.mutation({
      query: () => ({
        url: "/timelogs/stop-all",
        method: "POST",
      }),
      invalidatesTags: ["Dashboard", "TimeLog"],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetManagerDashboardQuery,
  useGetAdminOverviewQuery,
  useClearLogsMutation,
  useStopAllSessionsMutation,
} = dashboardApiSlice;
