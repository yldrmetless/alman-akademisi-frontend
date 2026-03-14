import { configureStore } from '@reduxjs/toolkit';
import { reviewsApi } from './features/reviews/reviewsApi';
import { authApi } from './features/auth/authApi';
import { blogApi } from './features/blog/blogApi';
import { courseApi } from './features/course/courseApi';
import { ordersApi } from './features/orders/ordersApi';
import { userApi } from './features/users/userApi';
import { dashboardApi } from './features/dashboard/dashboardApi';
import examReducer from './features/course/examSlice';
import cartReducer from './features/cart/cartSlice';
import authSessionReducer from './features/auth/authSessionSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            [reviewsApi.reducerPath]: reviewsApi.reducer,
            [authApi.reducerPath]: authApi.reducer,
            [blogApi.reducerPath]: blogApi.reducer,
            [courseApi.reducerPath]: courseApi.reducer,
            [ordersApi.reducerPath]: ordersApi.reducer,
            [userApi.reducerPath]: userApi.reducer,
            [dashboardApi.reducerPath]: dashboardApi.reducer,
            examEngine: examReducer,
            cart: cartReducer,
            authSession: authSessionReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(reviewsApi.middleware)
                .concat(authApi.middleware)
                .concat(blogApi.middleware)
                .concat(courseApi.middleware)
                .concat(ordersApi.middleware)
                .concat(userApi.middleware)
                .concat(dashboardApi.middleware),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
