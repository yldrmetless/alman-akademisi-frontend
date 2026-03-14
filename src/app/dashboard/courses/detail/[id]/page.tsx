"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetCourseDetailQuery } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";
import { Loader2, Trash2, Edit2, FileText, ChevronRight, Image as ImageIcon, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;

    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const { data: courseDetailData, isLoading: isDetailLoading, error } = useGetCourseDetailQuery(courseId, {
        skip: !isAuthorized || !courseId,
    });

    useEffect(() => {
        if (error) {
            toast.error("Kurs detayı yüklenirken bir hata oluştu.");
        }
    }, [error]);

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
        );
    }

    if (isDetailLoading) {
        return (
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <Sidebar
                    firstName={profile?.first_name || ""}
                    lastName={profile?.last_name || ""}
                    username={profile?.username || ""}
                />
                <main className="flex-1 lg:ml-72 min-w-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
                </main>
            </div>
        );
    }

    if (error || (!courseDetailData && !isDetailLoading)) {
        return (
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <Sidebar
                    firstName={profile?.first_name || ""}
                    lastName={profile?.last_name || ""}
                    username={profile?.username || ""}
                />
                <main className="flex-1 lg:ml-72 min-w-0 flex flex-col items-center justify-center gap-4">
                    <div className="text-slate-500 font-medium">Kurs bulunamadı veya veriler çekilemedi.</div>
                    <Button
                        onClick={() => router.push("/dashboard/courses")}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm"
                    >
                        Back to Courses
                    </Button>
                </main>
            </div>
        );
    }

    const quota = Math.max(0, Number(courseDetailData?.quota ?? 0));
    const registered = Math.max(
        0,
        Number(
            courseDetailData?.registered_count ??
            courseDetailData?.registered_students ??
            courseDetailData?.registered ??
            0
        )
    );
    const safeQuota = quota > 0 ? quota : 1;
    const occupancyPercentage = Math.min(Math.round((registered / safeQuota) * 100), 100);
    const isPrivateLesson = Boolean((courseDetailData as any)?.is_private_lesson);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            {/* Breadcrumb */}
                            <div className="flex items-center text-sm font-medium text-slate-500 gap-2 mb-2">
                                <Link href="/dashboard/courses" className="hover:text-[#4F46E5] transition-colors">
                                    Kurs Yönetimi
                                </Link>
                                <ChevronRight className="h-4 w-4" />
                                <span className="text-slate-900">Kurs Detayı</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                {courseDetailData?.name || "İsimsiz Kurs"}
                            </h1>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2 font-medium"
                                onClick={() => {
                                    // Normally triggers delete dialog
                                    toast("Silme işlemi için Liste sayfasını kullanabilirsiniz.", { icon: "ℹ️" });
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Sil
                            </Button>
                            <Button
                                variant="outline"
                                className="text-slate-700 border-slate-300 hover:bg-slate-50 gap-2 font-medium bg-white"
                                onClick={() => router.push(`/dashboard/courses/edit/${courseId}`)}
                            >
                                <Edit2 className="h-4 w-4" />
                                Düzenle
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Genel Bilgiler Box */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">GENEL BİLGİLER</h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Kategori</p>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-3 py-1 rounded-full border-none shadow-none">
                                            {courseDetailData?.category_name || "Kategori Seçilmedi"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Kategori / Seviye</p>
                                        {courseDetailData?.level ? (
                                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1 rounded-full border-none shadow-none">
                                                {courseDetailData.level} Seviyesi
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-400 text-sm">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Kurs Tipi</p>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                                            <GraduationCap className="h-4 w-4 text-slate-500" />
                                            <span className="text-sm font-semibold">
                                                {isPrivateLesson ? "Özel Ders" : "Kurs"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kontenjan Box */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">KONTENJAN</h3>
                                    <span className="text-sm font-bold text-slate-900">{registered} / {quota}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2 relative">
                                    <div
                                        className="bg-[#1E3BB3] h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${occupancyPercentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">%{occupancyPercentage} Doluluk oranına ulaşıldı.</p>
                            </div>

                            {/* Takvim & Ücretlendirme Box */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">TAKVİM & ÜCRETLENDİRME</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Ücretlendirme</p>
                                        <div className="flex items-baseline gap-3">
                                            {Number(courseDetailData?.discounted_price) > 0 ? (
                                                <>
                                                    <span className="text-2xl font-bold text-[#1E3BB3]">
                                                        {Number(courseDetailData?.discounted_price).toLocaleString('tr-TR')} TL
                                                    </span>
                                                    <span className="text-sm text-slate-400 line-through decoration-slate-300 font-medium">
                                                        {Number(courseDetailData?.price).toLocaleString('tr-TR')} TL
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-2xl font-bold text-[#1E3BB3]">
                                                    {Number(courseDetailData?.price || 0).toLocaleString('tr-TR')} TL
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Etiketler</p>
                                        <div className="flex flex-wrap gap-2">
                                            {courseDetailData?.tags && courseDetailData.tags.length > 0 ? (
                                                courseDetailData.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 font-medium border border-indigo-100 px-3 flex items-center justify-center">
                                                        #{tag}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400">Etiket bulunmuyor.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* Main Image */}
                            <div className="w-full relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                                {courseDetailData?.image_url ? (
                                    <Image
                                        src={courseDetailData.image_url}
                                        alt={courseDetailData?.name || "Kurs Görseli"}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <ImageIcon className="h-10 w-10 text-slate-300" />
                                        <span className="text-sm font-medium text-slate-400">Kurs görseli bulunamadı</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails Placeholder (If needed, mocking two boxes seen in screenshot) */}
                            <div className="flex items-center gap-4">
                                {courseDetailData?.image_url && (
                                    <div className="h-16 w-24 relative rounded-xl border-2 border-[#4F46E5] overflow-hidden">
                                        <Image src={courseDetailData.image_url} alt="thumbnail" fill className="object-cover" />
                                    </div>
                                )}
                            </div>

                            {/* Description Box */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center gap-3 mb-6">
                                    <FileText className="h-5 w-5 text-[#1E3BB3]" />
                                    <h2 className="text-lg font-bold text-slate-900">Kurs Hakkında Detaylı Açıklama</h2>
                                </div>
                                <div className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-wrap">
                                    {courseDetailData?.description || "Açıklama girilmemiş."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
