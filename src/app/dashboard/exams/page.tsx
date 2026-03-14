"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

import { useGetExamsQuery, useEditExamMutation } from "@/lib/features/course/courseApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";



export default function ExamsManagementPage() {
    const router = useRouter();

    // Only verify basic Admin authentication without mapping a token payload since this endpoint is strictly public
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedName, setDebouncedName] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

    const { data: examData, isLoading: isExamsLoading, isFetching } = useGetExamsQuery(
        { page, name: debouncedName },
        { skip: !isAuthorized }
    );
    const [editExam, { isLoading: isDeleting }] = useEditExamMutation();

    const handleSoftDelete = async () => {
        if (!selectedExamId) return;
        try {
            await editExam({ id: selectedExamId, body: { is_deleted: true } }).unwrap();
            toast.success("Sınav başarıyla silindi");
            setIsDeleteModalOpen(false);
            setSelectedExamId(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.data?.message || "Bir hata oluştu.");
        }
    };

    // 400ms Debounce constraint protecting our RTK API
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedName(searchTerm);
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
            </div>
        );
    }

    const itemsPerPage = 10;
    const totalCount = examData?.count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    const generatePageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0">
                <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            Deneme Sınavları
                        </h1>
                        <Button
                            onClick={() => router.push('/dashboard/exams/create')}
                            className="cursor-pointer bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Sınav Oluştur
                        </Button>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 flex justify-end">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Sınav adı ara..."
                                    className="pl-9 bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isExamsLoading || isFetching) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[35%]">SINAV ADI</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[15%]">SEVİYE</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%] text-center">SORU SAYISI</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%] text-center">SÜRE (DAKİKA)</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 text-right w-[10%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {examData?.results && examData.results.length > 0 ? (
                                        examData.results.map((exam) => {
                                            return (
                                                <TableRow
                                                    key={exam.id}
                                                    className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                                                    onClick={() => router.push(`/dashboard/exams/detail/${exam.id}`)}
                                                >
                                                    <TableCell className="font-bold text-sm text-slate-900 border-b border-slate-100 py-4 lg:py-5 px-4 lg:px-6">
                                                        {exam.name}
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        {exam.level ? (
                                                            <Badge variant="secondary" className="bg-blue-50 text-[#1A3EB1] hover:bg-blue-100 font-bold whitespace-nowrap">
                                                                {exam.level}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        {exam.question_count}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        {exam.time_limit}
                                                    </TableCell>
                                                    <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div className="flex justify-end gap-1.5 sm:gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="cursor-pointer h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedExamId(exam.id);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500 border-b-0">
                                                Deneme sınavı bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Area */}
                        {totalPages > 0 && (
                            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-4 bg-white">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                    >
                                        <ChevronLeft className="h-4 w-4 text-slate-500" />
                                    </Button>

                                    {generatePageNumbers().map(pageNum => (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "ghost"}
                                            size="icon"
                                            onClick={() => setPage(pageNum)}
                                            className={`h-8 w-8 text-sm font-medium rounded-md ${pageNum === page
                                                ? "bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            {pageNum}
                                        </Button>
                                    ))}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                    >
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sınavı Sil</DialogTitle>
                        <DialogDescription>
                            Bu deneme sınavını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedExamId(null);
                            }}
                            disabled={isDeleting}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSoftDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
