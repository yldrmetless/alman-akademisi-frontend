"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardTables } from "@/components/dashboard/DashboardTables";
import { Loader2 } from "lucide-react";
import { useGetDashboardAnalyticsQuery } from "@/lib/features/dashboard/dashboardApi";

export default function DashboardPage() {
    const { isAuthorized, isLoading, profile, token } = useAuthGuard("admin");

    const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardAnalyticsQuery(undefined, {
        skip: !isAuthorized,
    });

    // Auth Guard Priority: explicitly hold until layout verifies discovery
    if (isLoading || !token || !isAuthorized || !profile) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-[#FAFBFF] space-y-6">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFBFF] relative flex flex-col items-start lg:flex-row">
            <Sidebar
                firstName={profile.first_name || ""}
                lastName={profile.last_name || ""}
                username={profile.username || ""}
            />

            <main className="w-full lg:ml-72 transition-all duration-300 min-h-screen flex flex-col">
                <div className="p-6 sm:p-8 lg:p-10 max-w-[1400px] w-full mx-auto flex-1">
                    <div className="mb-8 pt-1 sm:pt-0 pl-[4.5rem] lg:pl-0 lg:pt-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Yönetici Paneli</h1>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">Hoş geldiniz, işte bugünkü verileriniz.</p>
                    </div>

                    {isDashboardLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
                        </div>
                    ) : (
                        <>
                            <StatsCards
                                studentCount={dashboardData?.student_count || 0}
                                courseCount={dashboardData?.course_count || 0}
                                digitalProductCount={dashboardData?.digital_product_count || 0}
                                monthlyEarnings={dashboardData?.monthly_earnings || 0}
                            />

                            <div className="mb-6">
                                <DashboardCharts
                                    monthlyCourseSales={dashboardData?.monthly_course_sales || []}
                                    monthlyDigitalSales={dashboardData?.monthly_digital_sales || []}
                                />
                            </div>

                            <div>
                                <DashboardTables
                                    latestDigitalOrders={dashboardData?.latest_digital_orders || []}
                                    latestEnrollments={dashboardData?.latest_order_students || []}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
