import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Exam {
    id: number;
    name: string;
    description?: string;
    level: string | null;
    question_count: number;
    time_limit: number;
    is_active: boolean;
    created_at: string;
}

export interface ExamOption {
    id: number;
    text: string;
    is_correct: boolean;
}

export interface ExamQuestion {
    id: number;
    text: string;
    question_type: string;
    audio_url?: string | null;
    options: ExamOption[];
}

export interface ExamDetailResponse {
    exam_name: string;
    description?: string;
    time_limit: number;
    question_count: number;
    questions: ExamQuestion[];
}

export interface ExamListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Exam[];
}

export interface DigitalProduct {
    id: number;
    name: string;
    description?: string;
    price: string | number;
    discounted_price?: string | number | null;
    stock: number;
    status: string;
    main_image: {
        url: string;
    } | null;
    format?: string;
    file_size_mb?: number;
    created_at: string;
}

export interface DigitalProductListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: DigitalProduct[];
}

export interface CourseCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    is_deleted?: boolean;
    created_at: string;
}

export interface CourseCategoryListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CourseCategory[];
}

export interface Course {
    id: number;
    name: string;
    description?: string;
    level: string | null;
    type: string;
    price: string | number;
    discounted_price?: string | number | null;
    image_url?: string | null;
    category?: number;
    category_name?: string;
    start_date?: string;
    end_date?: string;
    first_day?: string;
    last_day?: string;
    start_time?: string;
    end_time?: string;
    quota?: number;
    registered?: number;
    registered_count?: number;
    registered_students?: number;
    tags?: string[];
    education_link?: string;
    is_active: boolean;
    created_at: string;
}

export interface CourseListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Course[];
}

export interface DigitalProductDetailImage {
    id: number;
    digital_product_image_url: string;
    is_primary?: boolean;
}

export interface DigitalProductDetailData {
    id: number;
    name: string;
    description: string;
    price: string | number;
    discounted_price: string | number | null;
    stock: number;
    status: string;
    format: string;
    category?: any;
    tags?: any;
    external_link?: string;
    download_limit?: number | null;
    images: DigitalProductDetailImage[];
}

export interface DigitalProductDetailResponse {
    data: DigitalProductDetailData;
    message?: string;
}

export interface DigitalCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    is_deleted?: boolean;
    created_at: string;
}

export interface DigitalCategoryListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: DigitalCategory[];
}

export const courseApi = createApi({
    reducerPath: 'courseApi',
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        prepareHeaders: (headers, { endpoint }) => {
            const authEndpoints = ['editExam', 'updateExam', 'createQuestion', 'updateExamQuestions', 'createExam', 'getDigitalCategories', 'createDigitalCategory', 'updateDigitalCategory', 'getDigitalProductDetail', 'updateDigitalProduct', 'createDigitalProduct', 'deleteCourse', 'createCourseCategory', 'editCourseCategory', 'softDeleteCategory'];
            if (authEndpoints.includes(endpoint)) {
                const token =
                    typeof window !== 'undefined'
                        ? localStorage.getItem("access_token") || localStorage.getItem("access")
                        : null;
                if (token) {
                    headers.set('authorization', `Bearer ${token}`);
                }
            }
            return headers;
        },
    }),
    tagTypes: ['Exams', 'DigitalProducts', 'DigitalCategories', 'Courses'],
    endpoints: (builder) => ({
        getExams: builder.query<ExamListResponse, { page?: number; name?: string; level?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.name) queryParams.name = params.name;
                if (params.level && params.level !== "Tümü") queryParams.level = params.level;

                return {
                    url: 'courses/exam-list/',
                    params: queryParams,
                };
            },
            providesTags: ['Exams'],
        }),
        getDigitalProducts: builder.query<DigitalProductListResponse, { page?: number; search?: string; status?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;
                if (params.status && params.status !== "all") queryParams.status = params.status;

                return {
                    url: 'products/list-digital-products/',
                    params: queryParams,
                };
            },
            providesTags: ['DigitalProducts'],
        }),
        getCourseCategories: builder.query<CourseCategoryListResponse, { page?: number; search?: string; ordering?: string; token?: string | null }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;
                if (params.ordering) queryParams.ordering = params.ordering;

                // Fallback to localStorage if token is not explicitly passed
                const token = params.token || (typeof window !== 'undefined' ? localStorage.getItem('access') : null);

                return {
                    url: 'courses/course-category-list/',
                    params: queryParams,
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                };
            },
            providesTags: ['Courses'],
        }),
        createCourseCategory: builder.mutation<any, { name: string; is_active: boolean }>({
            query: (body) => ({
                url: 'courses/create-course-category/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Courses'],
        }),
        editCourseCategory: builder.mutation<any, { id: number | string; body: Partial<CourseCategory> }>({
            query: ({ id, body }) => ({
                url: `courses/edit-course-category/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Courses'],
        }),
        softDeleteCategory: builder.mutation<any, { id: number | string; body: any }>({
            query: ({ id, body }) => ({
                url: `courses/edit-course-category/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Courses'],
        }),
        getDigitalCategories: builder.query<DigitalCategoryListResponse, { page?: number; search?: string; ordering?: string }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.search) queryParams.search = params.search;
                if (params.ordering) queryParams.ordering = params.ordering;

                const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

                return {
                    url: 'products/digital-product-categories/',
                    params: queryParams,
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                };
            },
            providesTags: ['DigitalCategories'],
        }),
        createDigitalCategory: builder.mutation<any, { name: string }>({
            query: (body) => ({
                url: 'products/create-digital-product-category/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['DigitalCategories'],
        }),
        updateDigitalCategory: builder.mutation<any, { id: number | string; body: Partial<DigitalCategory> }>({
            query: ({ id, body }) => ({
                url: `products/digital-product-categories/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['DigitalCategories'],
        }),
        getExamQuestions: builder.query<ExamDetailResponse, string | number>({
            query: (id) => `courses/exam-questions/${id}/`,
            providesTags: ['Exams'],
        }),
        getDigitalProductDetail: builder.query<DigitalProductDetailResponse, string | number>({
            query: (id) => `products/digital-product-detail/${id}/`,
            providesTags: ['DigitalProducts'],
        }),
        getDigitalProductDetailCustomer: builder.query<DigitalProductDetailResponse, string | number>({
            query: (id) => `products/digital-product-detail-customer/${id}/`,
            providesTags: ['DigitalProducts'],
        }),
        updateDigitalProduct: builder.mutation<any, { id: number | string; body: any }>({
            query: ({ id, body }) => ({
                url: `products/edit-digital-product/${id}/`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body,
            }),
            invalidatesTags: ['DigitalProducts'],
        }),
        createDigitalProduct: builder.mutation<any, any>({
            query: (body) => ({
                url: 'products/create-digital-product/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['DigitalProducts'],
        }),
        updateExam: builder.mutation<any, { id: number | string; body: Partial<ExamDetailResponse> }>({
            query: ({ id, body }) => ({
                url: `courses/exam-update/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Exams'],
        }),

        editExam: builder.mutation<any, { id: number | string; body: any }>({
            query: ({ id, body }) => ({
                url: `courses/edit-exam/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Exams'],
        }),
        createExam: builder.mutation<any, any>({
            query: (body) => ({
                url: `courses/create-exam/`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Exams'],
        }),
        createQuestion: builder.mutation<any, FormData>({
            query: (formData) => ({
                url: 'courses/question-create/',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Exams'],
        }),
        updateExamQuestions: builder.mutation<any, { examId: string | number; formData: FormData }>({
            query: ({ examId, formData }) => ({
                url: `courses/exam-questions-update/${examId}/`,
                method: 'POST', // Handle both bulk update & new logic as multipart POST
                body: formData,
            }),
            invalidatesTags: ['Exams'],
        }),
        getCourseList: builder.query<CourseListResponse, { page?: number; name?: string; level?: string; type?: string; ordering?: string; available?: boolean }>({
            query: (params) => {
                const queryParams: Record<string, string | number> = {};
                if (params.page) queryParams.page = params.page;
                if (params.name) queryParams.name = params.name;
                if (params.level && params.level !== "all") queryParams.level = params.level;
                if (params.type && params.type !== "all") queryParams.type = params.type;
                if (params.ordering) queryParams.ordering = params.ordering;
                if (typeof params.available === "boolean") queryParams.available = params.available ? "true" : "false";

                const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

                return {
                    url: 'courses/course-list/',
                    params: queryParams,
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                };
            },
            providesTags: ['Courses'],
        }),
        deleteCourse: builder.mutation<any, { id: number | string; body: any }>({
            query: ({ id, body }) => ({
                url: `courses/edit-course/${id}/`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Courses'],
        }),
        createCourse: builder.mutation<any, Partial<any>>({
            query: (body) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
                return {
                    url: `courses/create-course/`,
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body,
                };
            },
            invalidatesTags: ['Courses'],
        }),
        editCourse: builder.mutation<any, { id: string; body: Partial<any> }>({
            query: ({ id, body }) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
                return {
                    url: `courses/edit-course/${id}/`,
                    method: 'PATCH',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body,
                };
            },
            invalidatesTags: ['Courses'],
        }),
        getInstructors: builder.query<{ id: number; request_user: { first_name: string; last_name: string } }[], void>({
            query: () => `courses/instructors/`,
        }),
        getCourseDetail: builder.query<Course, string>({
            query: (id) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
                return {
                    url: `courses/course-detail/${id}/`,
                    method: 'GET',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                };
            },
            providesTags: (result, error, id) => [{ type: 'Courses', id }],
        }),
    }),
});

export const {
    useGetExamsQuery,
    useGetExamQuestionsQuery,
    useUpdateExamMutation,
    useEditExamMutation,
    useCreateExamMutation,
    useCreateQuestionMutation,
    useUpdateExamQuestionsMutation,
    useGetDigitalProductsQuery,
    useGetDigitalProductDetailQuery,
    useGetDigitalProductDetailCustomerQuery,
    useGetDigitalCategoriesQuery,
    useGetCourseCategoriesQuery,
    useCreateCourseCategoryMutation,
    useEditCourseCategoryMutation,
    useSoftDeleteCategoryMutation,
    useCreateDigitalCategoryMutation,
    useUpdateDigitalCategoryMutation,
    useUpdateDigitalProductMutation,
    useCreateDigitalProductMutation,
    useGetCourseListQuery,
    useDeleteCourseMutation,
    useCreateCourseMutation,
    useEditCourseMutation,
    useGetCourseDetailQuery,
    useGetInstructorsQuery,
} = courseApi;
