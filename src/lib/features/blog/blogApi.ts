import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../../store';

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface BlogPost {
    id: number;
    title: string;
    slug: string;
    image_url: string;
    categories: Category[];
    created_at: string;
    author_first_name: string;
    author_last_name: string;
    status: string;
}

export interface BlogPostDetail {
    id: number;
    title: string;
    slug: string;
    content: string;
    image_url: string;
    image_public_id?: string;
    categories: Category[];
    tags: { id?: number, name: string, slug?: string }[];
    view_count: number;
    created_at: string;
    updated_at?: string;
    author_first_name: string;
    author_last_name: string;
    author_user_type: string;
    status: string;
}

export interface BlogListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: BlogPost[];
}

export interface CategoryListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Category[];
}

export const blogApi = createApi({
    reducerPath: 'blogApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers, { getState }) => {
            // Note: Since we are using localStorage directly in useAuthGuard for tokens currently, 
            // relying on localStorage directly here to maintain consistent Bearer injection universally.
            // In a full Redux flow, we would extract from (getState() as RootState).auth.token
            const token = typeof window !== 'undefined' ? localStorage.getItem("access") : null;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['BlogPost', 'Category'],
    endpoints: (builder) => ({
        getBlogPosts: builder.query<BlogListResponse, { page?: number; title?: string; category?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.title) queryParams.title = params.title;
                if (params.category && params.category !== "all") queryParams.category = params.category;

                return {
                    url: 'blog/blog-post-list/',
                    params: queryParams,
                };
            },
            providesTags: ['BlogPost'],
        }),
        getPublicBlogPosts: builder.query<BlogListResponse, { page?: number; title?: string; category?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.title) queryParams.title = params.title;
                if (params.category && params.category !== "all") queryParams.category = params.category;
                if (params.ordering) queryParams.ordering = params.ordering;

                return {
                    url: 'blog/blog-post-list/',
                    params: queryParams,
                };
            },
            providesTags: ['BlogPost'],
        }),
        getCategories: builder.query<CategoryListResponse, { page?: number; name?: string } | void>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params) {
                    if (params.page) queryParams.page = params.page;
                    if (params.name) queryParams.name = params.name;
                }
                return {
                    url: 'blog/category-list/',
                    params: queryParams,
                };
            },
            providesTags: ['Category'],
        }),
        getPublicCategories: builder.query<CategoryListResponse, { page?: number; name?: string } | void>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params) {
                    if (params.page) queryParams.page = params.page;
                    if (params.name) queryParams.name = params.name;
                }
                return {
                    url: 'blog/category-list/',
                    params: queryParams,
                };
            },
            providesTags: ['Category'],
        }),
        createCategory: builder.mutation<any, { name: string }>({
            query: (body) => ({
                url: 'blog/category-create/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation<any, number | string>({
            query: (id) => ({
                url: `blog/category-delete/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation<any, { id: number | string; name?: string; is_deleted?: boolean }>({
            query: ({ id, ...body }) => ({
                url: `blog/category-update/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Category'],
        }),
        getBlogPostDetail: builder.query<BlogPostDetail, string>({
            query: (id) => `blog/blog-post-detail/${id}/`,
            providesTags: (result, error, id) => [{ type: 'BlogPost', id }],
        }),
        createBlogPost: builder.mutation<any, Omit<Partial<BlogPostDetail>, 'categories' | 'tags'> & { categories?: number[], tags?: string[] }>({
            query: (body) => ({
                url: 'blog/blog-post-create/',
                method: 'POST',
                body,
            }),
        }),
        updateBlogPost: builder.mutation<any, { id: string, body: Omit<Partial<BlogPostDetail>, 'categories' | 'tags'> & { categories?: number[], tags?: string[] } }>({
            query: ({ id, body }) => ({
                url: `blog/blog-edit/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'BlogPost', id }, 'BlogPost'],
        }),
        uploadImage: builder.mutation<any, FormData>({
            query: (body) => ({
                url: 'blog/cloudinary-upload/',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetBlogPostsQuery,
    useLazyGetBlogPostsQuery,
    useGetPublicBlogPostsQuery,
    useGetCategoriesQuery,
    useGetPublicCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetBlogPostDetailQuery,
    useCreateBlogPostMutation,
    useUpdateBlogPostMutation,
    useUploadImageMutation
} = blogApi;
