import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Student {
    id: number;
    full_name: string;
    email: string;
    username: string;
    date_joined: string;
    is_active?: boolean;
}

export interface StudentListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Student[];
}

export interface StudentReview {
    id: number;
    name: string;
    youtube_url: string;
    video_id?: string;
    type?: 'think' | 'lesson';
    created_at: string;
    is_active?: boolean;
}

export interface StudentReviewListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: StudentReview[];
}

export interface SupportRequest {
    id: number;
    name?: string;
    email: string;
    first_name: string;
    last_name: string;
    message: string;
    priority: 'low' | 'normal' | 'high';
    status: 'open' | 'in_progress' | 'closed';
    image_url: string | null;
    created_at: string;
}

export interface SupportRequestListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: SupportRequest[];
}

export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers) => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('access');
                if (token) {
                    headers.set('authorization', `Bearer ${token}`);
                }
            }
            return headers;
        },
    }),
    tagTypes: ['Students', 'StudentReviews', 'SupportRequests', 'MySupportRequests'],
    endpoints: (builder) => ({
        getStudents: builder.query<StudentListResponse, { page?: number; search?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;

                return {
                    url: 'users/students/',
                    params: queryParams,
                };
            },
            providesTags: ['Students'],
        }),
        getStudentReviews: builder.query<StudentReviewListResponse, { page?: number }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;

                return {
                    url: 'users/students-review-list/',
                    params: queryParams,
                };
            },
            providesTags: ['StudentReviews'],
        }),
        deleteStudentReview: builder.mutation<any, { id: number | string }>({
            query: ({ id }) => ({
                url: `users/student-review-update/${id}/`,
                method: 'PATCH',
                body: { is_deleted: true },
            }),
            invalidatesTags: ['StudentReviews'],
        }),
        updateStudentReview: builder.mutation<any, { id: number | string; body: Partial<StudentReview> }>({
            query: ({ id, body }) => ({
                url: `users/student-review-update/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['StudentReviews'],
        }),
        createStudentReview: builder.mutation<{ message: string; data?: any }, { name?: string; youtube_url: string; type: 'think' | 'lesson' }>({
            query: (newReviewData) => ({
                url: 'users/students-review-create/',
                method: 'POST',
                body: newReviewData,
                validateStatus: (response) => response.status === 200 || response.status === 201,
            }),
            invalidatesTags: ['StudentReviews'],
        }),
        getSupportRequests: builder.query<SupportRequestListResponse, { page?: number; status?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.status) queryParams.status = params.status;
                if (params.ordering) queryParams.ordering = params.ordering;

                return {
                    url: 'users/support-list/',
                    params: queryParams,
                };
            },
            providesTags: ['SupportRequests'],
        }),
        updateSupportStatus: builder.mutation<any, { id: number; status: 'in_progress' | 'closed' }>({
            query: ({ id, status }) => ({
                url: `users/support-update/${id}/`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['SupportRequests'],
        }),
        getMySupportRequests: builder.query<SupportRequestListResponse, { page?: number; status?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.status) queryParams.status = params.status;
                if (params.ordering) queryParams.ordering = params.ordering;

                return {
                    url: 'users/my-support-list/',
                    params: queryParams,
                };
            },
            providesTags: ['MySupportRequests'],
        }),
        createSupportRequest: builder.mutation<any, Partial<SupportRequest>>({
            query: (body) => ({
                url: 'users/support-create/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['MySupportRequests'],
        }),
    }),
});

export const {
    useGetStudentsQuery,
    useGetStudentReviewsQuery,
    useDeleteStudentReviewMutation,
    useUpdateStudentReviewMutation,
    useCreateStudentReviewMutation,
    useGetSupportRequestsQuery,
    useUpdateSupportStatusMutation,
    useGetMySupportRequestsQuery,
    useCreateSupportRequestMutation,
} = userApi;
