"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useGetSupportRequestsQuery, SupportRequest } from "@/lib/features/users/userApi";
import { SupportStatusModal } from "@/components/dashboard/SupportStatusModal";

// Helper to format dates
const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Badges Mapping
const priorityColorMap: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    normal: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    low: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
};

const priorityLabelMap: Record<string, string> = {
    high: "Yüksek",
    normal: "Normal",
    low: "Düşük",
};

const statusColorMap: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    closed: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
};

const statusLabelMap: Record<string, string> = {
    open: "Açık",
    in_progress: "İşlemde",
    closed: "Kapalı",
};

function SupportDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const pageParam = searchParams.get("page");
    const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam, 10) : 1);
    const [statusFilter, setStatusFilter] = useState("");
    const [orderingFilter, setOrderingFilter] = useState("-created_at");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupportId, setSelectedSupportId] = useState<number | null>(null);

    const { data: supportListResponse, isLoading: isSupportLoading, isFetching } = useGetSupportRequestsQuery(
        { page: currentPage, status: statusFilter || undefined, ordering: orderingFilter },
        { skip: !isAuthorized }
    );

    const supportList = supportListResponse?.results || [];
    const totalCount = supportListResponse?.count || 0;
    const totalPages = Math.ceil(totalCount / 10);
    const hasData = totalCount > 0;
    const isPrevDisabled = !supportListResponse?.previous || isSupportLoading || isFetching;
    const isNextDisabled = !supportListResponse?.next || isSupportLoading || isFetching;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", newPage.toString());
            router.push(`?${params.toString()}`, { scroll: false });
        }
    };

    const handleStatusChange = (requestId: number) => {
        setSelectedSupportId(requestId);
        setIsModalOpen(true);
    };

    const selectedSupportDetail = supportList.find(req => req.id === selectedSupportId) || null;

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
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Destek Talepleri
                        </h1>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-2">
                        {/* Status Filter */}
                        <select
                            className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all w-full sm:w-auto"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="open">Açık</option>
                            <option value="in_progress">İşlemde</option>
                            <option value="closed">Kapalı</option>
                        </select>

                        {/* Ordering Filter */}
                        <select
                            className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all w-full sm:w-auto"
                            value={orderingFilter}
                            onChange={(e) => {
                                setOrderingFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="-created_at">Yeniden Eskiye</option>
                            <option value="created_at">Eskiden Yeniye</option>
                        </select>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Destek Talebi Listesi</h2>
                        </div>

                        <div className="overflow-x-auto relative min-h-[300px]">
                            {(isSupportLoading || isFetching) && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#4F46E5]" />
                                </div>
                            )}

                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b-slate-100 bg-slate-50/50">
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[10%]">EKRAN GÖRÜNTÜSÜ</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[35%]">AD SOYAD / EMAIL</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[10%] text-center">ÖNCELİK</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[15%] text-center">TARİH</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase w-[15%] text-center">DURUM</TableHead>
                                        <TableHead className="font-semibold text-xs text-slate-500 tracking-wider uppercase text-right w-[15%]">İŞLEMLER</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isSupportLoading ? (
                                        Array.from({ length: 5 }).map((_, idx) => (
                                            <TableRow key={idx} className="animate-pulse">
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-12 w-12 bg-slate-200 rounded"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="space-y-2">
                                                        <div className="h-4 bg-slate-200 rounded w-36"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-48"></div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-6 mx-auto bg-slate-200 rounded-full w-16"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-4 mx-auto bg-slate-200 rounded w-24"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                    <div className="h-6 mx-auto bg-slate-200 rounded-full w-16"></div>
                                                </TableCell>
                                                <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6 text-right">
                                                    <div className="h-8 w-8 bg-slate-200 rounded-md ml-auto"></div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : supportList.length > 0 ? (
                                        supportList.map((request: SupportRequest) => {
                                            const displayFullName = `${request.first_name} ${request.last_name}`;
                                            return (
                                                <TableRow
                                                    key={request.id}
                                                    className="group hover:bg-slate-50/80 transition-colors"
                                                >
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div className="flex items-center">
                                                            {request.image_url ? (
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <div className="h-10 w-10 rounded overflow-hidden border border-slate-200 relative bg-slate-100 cursor-pointer shrink-0 hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-indigo-100 group">
                                                                            <Image 
                                                                                src={request.image_url} 
                                                                                alt="Ekran Görüntüsü" 
                                                                                fill 
                                                                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                                            />
                                                                        </div>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="max-w-4xl w-full p-2 bg-transparent border-none shadow-none flex flex-col justify-center items-center">
                                                                        <DialogTitle className="sr-only">Ekran Görüntüsü Detayı</DialogTitle>
                                                                        <div className="relative w-full h-[85vh] rounded-md overflow-hidden bg-white/5 backdrop-blur-sm">
                                                                            <Image
                                                                                src={request.image_url}
                                                                                alt="Ekran Görüntüsü Tam Boyut"
                                                                                fill
                                                                                className="object-contain"
                                                                                unoptimized
                                                                            />
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            ) : (
                                                                <div className="h-10 w-10 rounded border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 select-none">
                                                                    <ImageIcon className="h-4 w-4 mb-0.5 opacity-50" />
                                                                    <span className="text-[7px] font-semibold tracking-tighter uppercase">Yok</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <div className="flex flex-col min-w-[200px]">
                                                            <span className="font-bold text-sm text-slate-900 block truncate">
                                                                {displayFullName}
                                                            </span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {request.email}
                                                            </span>
                                                            <span className="text-xs text-slate-400 mt-1 truncate max-w-[250px]">
                                                                "{request.message}"
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6 text-center">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`font-medium px-2.5 py-0.5 ${priorityColorMap[request.priority] || priorityColorMap.low}`}
                                                        >
                                                            {priorityLabelMap[request.priority] || "Bilinmiyor"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6 text-center">
                                                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                                                            {formatDate(request.created_at)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="border-b border-slate-100 py-4 px-4 lg:px-6 text-center">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`font-medium px-2.5 py-0.5 ${statusColorMap[request.status] || statusColorMap.closed}`}
                                                        >
                                                            {statusLabelMap[request.status] || "Bilinmiyor"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right border-b border-slate-100 py-4 px-4 lg:px-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleStatusChange(request.id)}
                                                            className="h-8 w-8 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50"
                                                            title="Durum Güncelle"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                                {!isSupportLoading && !isFetching && "Destek talebi bulunamadı."}
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
                                    Toplam <span className="text-slate-900 font-bold">{totalCount}</span> kayıt
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
                                                disabled={isSupportLoading || isFetching}
                                                className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    currentPage === i + 1
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

                <SupportStatusModal 
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    supportDetail={selectedSupportDetail}
                />
            </main>
        </div>
    );
}

export default function SupportDashboard() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        }>
            <SupportDashboardContent />
        </Suspense>
    );
}
