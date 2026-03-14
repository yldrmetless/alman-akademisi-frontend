"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useGetCourseCategoriesQuery, useEditCourseCategoryMutation, useCreateCourseCategoryMutation, useSoftDeleteCategoryMutation, CourseCategory } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createCategorySchema = z.object({
    name: z.string().min(1, { message: "Kategori adı zorunludur" }),
});
type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

export default function CourseCategoriesPage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [ordering, setOrdering] = useState("-created_at");

    // Edit Modal State
    const [editCourseCategory, { isLoading: isEditingCategory }] = useEditCourseCategoryMutation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
    const [updatedName, setUpdatedName] = useState("");

    // Create Modal State
    const [createCourseCategory, { isLoading: isCreationLoading }] = useCreateCourseCategoryMutation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const form = useForm<CreateCategoryFormValues>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: { name: "" },
    });

    // Delete Modal State
    const [softDeleteCategory, { isLoading: isDeleting }] = useSoftDeleteCategoryMutation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
    const [deleteCategoryName, setDeleteCategoryName] = useState<string>("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: courseCategoryData, isLoading: isCategoriesLoading, isFetching } = useGetCourseCategoriesQuery(
        { page, search: debouncedSearch, ordering },
        { skip: !isAuthorized }
    );

    const totalPages = Math.ceil((courseCategoryData?.count || 0) / 10);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleEditSubmit = async () => {
        if (!editingCategory || !updatedName.trim() || updatedName === editingCategory.name) return;

        try {
            const editResponse = await editCourseCategory({
                id: editingCategory.id,
                body: { name: updatedName }
            }).unwrap();

            if (editResponse?.message) {
                toast.success(editResponse.message);
            } else {
                toast.success("Category updated successfully.");
            }

            setIsEditModalOpen(false);
            setEditingCategory(null);
            setUpdatedName("");
        } catch (error: any) {
            toast.error(error?.data?.message || "Kategori güncellenirken bir hata oluştu");
        }
    };

    const handleSoftDelete = async () => {
        if (!deleteCategoryId) return;

        try {
            const deleteResponse = await softDeleteCategory({
                id: deleteCategoryId,
                body: { is_deleted: true }
            }).unwrap();

            if (deleteResponse?.message) {
                toast.success(deleteResponse.message);
            } else {
                toast.success("Category marked as deleted.");
            }

            setIsDeleteModalOpen(false);
            setDeleteCategoryId(null);
            setDeleteCategoryName("");
        } catch (error: any) {
            toast.error(error?.data?.message || "Kategori silinirken bir hata oluştu");
        }
    };

    const submitNewCategory = async (values: CreateCategoryFormValues) => {
        try {
            const payload = { ...values, is_active: true };
            const response = await createCourseCategory(payload).unwrap();
            toast.success(response?.message || "Kategori başarıyla oluşturuldu");
            setIsCreateModalOpen(false);
            form.reset();
        } catch (error: any) {
            toast.error(error?.data?.message || "Kategori oluşturulurken bir hata oluştu");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
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
                                Kurs Kategorileri
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Kurslarınız için kategorileri yönetin.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Kategori Ekle
                        </Button>
                    </div>

                    {/* Table Card container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Tüm Kategoriler</h2>
                            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                                <div className="relative w-full sm:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Kategori adı ara..."
                                        className="pl-9 bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="w-full sm:w-[200px] shrink-0">
                                    <Select
                                        value={ordering}
                                        onValueChange={(val) => {
                                            setOrdering(val);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-[#1A3EB1]">
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

                        {/* Table View */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Kategori Adı</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase hidden md:table-cell">Oluşturma Tarihi</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Durum</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-600 text-xs tracking-wider uppercase">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isCategoriesLoading || isFetching ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <TableRow key={idx} className="animate-pulse">
                                                <TableCell>
                                                    <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                                                        <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : courseCategoryData?.results?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                                Kategori bulunamadı.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        courseCategoryData?.results?.map((category) => (
                                            <TableRow
                                                key={category.id}
                                                className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                            >
                                                <TableCell>
                                                    <div className="font-semibold text-slate-900 group-hover:text-[#1A3EB1] transition-colors">{category.name}</div>
                                                    {category.description && (
                                                        <div className="text-sm text-slate-500 line-clamp-1 mt-0.5">{category.description}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-slate-600 font-medium">
                                                    {formatDate(category.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`font-medium px-2.5 py-0.5 ${category.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                            }`}
                                                    >
                                                        {category.is_active ? "Aktif" : "Pasif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-[#1A3EB1] hover:bg-[#EEF2FF]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingCategory(category);
                                                                setUpdatedName(category.name);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteCategoryId(category.id);
                                                                setDeleteCategoryName(category.name);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-white mt-auto">
                            <span className="text-sm text-slate-500 font-medium">
                                Toplam <span className="text-slate-900 font-bold">{courseCategoryData?.count || 0}</span> sonuç
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={!courseCategoryData?.previous || isCategoriesLoading || isFetching}
                                    className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Önceki</span>
                                </Button>
                                <div className="flex items-center gap-1 font-medium text-sm">
                                    <span className="w-8 text-center text-slate-900">{page}</span>
                                    <span className="text-slate-400">/</span>
                                    <span className="w-8 text-center text-slate-500">{totalPages || 1}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={!courseCategoryData?.next || isCategoriesLoading || isFetching}
                                    className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                                >
                                    <span className="hidden sm:inline">Sonraki</span>
                                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Category Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Kategori Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Kategori Adı</Label>
                            <Input
                                id="edit-name"
                                value={updatedName}
                                onChange={(e) => setUpdatedName(e.target.value)}
                                placeholder="Örn: Almanca Kategori"
                                className="focus-visible:ring-[#1A3EB1]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isEditingCategory}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={!updatedName.trim() || isEditingCategory || updatedName === editingCategory?.name}
                            className="bg-[#1A3EB1] hover:bg-[#15308A]"
                        >
                            {isEditingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Category Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
                setIsCreateModalOpen(open);
                if (!open) form.reset();
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Kategori Ekle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(submitNewCategory)} className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Kategori Adı</Label>
                            <Input
                                id="create-name"
                                placeholder="Örn: Yazılım Geliştirme"
                                className={`focus-visible:ring-[#1A3EB1] ${form.formState.errors.name ? 'border-red-500' : ''}`}
                                {...form.register('name')}
                            />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreationLoading}>
                                Vazgeç
                            </Button>
                            <Button type="submit" disabled={isCreationLoading} className="bg-[#1A3EB1] hover:bg-[#15308A]">
                                {isCreationLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Kategori Ekle
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Kategoriyi Sil</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600">
                            <strong>{deleteCategoryName}</strong> kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                            İptal
                        </Button>
                        <Button variant="destructive" onClick={handleSoftDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
