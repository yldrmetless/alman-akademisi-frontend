"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useGetCourseListQuery, useDeleteCourseMutation, Course } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";

function CoursesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const pageParam = searchParams.get("page");
    const [page, setPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [ordering, setOrdering] = useState("-created_at");

    // Delete Modal State
    const [deleteCourse, { isLoading: isDeletingCourse }] = useDeleteCourseMutation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCourseForDelete, setSelectedCourseForDelete] = useState<Course | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: courseListResponse, isLoading: isCourseListLoading, isFetching: isFetchingCourses } = useGetCourseListQuery({
        page,
        name: debouncedSearch,
        level: levelFilter,
        type: typeFilter,
        ordering,
    }, {
        skip: !isAuthorized
    });

    const totalPages = Math.ceil((courseListResponse?.count || 0) / 10);
    const hasData = (courseListResponse?.count || 0) > 0;
    const isPrevDisabled = !courseListResponse?.previous || isCourseListLoading || isFetchingCourses;
    const isNextDisabled = !courseListResponse?.next || isCourseListLoading || isFetchingCourses;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", newPage.toString());
            router.push(`?${params.toString()}`, { scroll: false });
        }
    };

    const handleRowClick = (courseId: number) => {
        router.push(`/dashboard/courses/detail/${courseId}`);
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourseForDelete) return;

        try {
            const response = await deleteCourse({
                id: selectedCourseForDelete.id,
                body: { is_deleted: true }
            }).unwrap();

            toast.success(response?.message || "Kurs başarıyla silindi");
            setIsDeleteModalOpen(false);
            setSelectedCourseForDelete(null);
        } catch (error: any) {
            toast.error(error?.data?.message || "Kurs silinirken bir hata oluştu");
        }
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
                                Kurs Yönetimi
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Aktif kurslarınızı ve eğitim içeriklerinizi buradan yönetebilirsiniz.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push("/dashboard/courses/create-courses")}
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Kurs Ekle
                        </Button>
                    </div>

                    {/* Table Card container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 space-y-4">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                <div className="relative w-full xl:w-80 shrink-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Eser adı ara..."
                                        className="pl-9 bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
                                    <Select value={levelFilter} onValueChange={(val) => { setLevelFilter(val); setPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[140px] border-slate-200 focus:ring-[#4F46E5]">
                                            <SelectValue placeholder="Seviye" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tümü (Seviye)</SelectItem>
                                            <SelectItem value="A1">A1</SelectItem>
                                            <SelectItem value="A2">A2</SelectItem>
                                            <SelectItem value="B1">B1</SelectItem>
                                            <SelectItem value="B2">B2</SelectItem>
                                            <SelectItem value="C1">C1</SelectItem>
                                            <SelectItem value="C2">C2</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[150px] border-slate-200 focus:ring-[#4F46E5]">
                                            <SelectValue placeholder="Kurs Türü" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tümü (Tür)</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={ordering} onValueChange={(val) => { setOrdering(val); setPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[180px] border-slate-200 focus:ring-[#4F46E5] font-medium">
                                            <SelectValue placeholder="Sıralama" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-created_at">Yeniden Eskiye</SelectItem>
                                            <SelectItem value="created_at">Eskiden Yeniye</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isCourseListLoading || isFetchingCourses) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[35%]">KURS ADI</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[15%] text-center">SEVİYE</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%]">KURS TÜRÜ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[15%]">FİYAT</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 text-right w-[15%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courseListResponse?.results && courseListResponse.results.length > 0 ? (
                                        courseListResponse.results.map((course) => (
                                            <TableRow
                                                key={course.id}
                                                className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                                onClick={() => handleRowClick(course.id)}
                                            >
                                                <TableCell className="border-b border-slate-100 py-3 px-4 lg:px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-16 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 relative border border-slate-200 flex items-center justify-center">
                                                            {course.image_url ? (
                                                                <Image
                                                                    src={course.image_url}
                                                                    alt={course.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="h-6 w-6 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-900">{course.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-3 px-4 lg:px-6 text-center">
                                                    {course.level ? (
                                                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2.5 py-0.5 border-none shadow-none">
                                                            {course.level}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-3 px-4 lg:px-6">
                                                    <span className="font-medium text-slate-700 text-sm capitalize">{course.type}</span>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-3 px-4 lg:px-6">
                                                    <div className="flex flex-col">
                                                        {Number(course.discounted_price) > 0 ? (
                                                            <>
                                                                <span className="text-xs text-slate-400 line-through">
                                                                    {Number(course.price).toLocaleString('tr-TR')} ₺
                                                                </span>
                                                                <span className="font-bold text-sm text-slate-900">
                                                                    {Number(course.discounted_price).toLocaleString('tr-TR')} ₺
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-bold text-sm text-slate-900">
                                                                {Number(course.price).toLocaleString('tr-TR')} ₺
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right border-b border-slate-100 py-3 px-4 lg:px-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCourseForDelete(course);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                {!isCourseListLoading && !isFetchingCourses && "Hiç kurs bulunamadı."}
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
                                    Toplam <span className="text-slate-900 font-bold">{courseListResponse?.count || 0}</span> kurs gösteriliyor
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-slate-600 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={isPrevDisabled}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 px-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                disabled={isCourseListLoading || isFetchingCourses}
                                                className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${page === i + 1
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
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={isNextDisabled}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Delete Course Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Kursu Sil</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-slate-600 text-sm">
                                Bu kursu silmek istediğinize emin misiniz? Bu işlem geri alınamaz (soft delete olarak işaretlenir).
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isDeletingCourse}
                            >
                                İptal Et
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteCourse}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeletingCourse}
                            >
                                {isDeletingCourse ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Evet, Sil"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
}

export default function CoursesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        }>
            <CoursesPageContent />
        </Suspense>
    );
}
