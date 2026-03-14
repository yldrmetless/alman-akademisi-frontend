import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CourseOrder {
    id: number;
    merchant_oid: string;
    first_name: string;
    last_name: string;
    email: string;
    course_name: string;
    course_type: string;
    order_date: string;
    total_amount: string | number;
    status: string;
    refund_requested?: boolean;
}

export interface CourseOrderListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CourseOrder[];
}

export interface DigitalProductOrder {
    id: number;
    merchant_oid: string;
    first_name: string;
    last_name: string;
    email: string;
    product_name: string;
    order_date: string;
    total_amount: string | number;
    status: string;
    refund_requested?: boolean;
}

export interface OrderListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: DigitalProductOrder[];
}

export const ordersApi = createApi({
    reducerPath: 'ordersApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers, { endpoint }) => {
            const authEndpoints = ['getDigitalProductOrders', 'getCourseOrders', 'approveRefund', 'approveCourseRefund'];
            if (authEndpoints.includes(endpoint)) {
                const token =
                    typeof window !== 'undefined'
                        ? localStorage.getItem("access_token") || localStorage.getItem("access")
                        : null;
                if (token) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
            }
            return headers;
        },
    }),
    tagTypes: ['Orders'],
    endpoints: (builder) => ({
        getDigitalProductOrders: builder.query<OrderListResponse, { page?: number; search?: string; status?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;
                if (params.status && params.status !== "all") queryParams.status = params.status;
                if (params.ordering) queryParams.ordering = params.ordering;

                return {
                    url: 'products/admin/products-orders/',
                    params: queryParams,
                };
            },
            providesTags: ['Orders'],
        }),
        getCourseOrders: builder.query<CourseOrderListResponse, { page?: number; search?: string; status?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;
                if (params.status && params.status !== "all") queryParams.status = params.status;
                if (params.ordering) queryParams.ordering = params.ordering;

                return {
                    url: 'courses/admin-course-orders/',
                    params: queryParams,
                };
            },
            providesTags: ['Orders'],
        }),
        approveRefund: builder.mutation<any, { merchant_oid: string; data: { message: string; status: string } }>({
            query: ({ merchant_oid, data }) => ({
                url: `products/admin/refund-requests/${merchant_oid}/`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Orders'],
        }),
        approveCourseRefund: builder.mutation<any, string>({
            query: (merchant_oid) => ({
                url: `courses/admin-refund/${merchant_oid}/`,
                method: 'POST',
            }),
            invalidatesTags: ['Orders'],
        }),
    }),
});

export const {
    useGetDigitalProductOrdersQuery,
    useGetCourseOrdersQuery,
    useApproveRefundMutation,
    useApproveCourseRefundMutation,
} = ordersApi;
