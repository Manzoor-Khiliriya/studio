import { apiSlice } from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: { ...credentials },
      }),
    }),

    // ADD THIS: Forgot Password Step
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data, // { email }
      }),
    }),

    // UPDATE THIS: Reset Password Step
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data, // { email, otp, newPassword }
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation, // Export this
  useResetPasswordMutation,
} = authApiSlice;