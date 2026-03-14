"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetProfileQuery, UserProfileResponse } from "@/lib/features/auth/authApi";

export function useAuthGuard(requiredRole: string = "admin") {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    // 1. Initial token check on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("access");
            setToken(storedToken);
            setIsCheckingToken(false);

            if (!storedToken) {
                router.push("/login");
            }
        }
    }, [router]);

    // 2. Explicit Fetch Trigger only when token exists
    const { data, isLoading, error } = useGetProfileQuery(undefined, {
        skip: !token,
    });

    const [isAuthorized, setIsAuthorized] = useState(false);

    // 3. Guard Logic Separation
    useEffect(() => {
        if (isCheckingToken) return;

        if (!token) {
            router.push("/login");
            return;
        }

        if (isLoading) return;

        if (error) {
            console.error("Auth check failed:", error);
            // Ignore token wipes on loose fetch errors, only clear on explicit unauthorized/forbidden
            if ((error as any)?.status === 401 || (error as any)?.status === 403) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                localStorage.removeItem("expires_time");
                router.push("/login");
            }
            return;
        }

        // 1. Null-Safety Check
        if (data) {
            if (data.user_type === requiredRole) {
                setIsAuthorized(true);
            } else {
                router.push("/"); // E.g., student goes to landing page
            }
        }
    }, [data, isLoading, error, token, router, requiredRole, isCheckingToken]);

    return {
        isAuthorized,
        isLoading: isLoading || isCheckingToken,
        profile: data,
        token
    };
}
