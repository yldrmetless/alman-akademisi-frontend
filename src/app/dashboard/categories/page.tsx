"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2, Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

import {
    useGetCategoriesQuery,
    useUpdateCategoryMutation
} from "@/lib/features/blog/blogApi";

import { AddCategoryModal } from "@/components/dashboard/AddCategoryModal";
import { UpdateCategoryModal } from "@/components/dashboard/UpdateCategoryModal";
import { useRouter } from "next/navigation";
import * as z from "zod";

const deleteCategorySchema = z.object({
    is_deleted: z.boolean(),
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-hot-toast";

export default function CategoriesManagementPage() {
    const router = useRouter();
    const { isAuthorized, token, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedName, setDebouncedName] = useState("");

    const { data: categoriesData, isLoading: isCategoriesLoading, isFetching } = useGetCategoriesQuery(
        { page, name: debouncedName },
        { skip: !isAuthorized || !token }
    );
    const [deleteCategory, { isLoading: isDeleting }] = useUpdateCategoryMutation();

    // Delete Confirmation states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Edit Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);

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
    const totalCount = categoriesData?.count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    const generatePageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleDelete = async () => {
        if (!selectedCategoryId) return;
        try {
            const payload = deleteCategorySchema.parse({ is_deleted: true });
            await deleteCategory({ id: selectedCategoryId, ...payload }).unwrap();
            toast.success("Kategori başarıyla silindi.");
            setIsConfirmOpen(false);
            setSelectedCategoryId(null);
            router.refresh();
        } catch (error) {
            toast.error("Bir hata oluştu");
        }
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
                            Kategori Yönetimi
                        </h1>
                        <AddCategoryModal />
                    </div>

                    {/* Table Container */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 flex justify-end">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Kategori adı ara..."
                                    className="pl-9 bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
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
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[70%]">AD</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 text-right w-[30%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoriesData?.results && categoriesData.results.length > 0 ? (
                                        categoriesData.results.map((category) => (
                                            <TableRow key={category.id} className="group hover:bg-slate-50/80 transition-colors">
                                                <TableCell className="font-bold text-sm text-slate-900 border-b border-slate-100 py-4 lg:py-5 px-4 lg:px-6">
                                                    {category.name}
                                                </TableCell>
                                                <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="flex justify-end gap-1.5 sm:gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="cursor-pointer h-8 w-8 text-slate-400 hover:text-[#1A3EB1] hover:bg-[#1A3EB1]/10 rounded-full transition-colors"
                                                            onClick={() => {
                                                                setEditingCategory({ id: category.id, name: category.name });
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="cursor-pointer h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                            onClick={() => {
                                                                setSelectedCategoryId(category.id);
                                                                setIsConfirmOpen(true);
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
                                            <TableCell colSpan={2} className="h-48 text-center text-slate-500 border-b-0">
                                                Kategori bulunamadı.
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

                    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                        <AlertDialogContent className="sm:max-w-md rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">Bu kategoriyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500">
                                    Bu işlem sonucunda kategori arşive taşınacak ve listeden kaldırılacaktır.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel disabled={isDeleting} className="border-slate-200 hover:bg-slate-50">İptal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete();
                                    }}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Evet, Sil"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <UpdateCategoryModal
                        isOpen={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        editingCategory={editingCategory}
                    />

                </div>
            </main>
        </div>
    );
}
