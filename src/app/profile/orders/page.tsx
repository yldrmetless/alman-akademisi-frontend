"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronLeft, ChevronRight, RotateCcw, X, Package } from "lucide-react";
import { StudentSidebar } from "@/components/profile/StudentSidebar";
import { useGetMyCourseOrdersQuery, useGetMyDigitalProductsOrderQuery } from "@/lib/features/auth/authApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import toast from "react-hot-toast";

const ORDER_TABS = [
    { id: "digital", label: "Dijital Ürün" },
    { id: "course", label: "Kurs" },
] as const;

type TabId = typeof ORDER_TABS[number]["id"];

function formatDateTurkish(dateString: string): string {
    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
    ];
    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
}

function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; dotColor: string; textColor: string; bgClass?: string }> = {
        completed: { label: "Tamamlandı", dotColor: "bg-emerald-500", textColor: "text-emerald-700" },
        refunded: { label: "İptal Edildi", dotColor: "bg-slate-400", textColor: "text-slate-600" },
        refund_requested: {
            label: "İade Talebi Alındı",
            dotColor: "bg-gray-400",
            textColor: "text-gray-500",
            bgClass: "bg-gray-50 border border-gray-100",
        },
        failed: { label: "Beklemede", dotColor: "bg-amber-500", textColor: "text-amber-700" },
        pending: { label: "Beklemede", dotColor: "bg-amber-500", textColor: "text-amber-700" },
    };

    const mappedStatus = statusMap[status] || { label: status, dotColor: "bg-slate-400", textColor: "text-slate-600", bgClass: "" };

    return (
        <span className={`inline-flex min-w-[140px] items-center justify-start rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${mappedStatus.textColor} ${mappedStatus.bgClass || ""}`}>
            <span className={`h-2 w-2 rounded-full shrink-0 mr-2 ${mappedStatus.dotColor}`} />
            {mappedStatus.label}
        </span>
    );
}

function getCourseTypeBadge(courseType: string) {
    const isKurs = courseType?.toLowerCase().includes("kurs") || courseType?.toLowerCase().includes("course") || courseType?.toLowerCase().includes("online");
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide whitespace-nowrap ${
            isKurs
                ? "bg-teal-50 text-teal-700"
                : "bg-violet-50 text-violet-700"
        }`}>
            {isKurs ? "Kurs" : "Dijital Ürün"}
        </span>
    );
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<TabId>("digital");

    // Course Orders
    const { data: courseOrdersData, isLoading: isCourseOrdersLoading, isFetching: isFetchingCourseOrders } = useGetMyCourseOrdersQuery(undefined, {
        skip: activeTab !== "course",
    });
    const isOrdersLoading = activeTab === "course" && (isCourseOrdersLoading || isFetchingCourseOrders);
    const courseOrders = courseOrdersData?.results || [];

    // Digital Product Orders
    const { data: digitalOrdersData, isLoading: isDigitalOrdersLoading, isFetching: isFetchingDigitalOrders } = useGetMyDigitalProductsOrderQuery(undefined, {
        skip: activeTab !== "digital",
    });
    const isDigitalLoading = activeTab === "digital" && (isDigitalOrdersLoading || isFetchingDigitalOrders);
    const digitalProductOrders = digitalOrdersData?.results || [];

    // Refund Modal State
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [selectedRefundOrderId, setSelectedRefundOrderId] = useState<string | null>(null);
    const [selectedRefundType, setSelectedRefundType] = useState<"digital" | "course" | null>(null);
    const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);

    const handleRefundClick = (merchantOid: string, refundType: "digital" | "course") => {
        setSelectedRefundOrderId(merchantOid);
        setSelectedRefundType(refundType);
        setRefundReason("");
        setIsRefundModalOpen(true);
    };

    const handleRefundSubmit = async () => {
        console.log("Request sending...", {
            merchant_oid: selectedRefundOrderId,
            reasonLength: refundReason.trim().length,
        });

        if (!selectedRefundOrderId) {
            console.warn("Refund submit blocked: merchant_oid missing");
            toast.error("Sipariş seçilemedi. Lütfen tekrar deneyin.");
            return;
        }

        if (!refundReason.trim()) {
            console.warn("Refund submit blocked: reason is empty");
            toast.error("Lütfen neden belirtin");
            return;
        }

        if (refundReason.trim().length < 10) {
            toast.error("İade nedeni en az 10 karakter olmalıdır.");
            return;
        }

        const token = localStorage.getItem("access_token") || localStorage.getItem("access");
        if (!token) {
            console.warn("Refund submit blocked: token missing in localStorage");
            toast.error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        setIsRefundSubmitting(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
            const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
            const refundUrl = selectedRefundType === "course"
                ? `${normalizedBaseUrl}/courses/refund-request/${selectedRefundOrderId}/`
                : `${normalizedBaseUrl}/products/request-refund/${selectedRefundOrderId}/`;
            console.log("Refund URL:", refundUrl);

            const response = await fetch(
                refundUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: refundReason.trim() }),
                }
            );

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result?.error || result?.message || "İade talebi gönderilemedi.");
            }

            toast.success(
                selectedRefundType === "course"
                    ? "Kurs iade talebiniz alınmıştır..."
                    : "İade talebiniz başarıyla gönderildi."
            );
            setIsRefundModalOpen(false);
            setRefundReason("");
            setSelectedRefundOrderId(null);
            setSelectedRefundType(null);
            window.location.reload();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "İade talebi gönderilemedi. Lütfen tekrar deneyin.";
            toast.error(message);
        } finally {
            setIsRefundSubmitting(false);
        }
    };

    const handleRefundModalClose = () => {
        setIsRefundModalOpen(false);
        setRefundReason("");
        setSelectedRefundOrderId(null);
        setSelectedRefundType(null);
    };

    return (
        <StudentSidebar>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/profile" className="hover:text-slate-600 transition-colors">Profil</Link>
                <span>›</span>
                <span className="text-slate-700 font-medium">Siparişler</span>
            </div>

            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Siparişler</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Geçmiş siparişlerinizi ve satın aldığınız kursları buradan inceleyebilirsiniz.
                </p>
            </div>

            {/* Orders Card */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardHeader className="pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-slate-800">Sipariş Geçmişi</CardTitle>

                        {/* Tabs */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            {ORDER_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium transition-all ${
                                        activeTab === tab.id
                                            ? "bg-slate-800 text-white"
                                            : "bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">

                    {/* ===================== DIGITAL PRODUCTS TAB ===================== */}
                    {activeTab === "digital" && (
                        <>
                            {isDigitalLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                                </div>
                            ) : digitalProductOrders.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-7 w-7 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Henüz dijital ürün siparişiniz bulunmamaktadır.</p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Dijital ürünlerimizi keşfetmek için{" "}
                                        <Link href="/" className="text-[#1A3EB1] font-semibold hover:underline">
                                            mağazayı ziyaret edin
                                        </Link>.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm table-fixed">
                                            <colgroup>
                                                <col className="w-[60px]" />
                                                <col className="w-[16%]" />
                                                <col className="w-[30%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[10%]" />
                                            </colgroup>
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">GÖRSEL</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">SİPARİŞ NO</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">ÜRÜN ADI</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">TARİH</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">FİYAT</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">DURUM</th>
                                                    <th className="text-center py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">İŞLEMLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {digitalProductOrders.map((order) => {
                                                    const isRefundable = order.status === "completed" && !order.refund_requested;

                                                    return (
                                                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors h-16">
                                                            <td className="py-3 px-3 align-middle">
                                                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                                                    {order.product_image ? (
                                                                        <Image
                                                                            src={order.product_image}
                                                                            alt={order.product_name}
                                                                            width={40}
                                                                            height={40}
                                                                            className="object-cover h-full w-full"
                                                                        />
                                                                    ) : (
                                                                        <Package className="h-4 w-4 text-slate-400" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                <TooltipProvider delayDuration={200}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="text-xs font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis block max-w-[120px] cursor-default" aria-label={order.merchant_oid}>
                                                                                #{order.merchant_oid}
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            #{order.merchant_oid}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                <TooltipProvider delayDuration={200}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span
                                                                                className="font-semibold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis block max-w-[200px] cursor-default"
                                                                                aria-label={order.product_name}
                                                                            >
                                                                                {order.product_name}
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="max-w-[300px] whitespace-normal">
                                                                            {order.product_name}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle text-slate-600 text-xs whitespace-nowrap">
                                                                {formatDateTurkish(order.created_at)}
                                                            </td>
                                                            <td className="py-3 px-3 align-middle whitespace-nowrap">
                                                                <span className="font-bold text-slate-800">{order.purchase_price} TL</span>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                {getStatusBadge(order.status)}
                                                            </td>
                                                            <td className="py-3 px-3 align-middle text-center">
                                                                {order.status === "refund_requested" ? (
                                                                    <span className="text-slate-300">-</span>
                                                                ) : (
                                                                    <TooltipProvider delayDuration={300}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <button
                                                                                    onClick={() => isRefundable && handleRefundClick(order.merchant_oid, "digital")}
                                                                                    disabled={!isRefundable}
                                                                                    className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                                                                                        isRefundable
                                                                                            ? "text-[#1A3EB1] hover:bg-[#1A3EB1]/10 cursor-pointer"
                                                                                            : "text-slate-300 cursor-not-allowed opacity-30"
                                                                                    }`}
                                                                                    aria-label="İade Talebi"
                                                                                >
                                                                                    <RotateCcw className="h-4 w-4" />
                                                                                </button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                {isRefundable ? "İade Talebi Oluştur" : "İade talep edilemez"}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-4">
                                        {digitalProductOrders.map((order) => {
                                            const isRefundable = order.status === "completed" && !order.refund_requested;

                                            return (
                                                <Card key={order.id} className="rounded-xl border-slate-100 shadow-sm">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                                                {order.product_image ? (
                                                                    <Image
                                                                        src={order.product_image}
                                                                        alt={order.product_name}
                                                                        width={48}
                                                                        height={48}
                                                                        className="object-cover h-full w-full"
                                                                    />
                                                                ) : (
                                                                    <Package className="h-5 w-5 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-400 whitespace-nowrap">#{order.merchant_oid}</p>
                                                                <p className="font-semibold text-slate-800 mt-1 truncate">{order.product_name}</p>
                                                            </div>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            <div className="text-xs text-slate-500">{formatDateTurkish(order.created_at)}</div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-slate-800">{order.purchase_price} TL</span>
                                                                {order.status === "refund_requested" ? (
                                                                    <span className="text-slate-300 text-xs">-</span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => isRefundable && handleRefundClick(order.merchant_oid, "digital")}
                                                                        disabled={!isRefundable}
                                                                        className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-all ${
                                                                            isRefundable
                                                                                ? "text-[#1A3EB1] hover:bg-[#1A3EB1]/10"
                                                                                : "text-slate-300 cursor-not-allowed opacity-30"
                                                                        }`}
                                                                        aria-label="İade Talebi"
                                                                    >
                                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Footer */}
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                                        <p className="text-xs text-slate-400">
                                            Toplam {digitalProductOrders.length} sipariş gösteriliyor
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ===================== COURSE TAB ===================== */}
                    {activeTab === "course" && (
                        <>
                            {isOrdersLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                                </div>
                            ) : courseOrders.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-slate-500 font-medium">Henüz kurs siparişiniz bulunmuyor.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm table-fixed">
                                            <colgroup>
                                                <col className="w-[16%]" />
                                                <col className="w-[24%]" />
                                                <col className="w-[10%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[11%]" />
                                                <col className="w-[14%]" />
                                                <col className="w-[11%]" />
                                            </colgroup>
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">SİPARİŞ NO</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">ÜRÜN ADI</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">TÜR</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">TARİH</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">TUTAR</th>
                                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">DURUM</th>
                                                    <th className="text-center py-3 px-3 text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap">İŞLEMLER</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseOrders.map((order) => {
                                                    const isRefundable = order.status === "completed" && !order.refund_requested;

                                                    return (
                                                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors h-16">
                                                            <td className="py-3 px-3 align-middle">
                                                                <TooltipProvider delayDuration={200}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="text-xs font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis block max-w-[120px] cursor-default" aria-label={order.merchant_oid}>
                                                                                #{order.merchant_oid}
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            #{order.merchant_oid}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <TooltipProvider delayDuration={200}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span
                                                                                    className="font-semibold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis block max-w-[200px] cursor-default"
                                                                                    aria-label={order.course_name}
                                                                                >
                                                                                    {order.course_name}
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top" className="max-w-[300px] whitespace-normal">
                                                                                {order.course_name}
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    {order.course_level && (
                                                                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                                                                            {order.course_level}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                {getCourseTypeBadge(order.course_type)}
                                                            </td>
                                                            <td className="py-3 px-3 align-middle text-slate-600 text-xs whitespace-nowrap">
                                                                {formatDateTurkish(order.created_at)}
                                                            </td>
                                                            <td className="py-3 px-3 align-middle whitespace-nowrap">
                                                                <span className="font-bold text-slate-800">{order.total_amount} TL</span>
                                                            </td>
                                                            <td className="py-3 px-3 align-middle">
                                                                {getStatusBadge(order.status)}
                                                            </td>
                                                            <td className="py-3 px-3 align-middle text-center">
                                                                <TooltipProvider delayDuration={300}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                onClick={() => isRefundable && handleRefundClick(order.merchant_oid, "course")}
                                                                                disabled={!isRefundable}
                                                                                className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                                                                                    isRefundable
                                                                                        ? "text-[#1A3EB1] hover:bg-[#1A3EB1]/10 cursor-pointer"
                                                                                        : "text-slate-300 cursor-not-allowed opacity-30"
                                                                                }`}
                                                                                aria-label="İade Talebi"
                                                                            >
                                                                                <RotateCcw className="h-4 w-4" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top">
                                                                            {isRefundable ? "İade Talebi Oluştur" : "İade talep edilemez"}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden space-y-4">
                                        {courseOrders.map((order) => {
                                            const isRefundable = order.status === "completed" && !order.refund_requested;

                                            return (
                                                <Card key={order.id} className="rounded-xl border-slate-100 shadow-sm">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-400 whitespace-nowrap">#{order.merchant_oid}</p>
                                                                <p className="font-semibold text-slate-800 mt-1 truncate">{order.course_name}</p>
                                                            </div>
                                                            {getStatusBadge(order.status)}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {order.course_level && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                                                                    {order.course_level}
                                                                </span>
                                                            )}
                                                            {getCourseTypeBadge(order.course_type)}
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            <div className="text-xs text-slate-500">{formatDateTurkish(order.created_at)}</div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-slate-800">{order.total_amount} TL</span>
                                                                <button
                                                                    onClick={() => isRefundable && handleRefundClick(order.merchant_oid, "course")}
                                                                    disabled={!isRefundable}
                                                                    className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-all ${
                                                                        isRefundable
                                                                            ? "text-[#1A3EB1] hover:bg-[#1A3EB1]/10"
                                                                            : "text-slate-300 cursor-not-allowed opacity-30"
                                                                    }`}
                                                                    aria-label="İade Talebi"
                                                                >
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Footer */}
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                                        <p className="text-xs text-slate-400">
                                            Toplam {courseOrders.length} sipariş gösteriliyor
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Refund Request Modal */}
            {isRefundModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleRefundModalClose} />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[480px] mx-4 p-0 animate-in fade-in-0 zoom-in-95">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">İade Talebi</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Sipariş No: <span className="font-semibold text-slate-600">#{selectedRefundOrderId}</span>
                                </p>
                            </div>
                            <button
                                onClick={handleRefundModalClose}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 pb-2">
                            <label htmlFor="refundReason" className="text-sm font-semibold text-slate-700 block mb-2">
                                İade Nedeniniz
                            </label>
                            <textarea
                                id="refundReason"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Lütfen iade talebinizin nedenini açıklayınız..."
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 resize-none placeholder:text-slate-400"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4">
                            <Button
                                variant="outline"
                                onClick={handleRefundModalClose}
                                className="rounded-xl px-5 h-10 text-sm font-medium border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                İptal
                            </Button>
                            <Button
                                onClick={handleRefundSubmit}
                                disabled={isRefundSubmitting}
                                className="rounded-xl px-5 h-10 text-sm font-medium bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white"
                            >
                                {isRefundSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    "Talebi Gönder"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </StudentSidebar>
    );
}
