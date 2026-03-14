"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import type { LatestDigitalOrder, LatestOrderStudent } from "@/lib/features/dashboard/dashboardApi";

interface DashboardTablesProps {
    latestDigitalOrders: LatestDigitalOrder[];
    latestEnrollments: LatestOrderStudent[];
}

function formatRelativeDate(dateString: string): string {
    if (!dateString) return "-";

    const targetDate = new Date(dateString);
    const today = new Date();

    const isSameDay =
        targetDate.getDate() === today.getDate() &&
        targetDate.getMonth() === today.getMonth() &&
        targetDate.getFullYear() === today.getFullYear();

    const hours = targetDate.getHours().toString().padStart(2, "0");
    const minutes = targetDate.getMinutes().toString().padStart(2, "0");

    if (isSameDay) {
        return `Bugün, ${hours}:${minutes}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        targetDate.getDate() === yesterday.getDate() &&
        targetDate.getMonth() === yesterday.getMonth() &&
        targetDate.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return `Dün, ${hours}:${minutes}`;
    }

    const day = targetDate.getDate().toString().padStart(2, "0");
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
    const year = targetDate.getFullYear();
    return `${day}.${month}.${year}`;
}

export function DashboardTables({ latestDigitalOrders, latestEnrollments }: DashboardTablesProps) {
    const displayEnrollments = latestEnrollments || [];
    const displayProductSales = latestDigitalOrders || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {/* Son Kayıtlar — Course Enrollments */}
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base font-bold text-slate-800">Son Kayıtlar</CardTitle>
                    <Link href="/dashboard/orders/courses" className="text-xs font-bold text-[#4F46E5] hover:underline">Tümünü Gör</Link>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 border-none">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-[10px] font-bold text-slate-400 w-[150px]">ÖĞRENCİ</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400">KURS</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 text-right pr-6">TARİH</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayEnrollments.length > 0 ? (
                                displayEnrollments.map((enrollmentItem) => {
                                    const enrollmentStudentName = `${enrollmentItem.first_name || ""} ${enrollmentItem.last_name || ""}`.trim() || "-";
                                    const enrollmentCourseName = enrollmentItem.course_name || "-";
                                    const formattedEnrollmentDate = formatRelativeDate(enrollmentItem.registration_date);

                                    return (
                                        <TableRow key={enrollmentItem.id} className="border-b-slate-50 last:border-none">
                                            <TableCell className="font-bold text-sm text-slate-700 pl-4 py-4">{enrollmentStudentName}</TableCell>
                                            <TableCell className="text-sm text-slate-500 py-4">{enrollmentCourseName}</TableCell>
                                            <TableCell className="text-xs text-slate-400 text-right pr-6 py-4">{formattedEnrollmentDate}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-sm text-slate-400 py-8">
                                        Kayıt bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Son Satışlar — Digital Product Sales */}
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-base font-bold text-slate-800">Son Satışlar</CardTitle>
                    <Link href="/dashboard/orders/digital-products" className="text-xs font-bold text-[#4F46E5] hover:underline">Tümünü Gör</Link>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 border-none">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-[10px] font-bold text-slate-400 w-[180px]">ÖĞRENCİ</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400">ÜRÜN</TableHead>
                                <TableHead className="text-[10px] font-bold text-slate-400 text-right pr-6">TARİH</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayProductSales.length > 0 ? (
                                displayProductSales.map((saleItem) => {
                                    const saleStudentName = `${saleItem.first_name || ""} ${saleItem.last_name || ""}`.trim() || "-";
                                    const saleProductName = saleItem.product_name || "-";
                                    const formattedSaleDate = formatRelativeDate(saleItem.order_date);

                                    return (
                                        <TableRow key={saleItem.id} className="border-b-slate-50 last:border-none">
                                            <TableCell className="font-bold text-sm text-slate-700 pl-4 py-4">{saleStudentName}</TableCell>
                                            <TableCell className="text-sm text-slate-500 py-4">{saleProductName}</TableCell>
                                            <TableCell className="text-xs text-slate-400 text-right pr-6 py-4">{formattedSaleDate}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-sm text-slate-400 py-8">
                                        Kayıt bulunamadı
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
