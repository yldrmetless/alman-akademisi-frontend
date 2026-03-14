"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { useGetDigitalProductsQuery, useUpdateDigitalProductMutation } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function DigitalProductsPage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [updateDigitalProduct, { isLoading: isDeleting }] = useUpdateDigitalProductMutation();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: productsData, isLoading: isProductsLoading, isFetching } = useGetDigitalProductsQuery(
        { page, search: debouncedSearch, status: statusFilter },
        { skip: !isAuthorized }
    );

    const totalPages = Math.ceil((productsData?.count || 0) / 10);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleProductSoftDelete = async () => {
        if (!productToDelete) return;

        try {
            const updatePromise = updateDigitalProduct({
                id: productToDelete,
                body: { is_deleted: true } // Soft delete
            }).unwrap();

            await toast.promise(updatePromise, {
                loading: 'Ürün siliniyor...',
                success: 'Ürün başarıyla silindi',
                error: 'Silme işlemi başarısız oldu.',
            });
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
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
                                Dijital Eserler
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Platformdaki tüm dijital materyallerinizi yönetin.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push("/dashboard/digital-products/create")}
                            className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            Yeni Eser Ekle
                        </Button>
                    </div>

                    {/* Table Card container */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 space-y-4">
                            <h2 className="text-lg font-bold text-slate-900">Tüm Dijital Eserler</h2>
                            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                                <div className="relative w-full sm:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Eser adı ara..."
                                        className="pl-9 bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isProductsLoading || isFetching) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[50%]">ESER ADI</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[20%]">FİYAT</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 w-[15%]">STOK</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 text-right w-[15%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productsData?.results && productsData.results.length > 0 ? (
                                        productsData.results.map((product) => {
                                            const statusLower = product.status?.toLowerCase();
                                            const isPublished = statusLower === 'yayinda' || statusLower === 'yayında' || statusLower === 'published';

                                            // Handle formatting the price string safely
                                            const priceVal = parseFloat(product.price as string) || 0;
                                            const discountVal = product.discounted_price ? parseFloat(product.discounted_price as string) : null;
                                            const hasDiscount = discountVal !== null && discountVal < priceVal;

                                            return (
                                                <TableRow
                                                    key={product.id}
                                                    className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                                                    onClick={() => router.push(`/dashboard/digital-products/detail/${product.id}`)}
                                                >
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden relative border border-slate-200">
                                                                {product.main_image?.url ? (
                                                                    <Image
                                                                        src={product.main_image.url}
                                                                        alt={product.name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <Search className="h-5 w-5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-slate-900">{product.name}</span>
                                                                {product.description && (
                                                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                                                        {product.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        {hasDiscount ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-400 line-through text-xs font-semibold">{priceVal} ₺</span>
                                                                <span className="font-bold text-sm text-slate-900">{discountVal} ₺</span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-sm text-slate-900">{priceVal} ₺</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <span className="font-medium text-slate-700">{product.stock}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-[#1A3EB1] hover:bg-blue-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/dashboard/digital-products/edit/${product.id}`);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProductToDelete(product.id);
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
                                            <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                                {!isProductsLoading && !isFetching && "Henüz dijital eser bulunmuyor."}
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
                                    Toplam <span className="text-slate-900">{productsData?.count || 0}</span> eser
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
            </main>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Ürünü Sil</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600">
                            Bu ürünü silmek istediğinize emin misiniz?
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setProductToDelete(null);
                            }}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleProductSoftDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sil"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
