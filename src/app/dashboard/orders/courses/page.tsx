"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
import { Search, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { useGetCourseOrdersQuery, useApproveCourseRefundMutation, CourseOrder } from "@/lib/features/orders/ordersApi";
import { toast } from "react-hot-toast";
import { RefundModal } from "../digital-products/RefundModal";

export default function CourseOrdersPage() {
    const pathname = usePathname();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [ordering, setOrdering] = useState("-created_at");

    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<CourseOrder | null>(null);
    const [approveCourseRefund, { isLoading: isRefundSubmitting }] = useApproveCourseRefundMutation();

    // Additional filter if needed for Course Type (Online/Offline) - using basic search for now 
    // but building the skeleton logic if requested later:
    const [courseTypeFilter, setCourseTypeFilter] = useState("all");

    useEffect(() => {
        console.log('Current route is /orders/courses, triggering fetch...');
    }, [pathname]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: courseOrderResults, isLoading: isOrdersLoading, isFetching, isError } = useGetCourseOrdersQuery(
        { page, search: debouncedSearch, status: statusFilter, ordering },
        { refetchOnMountOrArgChange: true }
    );

    useEffect(() => {
        if (isError) {
            toast.error("Siparişler yüklenirken bir hata oluştu.");
        }
    }, [isError]);

    const handleCourseRefund = async () => {
        if (!selectedOrderForRefund) return;
        try {
            await approveCourseRefund(selectedOrderForRefund.merchant_oid).unwrap();
            toast.success("İade talebi başarıyla onaylandı.");
            setIsRefundModalOpen(false);
            setSelectedOrderForRefund(null);
            window.location.reload();
        } catch (error: any) {
            toast.error(error?.data?.error || error?.data?.message || "İade işlemi sırasında bir hata oluştu.");
        }
    };

    const totalPages = Math.ceil((courseOrderResults?.count || 0) / 10);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const formatOrderDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "refund_requested":
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100 font-medium px-2.5 py-0.5 inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-500" />
                        İade Talebi
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium px-2.5 py-0.5">
                        Tamamlandı
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium px-2.5 py-0.5">
                        Beklemede
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-medium px-2.5 py-0.5">
                        Hatalı
                    </Badge>
                );
            case "refunded":
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 font-medium px-2.5 py-0.5">
                        İade Edildi
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium px-2.5 py-0.5">
                        {status || "Bilinmiyor"}
                    </Badge>
                );
        }
    };

    const getCourseTypeBadge = (type: string) => {
        if (!type) return <span className="text-slate-500">-</span>;

        switch (type.toLowerCase()) {
            case "online":
                return (
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50">
                        Online
                    </Badge>
                );
            case "offline":
                return (
                    <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100">
                        Offline
                    </Badge>
                );
            default:
                return <span className="text-slate-700">{type}</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-900">Tüm Siparişler</h2>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full gap-4">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Sipariş no, müşteri veya e-posta ara..."
                            className="pl-9 bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4 shrink-0">

                        {/* Course Type Filter */}
                        <Select
                            value={courseTypeFilter}
                            onValueChange={(val: string) => {
                                setCourseTypeFilter(val);
                                // The backend currently doesn't map 'type' on orders explicitly via query params 
                                // in our schema definition, but this UI maintains visual parity with mockups.
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 focus:ring-[#1A3EB1]">
                                <SelectValue placeholder="Kurs Türü" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü (Tür)</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select
                            value={statusFilter}
                            onValueChange={(val: string) => {
                                setStatusFilter(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 focus:ring-[#1A3EB1]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü (Durum)</SelectItem>
                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                <SelectItem value="refund_requested">İade Talebi</SelectItem>
                                <SelectItem value="pending">Beklemede</SelectItem>
                                <SelectItem value="failed">Hatalı</SelectItem>
                                <SelectItem value="refunded">İade Edildi</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Filter */}
                        <Select
                            value={ordering}
                            onValueChange={(val: string) => {
                                setOrdering(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 focus:ring-[#1A3EB1]">
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

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Sipariş No</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Müşteri</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Kurs Adı</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Kurs Türü</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Tarih</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Tutar</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-xs tracking-wider uppercase">Durum</TableHead>
                            <TableHead className="text-right font-semibold text-slate-600 text-xs tracking-wider uppercase">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isOrdersLoading || isFetching ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={idx} className="animate-pulse">
                                    <TableCell><div className="h-4 bg-slate-200 rounded w-24"></div></TableCell>
                                    <TableCell>
                                        <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                                        <div className="h-3 bg-slate-100 rounded w-24"></div>
                                    </TableCell>
                                    <TableCell><div className="h-4 bg-slate-200 rounded w-32"></div></TableCell>
                                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-16"></div></TableCell>
                                    <TableCell><div className="h-4 bg-slate-200 rounded w-24"></div></TableCell>
                                    <TableCell><div className="h-4 bg-slate-200 rounded w-16"></div></TableCell>
                                    <TableCell><div className="h-6 bg-slate-200 rounded-full w-20"></div></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end"><div className="h-8 w-8 bg-slate-200 rounded-md"></div></div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : courseOrderResults?.results?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                    Veri bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            courseOrderResults?.results?.map((order) => {
                                const isRefundActionActive =
                                    order.status?.toLowerCase() === "refund_requested";
                                return (
                                    <TableRow
                                        key={order.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                                            #{order.merchant_oid || `ORD-${order.id}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900">{order.first_name} {order.last_name}</div>
                                            <div className="text-sm text-slate-500">{order.email}</div>
                                        </TableCell>
                                        <TableCell className="text-slate-700 max-w-[200px] truncate" title={order.course_name}>
                                            {order.course_name}
                                        </TableCell>
                                        <TableCell>
                                            {getCourseTypeBadge(order.course_type)}
                                        </TableCell>
                                        <TableCell className="text-slate-600 whitespace-nowrap">
                                            {formatOrderDate(order.order_date)}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                                            {Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isRefundActionActive ? (
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white inline-flex items-center gap-1.5"
                                                    disabled={isRefundSubmitting}
                                                    onClick={() => {
                                                        setSelectedOrderForRefund(order);
                                                        setIsRefundModalOpen(true);
                                                    }}
                                                >
                                                    {isRefundSubmitting && selectedOrderForRefund?.merchant_oid === order.merchant_oid ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5" />
                                                    )}
                                                    İadeyi Onayla
                                                </Button>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-white mt-auto">
                <span className="text-sm text-slate-500 font-medium">
                    Toplam <span className="text-slate-900 font-bold">{courseOrderResults?.count || 0}</span> sonuç
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!courseOrderResults?.previous || isOrdersLoading || isFetching}
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
                        disabled={!courseOrderResults?.next || isOrdersLoading || isFetching}
                        className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <span className="hidden sm:inline">Sonraki</span>
                        <ChevronRight className="h-4 w-4 sm:ml-1" />
                    </Button>
                </div>
            </div>

            <RefundModal
                isOpen={isRefundModalOpen}
                onClose={() => {
                    setIsRefundModalOpen(false);
                    setSelectedOrderForRefund(null);
                }}
                onConfirm={handleCourseRefund}
                isLoading={isRefundSubmitting}
            />
        </div>
    );
}
