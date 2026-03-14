"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useGetStudentReviewsQuery, useDeleteStudentReviewMutation, useUpdateStudentReviewMutation, useCreateStudentReviewMutation } from "@/lib/features/users/userApi";
import type { StudentReview } from "@/lib/features/users/userApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

function StudentReviewsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const pageParam = searchParams.get("page");
    const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReviewForDelete, setSelectedReviewForDelete] = useState<StudentReview | null>(null);

    const { data: reviewListResponse, isLoading: isReviewListLoading, isFetching: isFetchingReviews, error: reviewFetchError } = useGetStudentReviewsQuery(
        { page: currentPage },
        { skip: !isAuthorized }
    );

    const [deleteReview, { isLoading: isDeletingReview }] = useDeleteStudentReviewMutation();
    const [updateReview, { isLoading: isUpdatingReview }] = useUpdateStudentReviewMutation();

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<StudentReview | null>(null);
    const [editReviewName, setEditReviewName] = useState("");
    const [editReviewUrl, setEditReviewUrl] = useState("");
    const [editReviewType, setEditReviewType] = useState<"think" | "lesson">("think");

    // Create modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newReviewName, setNewReviewName] = useState("");
    const [newReviewUrl, setNewReviewUrl] = useState("");
    const [newReviewType, setNewReviewType] = useState<"think" | "lesson">("think");
    const [createReview, { isLoading: isCreatingReview }] = useCreateStudentReviewMutation();

    // Show toast on API error (401, 404, etc.)
    useEffect(() => {
        if (reviewFetchError) {
            const errorStatus = (reviewFetchError as any)?.status;
            if (errorStatus === 401) {
                toast.error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
            } else if (errorStatus === 404) {
                toast.error("Yorum listesi bulunamadı.");
            } else {
                toast.error("Yorumlar yüklenirken bir hata oluştu.");
            }
        }
    }, [reviewFetchError]);

    const totalReviewCount = reviewListResponse?.count || 0;
    const totalPages = Math.ceil(totalReviewCount / 10);
    const hasData = totalReviewCount > 0;
    const isPrevDisabled = !reviewListResponse?.previous || isReviewListLoading || isFetchingReviews;
    const isNextDisabled = !reviewListResponse?.next || isReviewListLoading || isFetchingReviews;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", newPage.toString());
            router.push(`?${params.toString()}`, { scroll: false });
        }
    };

    const formatReviewDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const handleDeleteReview = async () => {
        if (!selectedReviewForDelete) return;
        try {
            const deleteResponse = await deleteReview({ id: selectedReviewForDelete.id }).unwrap();
            const deleteSuccessMessage = deleteResponse?.message || "Yorum başarıyla silindi.";
            toast.success(deleteSuccessMessage);
            setIsDeleteModalOpen(false);
            setSelectedReviewForDelete(null);
        } catch (error: any) {
            const serverErrorMessage = error?.data?.detail || error?.data?.message;
            toast.error(serverErrorMessage || "Yorum silinirken bir hata oluştu.");
        }
    };

    const handleOpenEditModal = (review: StudentReview) => {
        setSelectedReviewForEdit(review);
        setEditReviewName(review.name || "");
        setEditReviewUrl(review.youtube_url || "");
        setEditReviewType(review.type === "lesson" ? "lesson" : "think");
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedReviewForEdit(null);
        setEditReviewName("");
        setEditReviewUrl("");
        setEditReviewType("think");
    };

    const handleUpdateSubmit = async () => {
        if (!selectedReviewForEdit) return;

        const updatedReviewData: Record<string, string> = {};
        if (editReviewName !== (selectedReviewForEdit.name || "")) {
            updatedReviewData.name = editReviewName;
        }
        if (editReviewUrl !== (selectedReviewForEdit.youtube_url || "")) {
            updatedReviewData.youtube_url = editReviewUrl;
        }
        if (editReviewType !== (selectedReviewForEdit.type === "lesson" ? "lesson" : "think")) {
            updatedReviewData.type = editReviewType;
        }

        if (Object.keys(updatedReviewData).length === 0) {
            toast.error("Herhangi bir değişiklik yapılmadı.");
            return;
        }

        try {
            const updateResponse = await updateReview({ id: selectedReviewForEdit.id, body: updatedReviewData }).unwrap();
            const successMessage = updateResponse?.message || "Yorum başarıyla güncellendi.";
            toast.success(successMessage);
            handleCloseEditModal();
        } catch (error: any) {
            const serverMessage = error?.data?.detail || error?.data?.message;
            toast.error(serverMessage || "Yorum güncellenirken bir hata oluştu.");
        }
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewReviewName("");
        setNewReviewUrl("");
        setNewReviewType("think");
    };

    const handleCreateSubmit = async () => {
        if (!newReviewUrl.trim()) {
            toast.error("YouTube URL alanı zorunludur.");
            return;
        }

        const newReviewPayload: { name?: string; youtube_url: string; type: "think" | "lesson" } = {
            youtube_url: newReviewUrl.trim(),
            type: newReviewType,
        };
        if (newReviewName.trim()) {
            newReviewPayload.name = newReviewName.trim();
        }

        try {
            const createResponse = await createReview(newReviewPayload).unwrap();
            if (createResponse?.message) {
                toast.success(createResponse.message);
            } else {
                toast.success("Yorum başarıyla oluşturuldu.");
            }
            handleCloseCreateModal();
        } catch (error: any) {
            const serverErrorMessage = error?.data?.detail || error?.data?.message || error?.data?.youtube_url?.[0];
            toast.error(serverErrorMessage || "Yorum oluşturulurken bir hata oluştu.");
        }
    };

    if (isAuthLoading) {
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
                                Öğrenci Yorumları
                            </h1>
                        </div>
                        <Button
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Yorum Ekle
                        </Button>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isReviewListLoading || isFetchingReviews) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[23%] py-4 px-4 lg:px-6">AD</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[18%] py-4 px-4 lg:px-6">OLUŞTURMA TARİHİ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[14%] py-4 px-4 lg:px-6">TÜR</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[30%] py-4 px-4 lg:px-6">VİDEO LİNKİ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase text-right w-[15%] py-4 px-4 lg:px-6">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isReviewListLoading ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <TableRow key={idx} className="animate-pulse">
                                                <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                    <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                    <div className="h-4 bg-slate-200 rounded w-56"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                                                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : reviewListResponse?.results && reviewListResponse.results.length > 0 ? (
                                        reviewListResponse.results.map((review) => {
                                            const reviewName = review.name || "-";
                                            const formattedReviewDate = formatReviewDate(review.created_at);
                                            const studentVideoUrl = review.youtube_url || "";
                                            const isLessonType = review.type === "lesson";
                                            const reviewTypeLabel = isLessonType ? "Ders Kesiti" : "Öğr. Yorumu";
                                            const reviewTypeClassName = isLessonType
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-violet-50 text-violet-700 border-violet-200";

                                            return (
                                                <TableRow
                                                    key={review.id}
                                                    className="group hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {reviewName}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {formattedReviewDate}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${reviewTypeClassName}`}
                                                        >
                                                            {reviewTypeLabel}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-5 px-4 lg:px-6">
                                                        {studentVideoUrl ? (
                                                            <a
                                                                href={studentVideoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-[#4F46E5] hover:text-[#4338CA] hover:underline font-medium inline-flex items-center gap-1.5 transition-colors"
                                                            >
                                                                {studentVideoUrl}
                                                                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right border-b border-slate-100 py-5 px-4 lg:px-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50"
                                                                onClick={() => handleOpenEditModal(review)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setSelectedReviewForDelete(review);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                {!isReviewListLoading && !isFetchingReviews && "Henüz yorum bulunmamaktadır."}
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
                                    Toplam <span className="text-slate-900 font-bold">{totalReviewCount}</span> yorum
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
                                                disabled={isReviewListLoading || isFetchingReviews}
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

                {/* Delete Review Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Yorumu Sil</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-slate-600 text-sm">
                                <span className="font-semibold text-slate-900">{selectedReviewForDelete?.name}</span> adlı öğrencinin yorumunu silmek istediğinize emin misiniz?
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isDeletingReview}
                            >
                                İptal Et
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteReview}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeletingReview}
                            >
                                {isDeletingReview ? (
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

                {/* Edit Review Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={(open) => { if (!open) handleCloseEditModal(); }}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Yorumu Düzenle</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="editReviewName" className="text-sm font-semibold text-slate-700">
                                    Video Adı (Opsiyonel)
                                </Label>
                                <Input
                                    id="editReviewName"
                                    type="text"
                                    placeholder="Project Introduction Video"
                                    value={editReviewName}
                                    onChange={(e) => setEditReviewName(e.target.value)}
                                    className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editReviewUrl" className="text-sm font-semibold text-slate-700">
                                    YouTube URL
                                </Label>
                                <Input
                                    id="editReviewUrl"
                                    type="url"
                                    placeholder="https://www.youtube.com/..."
                                    value={editReviewUrl}
                                    onChange={(e) => setEditReviewUrl(e.target.value)}
                                    className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editReviewType" className="text-sm font-semibold text-slate-700">
                                    Video Türü
                                </Label>
                                <Select value={editReviewType} onValueChange={(value: "think" | "lesson") => setEditReviewType(value)}>
                                    <SelectTrigger
                                        id="editReviewType"
                                        className="w-full bg-white border-slate-200 focus:ring-[#4F46E5]"
                                    >
                                        <SelectValue placeholder="Video türü seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="think">Öğrencilerimizin Düşünceleri</SelectItem>
                                        <SelectItem value="lesson">Derslerimizden Kesitler</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseEditModal}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isUpdatingReview}
                            >
                                İptal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleUpdateSubmit}
                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                                disabled={isUpdatingReview}
                            >
                                {isUpdatingReview ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Kaydet"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Review Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => { if (!open) handleCloseCreateModal(); }}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Yeni Yorum Ekle</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="newReviewName" className="text-sm font-semibold text-slate-700">
                                    Video Adı (Opsiyonel)
                                </Label>
                                <Input
                                    id="newReviewName"
                                    type="text"
                                    placeholder="Örn: Project Introduction Video"
                                    value={newReviewName}
                                    onChange={(e) => setNewReviewName(e.target.value)}
                                    className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newReviewUrl" className="text-sm font-semibold text-slate-700">
                                    YouTube URL
                                </Label>
                                <Input
                                    id="newReviewUrl"
                                    type="url"
                                    placeholder="https://www.youtube.com/..."
                                    value={newReviewUrl}
                                    onChange={(e) => setNewReviewUrl(e.target.value)}
                                    className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newReviewType" className="text-sm font-semibold text-slate-700">
                                    Video Türü
                                </Label>
                                <Select value={newReviewType} onValueChange={(value: "think" | "lesson") => setNewReviewType(value)}>
                                    <SelectTrigger
                                        id="newReviewType"
                                        className="w-full bg-white border-slate-200 focus:ring-[#4F46E5]"
                                    >
                                        <SelectValue placeholder="Video türü seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="think">Öğrencilerimizin Düşünceleri</SelectItem>
                                        <SelectItem value="lesson">Derslerimizden Kesitler</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseCreateModal}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isCreatingReview}
                            >
                                İptal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreateSubmit}
                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                                disabled={isCreatingReview}
                            >
                                {isCreatingReview ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Kaydet"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}

export default function StudentReviewsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        }>
            <StudentReviewsPageContent />
        </Suspense>
    );
}
