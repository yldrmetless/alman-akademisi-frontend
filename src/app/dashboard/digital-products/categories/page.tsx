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
import { useGetDigitalCategoriesQuery, useUpdateDigitalCategoryMutation, useCreateDigitalCategoryMutation, DigitalCategory } from "@/lib/features/course/courseApi";
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

export default function DigitalCategoriesPage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [ordering, setOrdering] = useState("-created_at"); // Default: Yeniden Eskiye

    // Edit Modal State
    const [updateDigitalCategory, { isLoading: isUpdatingCategory }] = useUpdateDigitalCategoryMutation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<DigitalCategory | null>(null);
    const [categoryEditName, setCategoryEditName] = useState("");

    // Create Modal State
    const [submitCategory, { isLoading: isCreationLoading }] = useCreateDigitalCategoryMutation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const form = useForm<CreateCategoryFormValues>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: { name: "" },
    });

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<DigitalCategory | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: categoriesData, isLoading: isCategoriesLoading, isFetching } = useGetDigitalCategoriesQuery(
        { page, search: debouncedSearch, ordering },
        { skip: !isAuthorized }
    );

    const totalPages = Math.ceil((categoriesData?.count || 0) / 10);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory || !categoryEditName.trim()) return;

        const updatePromise = updateDigitalCategory({
            id: selectedCategory.id,
            body: { name: categoryEditName }
        }).unwrap();

        toast.promise(updatePromise, {
            loading: 'Değişiklikler kaydediliyor...',
            success: (updateResponse) => {
                setIsEditModalOpen(false);
                return updateResponse?.message || "Kategori başarıyla güncellendi";
            },
            error: (error: any) => {
                return error?.data?.message || "Kategori güncellenirken bir hata oluştu";
            }
        });
    };

    const handleSoftDelete = async () => {
        if (!selectedCategoryForDelete) return;

        const deletePromise = updateDigitalCategory({
            id: selectedCategoryForDelete.id,
            body: { is_deleted: true }
        }).unwrap();

        toast.promise(deletePromise, {
            loading: 'Kategori siliniyor...',
            success: (response) => {
                setIsDeleteModalOpen(false);
                return response?.message || "Kategori başarıyla silindi";
            },
            error: (error: any) => {
                return error?.data?.message || "Kategori silinirken bir hata oluştu";
            }
        });
    };

    const onSubmitCreate = async (values: CreateCategoryFormValues) => {
        try {
            const response = await submitCategory(values).unwrap();
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
                                Dijital Ürün Kategorileri
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Dijital eserleriniz için kategorileri yönetin.
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
                                        <SelectTrigger className="border-slate-200 focus:ring-[#1A3EB1] font-medium text-slate-700">
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
                            {(isCategoriesLoading || isFetching) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[40%]">KATEGORİ ADI</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%]">OLUŞTURMA TARİHİ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%]">DURUM</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 text-right w-[20%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoriesData?.results && categoriesData.results.length > 0 ? (
                                        categoriesData.results.map((category) => (
                                            <TableRow
                                                key={category.id}
                                                className="group hover:bg-slate-50/80 transition-colors"
                                            >
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-900">{category.name}</span>
                                                        {category.description && (
                                                            <span className="text-xs text-slate-500 truncate max-w-[300px] mt-0.5">
                                                                {category.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <span className="font-medium text-slate-700 text-sm">{formatDate(category.created_at)}</span>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`font-semibold px-2.5 py-0.5 ${category.is_active
                                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                            }`}
                                                    >
                                                        {category.is_active ? "Aktif" : "Pasif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="flex items-center justify-end gap-1 -mr-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-[#1A3EB1] hover:bg-slate-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedCategory(category);
                                                                setCategoryEditName(category.name);
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
                                                                setSelectedCategoryForDelete(category);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                {!isCategoriesLoading && !isFetching && "Henüz kategori bulunmuyor."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <span className="text-sm text-slate-500 font-medium">
                                    Toplam <span className="text-slate-900">{categoriesData?.count || 0}</span> kategori
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-slate-600 bg-white"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 px-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors ${page === i + 1
                                                    ? "bg-[#1A3EB1] text-white"
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
                                        className="h-8 w-8 text-slate-600 bg-white"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Create Category Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) form.reset();
                }}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Yeni Kategori Ekle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmitCreate)} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name" className="text-sm font-semibold text-slate-700">
                                    Kategori Adı
                                </Label>
                                <Input
                                    id="create-name"
                                    {...form.register("name")}
                                    placeholder="Kategori Adı"
                                    className={`focus-visible:ring-[#1A3EB1] ${form.formState.errors.name ? 'border-red-500' : ''}`}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-red-500 text-xs font-medium">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0 mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        form.reset();
                                    }}
                                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                    disabled={isCreationLoading}
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#1A3EB1] hover:bg-[#15308A] text-white"
                                    disabled={isCreationLoading}
                                >
                                    {isCreationLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        "Kaydet"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Category Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Kategori Düzenle</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                                    Kategori Adı
                                </Label>
                                <Input
                                    id="name"
                                    value={categoryEditName}
                                    onChange={(e) => setCategoryEditName(e.target.value)}
                                    placeholder="Kategori Adı"
                                    className="focus-visible:ring-[#1A3EB1]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isUpdatingCategory}
                            >
                                İptal Et
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleUpdateCategory}
                                className="bg-[#1A3EB1] hover:bg-[#15308A] text-white"
                                disabled={isUpdatingCategory || !categoryEditName.trim()}
                            >
                                {isUpdatingCategory ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Değişiklikleri Kaydet"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Category Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Kategoriyi Sil</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-slate-600 text-sm">
                                Bu kategoriyi silmek istediğinize emin misiniz?
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                                disabled={isUpdatingCategory}
                            >
                                İptal Et
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleSoftDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isUpdatingCategory}
                            >
                                {isUpdatingCategory ? (
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
