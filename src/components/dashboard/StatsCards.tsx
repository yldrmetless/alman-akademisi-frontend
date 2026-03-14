"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, GraduationCap, Box, Wallet } from "lucide-react";

interface StatsCardsProps {
    studentCount: number;
    courseCount: number;
    digitalProductCount: number;
    monthlyEarnings: number;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("tr-TR").format(value);
};

export function StatsCards({ studentCount, courseCount, digitalProductCount, monthlyEarnings }: StatsCardsProps) {
    const statCardItems = [
        {
            label: "Toplam Öğrenci",
            value: studentCount.toLocaleString("tr-TR"),
            icon: Users,
            iconBgColor: "bg-blue-50",
            iconTextColor: "text-blue-600",
        },
        {
            label: "Aktif Kurslar",
            value: courseCount.toLocaleString("tr-TR"),
            icon: GraduationCap,
            iconBgColor: "bg-emerald-50",
            iconTextColor: "text-emerald-600",
        },
        {
            label: "Aktif Ürünler",
            value: digitalProductCount.toLocaleString("tr-TR"),
            icon: Box,
            iconBgColor: "bg-amber-50",
            iconTextColor: "text-amber-600",
        },
        {
            label: "Aylık Gelir",
            value: `₺${formatCurrency(monthlyEarnings)}`,
            icon: Wallet,
            iconBgColor: "bg-emerald-50",
            iconTextColor: "text-emerald-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCardItems.map((statItem) => (
                <Card key={statItem.label} className="rounded-2xl border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className={`p-3 ${statItem.iconBgColor} ${statItem.iconTextColor} rounded-xl`}>
                            <statItem.icon className="h-5 w-5" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 font-medium mb-1">{statItem.label}</p>
                        <h3 className="text-3xl font-bold text-slate-800">{statItem.value}</h3>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
