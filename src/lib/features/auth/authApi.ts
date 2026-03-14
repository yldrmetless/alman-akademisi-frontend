import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface LoginRequest {
    username_or_email: string;
    password?: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    expires_time: number;
}

export interface RegisterRequest {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password: string;
    password_confirm: string;
}

export interface RegisterResponse {
    // Define according to your backend response for register, assuming simple success for now
    message?: string;
}

export interface UserProfileResponse {
    id?: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    user_type: string;
    phone?: string | null;
    avatar_url?: string | null;
    avatar_url_id?: string | null;
}

export interface StudentDashboardResponse {
    total_orders_count: number;
    total_products_count: number;
    completed_course_count: number;
}

export interface CourseOrder {
    id: number;
    merchant_oid: string;
    course_name: string;
    course_level: string;
    course_type: string;
    total_amount: string;
    status: string;
    refund_requested?: boolean;
    created_at: string;
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
    product_name: string;
    product_image: string;
    purchase_price: string;
    status: string;
    refund_requested?: boolean;
    created_at: string;
}

export interface DigitalProductOrderListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: DigitalProductOrder[];
}

export interface UserAddress {
    city: string;
    district: string;
    neighborhood: string;
    full_address: string;
    address_title: string;
    first_name: string;
    last_name: string;
    phone: string;
    zip_code: string;
}



export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers) => {
            // Because this might run on the server if not careful, wrap in typeof window
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('access');
                if (token) {
                    headers.set('authorization', `Bearer ${token}`);
                }
            }
            return headers;
        }
    }),
    tagTypes: ['Profile', 'StudentOrders', 'DigitalOrders', 'Address'],
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: 'users/login/',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (userData) => ({
                url: 'users/register/',
                method: 'POST',
                body: userData,
                validateStatus: (response, result) =>
                    response.status === 200 || response.status === 201 || (!response.status && result),
            }),
        }),
        getProfile: builder.query<UserProfileResponse, void>({
            query: () => 'users/profile/',
            providesTags: ['Profile'],
        }),
        getStudentDashboard: builder.query<StudentDashboardResponse, void>({
            query: () => 'users/student-dashboard/',
        }),
        getMyCourseOrders: builder.query<CourseOrderListResponse, void>({
            query: () => 'users/my-course-order/',
            providesTags: ['StudentOrders'],
        }),
        getMyDigitalProductsOrder: builder.query<DigitalProductOrderListResponse, void>({
            query: () => 'users/my-digital-products-order/',
            providesTags: ['DigitalOrders'],
        }),
        editProfile: builder.mutation<{ message: string; status?: number }, {
            first_name?: string;
            last_name?: string;
            email?: string;
            username?: string;
            phone?: string;
            current_password?: string;
            new_password?: string;
            is_deleted?: boolean;
            avatar_url?: string;
            avatar_url_id?: string;
        }>({
            query: (profileData) => ({
                url: 'users/edit-profile/',
                method: 'PATCH',
                body: profileData,
                validateStatus: (response, result) =>
                    response.status === 200 && result?.message !== undefined,
            }),
            invalidatesTags: ['Profile'],
        }),
        getAddress: builder.query<{ id?: number, address_data?: UserAddress }, void>({
            query: () => 'users/address-get/',
            providesTags: ['Address'],
        }),
        createAddress: builder.mutation<{ message: string }, Partial<UserAddress>>({
            query: (addressData) => ({
                url: 'users/address-create/',
                method: 'POST',
                body: { address_data: addressData },
            }),
            invalidatesTags: ['Address'],
        }),
        updateAddress: builder.mutation<{ message: string }, { id: number, addressData: UserAddress }>({
            query: ({ id, addressData }) => ({
                url: `users/address-detail/${id}/`,
                method: 'PATCH',
                body: { address_data: addressData },
            }),
            invalidatesTags: ['Address'],
        }),
        deleteAddress: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `users/address-detail/${id}/`,
                method: 'PATCH',
                body: { address_data: null },
            }),
            invalidatesTags: ['Address'],
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery, useLazyGetProfileQuery, useEditProfileMutation, useGetStudentDashboardQuery, useGetMyCourseOrdersQuery, useGetMyDigitalProductsOrderQuery, useGetAddressQuery, useCreateAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } = authApi;
