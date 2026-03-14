"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
            </div>
        );
    }

    const isDigitalTabActive = pathname === "/dashboard/orders/digital-products";
    // We treat anything under courses or other paths as not digital
    const isCoursesTabActive = pathname === "/dashboard/orders/courses";

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-8">
                    {/* Header Section */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Siparişler
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Müşteri siparişlerinizi ve ödeme durumlarını buradan takip edebilirsiniz.
                        </p>
                    </div>

                    {/* Capsule Tabs */}
                    <div className="space-y-6">
                        <div className="bg-slate-100/80 p-1 min-w-[300px] sm:min-w-fit rounded-full h-auto inline-flex">
                            <Link
                                href="/dashboard/orders/digital-products"
                                className={`flex-1 sm:flex-none rounded-full px-6 py-2.5 font-medium text-sm transition-all text-center ${isDigitalTabActive
                                        ? "bg-[#1A3EB1] text-white shadow-sm hover:text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Dijital Eserler
                            </Link>
                            <Link
                                href="/dashboard/orders/courses"
                                className={`flex-1 sm:flex-none rounded-full px-6 py-2.5 font-medium text-sm transition-all text-center ${isCoursesTabActive
                                        ? "bg-[#1A3EB1] text-white shadow-sm hover:text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Kurslar
                            </Link>
                        </div>

                        {/* Content Area */}
                        <div>{children}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
