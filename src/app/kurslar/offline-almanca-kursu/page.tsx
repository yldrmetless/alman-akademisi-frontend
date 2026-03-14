"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetCourseListQuery } from "@/lib/features/course/courseApi";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";
import toast from "react-hot-toast";

export default function OfflineCoursesPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { data: coursesData, isLoading, error } = useGetCourseListQuery({ type: "offline" });
    const offlineCourses = coursesData?.results || [];

    const formatCurrency = (amount: string | number) =>
        new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(Number(amount));

    const handleAddToCart = (courseItem: (typeof offlineCourses)[number]) => {
        const stockLimit = Math.max(0, Number(courseItem.quota ?? 0));
        if (stockLimit <= 0) return;

        const resolvedPrice =
            courseItem.discounted_price && Number(courseItem.discounted_price) > 0
                ? Number(courseItem.discounted_price)
                : Number(courseItem.price);

        dispatch(
            addToCart({
                id: courseItem.id,
                name: courseItem.name,
                price: resolvedPrice,
                image: courseItem.image_url || "/logo.webp",
                quantity: 1,
                type: "course",
                stock_limit: stockLimit,
            })
        );
        toast.success("Kurs sepete eklendi.");
    };

    const handleBuyNow = (courseItem: (typeof offlineCourses)[number]) => {
        handleAddToCart(courseItem);
        const hasToken =
            typeof window !== "undefined" &&
            Boolean(localStorage.getItem("access_token") || localStorage.getItem("access"));
        router.push(hasToken ? "/checkout" : "/login");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <main className="grow max-w-7xl mx-auto w-full px-4 py-12 md:py-20 mt-16">
                <div className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a365d] mb-4">
                        Offline (Kayıtlı) Almanca Kursları
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl">
                        Yüz yüze sınıf deneyimi ile kayıtlı offline Almanca kurslarımızı inceleyin ve hemen kaydınızı oluşturun.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-[#1a365d]" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xl text-slate-500 font-medium">Kurslar yüklenirken bir hata oluştu.</p>
                    </div>
                ) : offlineCourses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xl text-slate-500 font-medium">Şu anda aktif offline kurs bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full pt-6 pb-12">
                        {offlineCourses.map((courseItem) => {
                            const isDiscountActive = courseItem.discounted_price && Number(courseItem.discounted_price) > 0;
                            const stockLimit = Math.max(0, Number(courseItem.quota ?? 0));
                            const isOutOfStock = stockLimit <= 0;

                            return (
                                <Card key={courseItem.id} className="h-full flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
                                    <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                                        {courseItem.image_url ? (
                                            <Image
                                                src={courseItem.image_url}
                                                alt={courseItem.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-400">
                                                Görsel Yok
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <Badge className="bg-white/95 text-[#1a365d] hover:bg-white font-bold px-3 py-1 text-xs border-0 shadow-sm backdrop-blur-sm">
                                                Offline
                                            </Badge>
                                            <Badge className="bg-[#1a365d] text-white hover:bg-[#1a365d] font-bold px-3 py-1 text-xs border-0 shadow-sm">
                                                {courseItem.level}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-6 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-[#1a365d] line-clamp-1 mb-2">
                                                {courseItem.name}
                                            </h3>

                                            {courseItem.description && (
                                                <p className="text-base text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                                    {courseItem.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-5 border-t border-slate-50">
                                            <div className="mb-4">
                                                {isDiscountActive ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-400 line-through font-medium mb-0.5">
                                                            {formatCurrency(courseItem.price)} ₺
                                                        </span>
                                                        <span className="text-2xl font-bold text-[#1a365d]">
                                                            {formatCurrency(courseItem.discounted_price || 0)} ₺
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-[#1a365d]">
                                                        {formatCurrency(courseItem.price)} ₺
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-2.5">
                                                <Link href={`/kurslar/offline-almanca-kursu/${courseItem.id}`} className="w-full">
                                                    <Button variant="outline" className="w-full py-2.5 h-11 rounded-xl border-2 border-[#1a365d] text-[#1a365d] font-bold text-sm hover:bg-slate-50 transition-all">
                                                        Detay Gör
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => handleAddToCart(courseItem)}
                                                    disabled={isOutOfStock}
                                                    className="w-full py-2.5 h-11 rounded-xl bg-[#1a365d] text-white font-bold text-sm hover:bg-[#142a4a] inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <ShoppingCart className="w-4 h-4" />
                                                    {isOutOfStock ? "Stokta Yok" : "Sepete Ekle"}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
