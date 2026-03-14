import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface GoogleReview {
  id: string | number;
  author_name: string;
  author_avatar_url: string;
  rating: number;
  review_text: string;
  review_date: string;
}

export interface GoogleReviewsResponse {
  average_rating: number;
  count: number;
  results: GoogleReview[];
}

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  endpoints: (builder) => ({
    getGoogleReviews: builder.query<GoogleReviewsResponse, void>({
      query: () => 'users/reviews/',
    }),
  }),
});

export const { useGetGoogleReviewsQuery } = reviewsApi;
