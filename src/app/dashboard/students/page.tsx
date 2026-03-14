"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetStudentsQuery } from "@/lib/features/users/userApi";

function StudentsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const pageParam = searchParams.get("page");
    const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: studentListResponse, isLoading: isStudentListLoading, isFetching: isFetchingStudents } = useGetStudentsQuery(
        { page: currentPage, search: debouncedSearch },
        { skip: !isAuthorized }
    );

    const totalStudentCount = studentListResponse?.count || 0;
    const totalPages = Math.ceil(totalStudentCount / 10);
    const hasData = totalStudentCount > 0;
    const isPrevDisabled = !studentListResponse?.previous || isStudentListLoading || isFetchingStudents;
    const isNextDisabled = !studentListResponse?.next || isStudentListLoading || isFetchingStudents;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", newPage.toString());
            router.push(`?${params.toString()}`, { scroll: false });
        }
    };

    const formatRegistrationDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        );
    }

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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Öğrenci Yönetimi
                            </h1>
                        </div>
                        <Button
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Öğrenci Ekle
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Öğrenci adı veya e-posta ara..."
                            className="pl-9 bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Öğrenci Listesi</h2>
                        </div>

                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isStudentListLoading || isFetchingStudents) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[35%]">ÖĞRENCİ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[25%]">KAYIT TARİHİ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[20%]">DURUM</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase text-right w-[20%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isStudentListLoading ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <TableRow key={idx} className="animate-pulse">
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-slate-200 rounded w-36"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-48"></div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6 text-right">
                                                    <div className="h-8 w-8 bg-slate-200 rounded-md ml-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : studentListResponse?.results && studentListResponse.results.length > 0 ? (
                                        studentListResponse.results.map((student) => {
                                            const displayFullName = student.full_name || student.username;
                                            const studentEmail = student.email;
                                            const isStudentActive = student.is_active !== false;

                                            return (
                                                <TableRow
                                                    key={student.id}
                                                    className="group hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div>
                                                            <span className="font-bold text-sm text-slate-900 block">
                                                                {displayFullName}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {studentEmail}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {formatRegistrationDate(student.date_joined)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`font-medium px-2.5 py-0.5 ${isStudentActive
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                                }`}
                                                        >
                                                            {isStudentActive ? "Aktif" : "Pasif"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                {!isStudentListLoading && !isFetchingStudents && "Hiç öğrenci bulunamadı."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {hasData && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <span className="text-sm text-slate-500 font-medium">
                                    Toplam <span className="text-slate-900 font-bold">{totalStudentCount}</span> öğrenci
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-slate-600 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={isPrevDisabled}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 px-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                disabled={isStudentListLoading || isFetchingStudents}
                                                className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentPage === i + 1
                                                    ? "bg-[#4F46E5] text-white"
                                                    : "text-slate-600 hover:bg-slate-200"
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-slate-600 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={isNextDisabled}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function StudentsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        }>
            <StudentsPageContent />
        </Suspense>
    );
}
