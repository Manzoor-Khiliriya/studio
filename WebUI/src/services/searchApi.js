import { apiSlice } from './apiSlice';

export const searchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // GLOBAL SEARCH (Admin Only)
    // Matches: GET /api/search?query=...
    globalSearch: builder.query({
      query: (searchTerm) => ({
        url: '/search',
        params: { query: searchTerm },
      }),
      // We don't necessarily need to provide tags here because 
      // search results are typically transient and don't need long-term caching.
      // However, we keep it in the 'api' flow to share the Auth headers.
      keepUnusedDataFor: 5, // Keep results for 5 seconds only to save memory
    }),

  }),
});

export const {
  useLazyGlobalSearchQuery, // We use Lazy so we can trigger it manually
} = searchApiSlice;