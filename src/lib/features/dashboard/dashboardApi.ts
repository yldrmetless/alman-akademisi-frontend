import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface LatestDigitalOrder {
    id: number;
    first_name: string;
    last_name: string;
    product_name: string;
    order_date: string;
}

export interface LatestOrderStudent {
    id: number;
    first_name: string;
    last_name: string;
    course_name: string;
    registration_date: string;
}

export interface DashboardAnalytics {
    student_count: number;
    course_count: number;
    digital_product_count: number;
    monthly_earnings: number;
    monthly_course_sales: Record<string, number>[];
    monthly_digital_sales: Record<string, number>[];
    latest_digital_orders: LatestDigitalOrder[];
    latest_order_students: LatestOrderStudent[];
}

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
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
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        getDashboardAnalytics: builder.query<DashboardAnalytics, void>({
            query: () => 'products/dashboard/',
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardAnalyticsQuery } = dashboardApi;
