import { apiSlice } from './apiSlice';

export const searchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // GLOBAL SEARCH
    // Matches: GET /api/search?query=abc
    globalSearch: builder.query({
      query: (searchTerm) => ({
        url: '/search',
        params: { query: searchTerm },
      }),
      // We don't usually "provideTags" for search because 
      // search results change constantly and don't need a specific cache tag.
    }),

  }),
});

export const { useGlobalSearchQuery } = searchApi;