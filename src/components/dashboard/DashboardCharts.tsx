"use client";

import { Bar, BarChart, CartesianGrid, XAxis, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const MONTH_SHORT_NAMES: Record<string, string> = {
    january: "OCA",
    february: "ŞUB",
    march: "MAR",
    april: "NİS",
    may: "MAY",
    june: "HAZ",
    july: "TEM",
    august: "AĞU",
    september: "EYL",
    october: "EKİ",
    november: "KAS",
    december: "ARA",
};

interface ChartDataPoint {
    month: string;
    sales: number;
}

function transformMonthlyData(monthlyDataArray: Record<string, number>[]): ChartDataPoint[] {
    if (!monthlyDataArray || !Array.isArray(monthlyDataArray)) return [];

    return monthlyDataArray.map((monthEntry) => {
        const [monthKey, salesValue] = Object.entries(monthEntry)[0];
        const monthLabel = MONTH_SHORT_NAMES[monthKey.toLowerCase()] || monthKey.toUpperCase().slice(0, 3);
        return {
            month: monthLabel,
            sales: salesValue || 0,
        };
    });
}

const barConfig = {
    sales: {
        label: "Kurs Satışları",
        color: "#4F46E5",
    },
} satisfies ChartConfig;

const areaConfig = {
    sales: {
        label: "Dijital Eser",
        color: "#10b981",
    },
} satisfies ChartConfig;

interface DashboardChartsProps {
    monthlyCourseSales: Record<string, number>[];
    monthlyDigitalSales: Record<string, number>[];
}

export function DashboardCharts({ monthlyCourseSales, monthlyDigitalSales }: DashboardChartsProps) {
    const transformedCourseChartData = transformMonthlyData(monthlyCourseSales);
    const transformedDigitalChartData = transformMonthlyData(monthlyDigitalSales);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart — Aylık Kurs Satışları */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                    <CardTitle className="text-base font-bold text-slate-800">Aylık Kurs Satışları</CardTitle>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Son 6 Ay</span>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barConfig} className="min-h-[250px] w-full">
                        <BarChart accessibilityLayer data={transformedCourseChartData} margin={{ left: -20, right: 12 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-[10px] font-bold fill-slate-400"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Area Chart — Aylık Dijital Eser Satışları */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                    <CardTitle className="text-base font-bold text-slate-800">Aylık Dijital Eser Satışları</CardTitle>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Son 6 Ay</span>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={areaConfig} className="min-h-[250px] w-full">
                        <AreaChart accessibilityLayer data={transformedDigitalChartData} margin={{ left: -20, right: 12 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-[10px] font-bold fill-slate-400"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="line" />} />
                            <Area
                                type="natural"
                                dataKey="sales"
                                fill="var(--color-sales)"
                                fillOpacity={0.1}
                                stroke="var(--color-sales)"
                                strokeWidth={4}
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
