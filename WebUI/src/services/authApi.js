import { apiSlice } from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // LOGIN
    // Matches: POST /api/auth/login
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: { ...credentials },
      }),
    }),

    // GET CURRENT USER (Profile)
    // Matches: GET /api/auth/my-profile
    getMe: builder.query({
      query: () => '/auth/my-profile',
      // We tag this so we can force a refresh if the user updates their own profile elsewhere
      providesTags: ['User'], 
    }),

    // RESET PASSWORD
    // Matches: POST /api/auth/reset-password
    resetPassword: builder.mutation({
      query: (passwords) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { ...passwords },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useResetPasswordMutation,
} = authApiSlice;