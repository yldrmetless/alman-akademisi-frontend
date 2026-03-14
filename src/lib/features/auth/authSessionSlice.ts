import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export interface AuthUser {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    user_type: string;
}

interface AuthSessionState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
}

const initialState: AuthSessionState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,
};

const authSessionSlice = createSlice({
    name: "authSession",
    initialState,
    reducers: {
        setAuthSession: (
            state,
            action: PayloadAction<{ user: AuthUser; token: string | null }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isInitialized = true;
        },
        clearAuthSession: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
        },
        setAuthInitialized: (state) => {
            state.isInitialized = true;
        },
    },
});

export const { setAuthSession, clearAuthSession, setAuthInitialized } = authSessionSlice.actions;
export default authSessionSlice.reducer;

export const selectAuthUser = (state: RootState) => state.authSession.user;
export const selectIsAuthenticated = (state: RootState) => state.authSession.isAuthenticated;
export const selectIsAuthInitialized = (state: RootState) => state.authSession.isInitialized;
