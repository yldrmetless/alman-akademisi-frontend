"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGetCourseDetailQuery, useGetCourseListQuery } from "@/lib/features/course/courseApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Minus, Plus, ShoppingCart, Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

export default function OfflineCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const courseId = resolvedParams.id;

    const { data: courseDetailData, isLoading, error } = useGetCourseDetailQuery(courseId);
    const { data: relatedCoursesData } = useGetCourseListQuery({ type: "offline" });
    const relatedCourses = relatedCoursesData?.results?.filter((course) => String(course.id) !== String(courseId)).slice(0, 3) || [];

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const dispatch = useAppDispatch();
    const maxStock = Math.max(0, Number(courseDetailData?.quota ?? 0));
    const isStockAvailable = maxStock > 0;

    const clampQuantity = (value: number) => {
        if (maxStock <= 0) return 0;
        return Math.min(maxStock, Math.max(1, value));
    };

    useEffect(() => {
        setQuantity((prev) => clampQuantity(prev));
    }, [maxStock]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-[#1a365d]" />
            </div>
        );
    }

    if (error || !courseDetailData) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-white gap-4">
                <p className="text-2xl text-slate-500 font-bold">Kurs detayı yüklenirken bir hata oluştu.</p>
                <Link href="/kurslar/offline-almanca-kursu">
                    <Button variant="outline" className="rounded-xl border-[#1a365d] text-[#1a365d]">
                        Kurslara Dön
                    </Button>
                </Link>
            </div>
        );
    }

    const isDiscountActive = courseDetailData.discounted_price && Number(courseDetailData.discounted_price) > 0;
    const formatCurrency = (amount: string | number) =>
        new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(Number(amount));

    const addToCartAndReturn = () => {
        if (!isStockAvailable) {
            toast("Bu urun stokta bulunmuyor.", { icon: "⚠️" });
            return false;
        }

        const validQuantity = clampQuantity(quantity);
        setQuantity(validQuantity);
        const resolvedPrice = isDiscountActive
            ? Number(courseDetailData.discounted_price || 0)
            : Number(courseDetailData.price || 0);

        dispatch(
            addToCart({
                id: courseDetailData.id,
                name: courseDetailData.name,
                price: resolvedPrice,
                image: courseDetailData.image_url || "/logo.webp",
                quantity: validQuantity,
                type: "course",
                stock_limit: maxStock,
            })
        );
        toast.success("Kurs sepete eklendi.");
        return true;
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans pt-20 overflow-x-hidden">
            <main className="max-w-[1200px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-12 md:py-16 flex flex-col items-center">
                <div className="w-full flex justify-start">
                    <nav className="flex items-center text-sm text-slate-400 mb-10 gap-2 font-medium">
                        <Link href="/" className="hover:text-[#1a365d] transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/kurslar/offline-almanca-kursu" className="hover:text-[#1a365d] transition-colors">
                            Offline Kurslar
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-bold truncate">{courseDetailData.name}</span>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-10 lg:gap-[60px] w-full items-center mb-20">
                    <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[500px] max-h-[500px] rounded-[24px] shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] overflow-hidden bg-slate-50 border border-slate-100 group">
                        {courseDetailData.image_url ? (
                            <Image
                                src={courseDetailData.image_url}
                                alt={courseDetailData.name}
                                fill
                                className="object-contain p-5 sm:p-7 lg:p-8 transition-transform duration-500 group-hover:scale-[1.02]"
                                priority
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-300">
                                <Info className="w-20 h-20 opacity-50" />
                            </div>
                        )}

                        <div className="absolute top-5 left-5 sm:top-6 sm:left-6 flex gap-3 pointer-events-none">
                            <Badge className="bg-white/95 text-[#1a365d] font-semibold px-4 py-1.5 rounded-xl text-[10px] border border-slate-200 shadow-sm backdrop-blur-md uppercase tracking-[0.08em]">
                                Offline Eğitim
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="mb-5">
                            <Badge className="bg-[#1a365d]/5 text-[#1a365d] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
                                {courseDetailData.category_name || "Almanca Dil Kursu"}
                            </Badge>
                            <h1 className="text-[2.2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-extrabold text-[#1a365d] mb-5 leading-[1.08] tracking-tight">
                                {courseDetailData.name}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-9">
                            <div className="flex items-end gap-3 sm:gap-4">
                                {isDiscountActive ? (
                                    <>
                                        <span className="text-base sm:text-lg text-slate-300 line-through font-semibold">
                                            {formatCurrency(courseDetailData.price || 0)} ₺
                                        </span>
                                        <span className="text-[2rem] sm:text-[2.3rem] font-extrabold text-[#1a365d] leading-none">
                                            {formatCurrency(courseDetailData.discounted_price || 0)} ₺
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[2.1rem] sm:text-[2.5rem] font-extrabold text-[#1a365d] leading-none">
                                        {formatCurrency(courseDetailData.price || 0)} ₺
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pb-9 border-b border-slate-100">
                            <div className="flex items-center justify-between border border-slate-200 rounded-2xl px-2 py-1.5 bg-white w-[170px] shrink-0">
                                <button
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                    disabled={!isStockAvailable || quantity <= 1}
                                    className="p-3 hover:bg-slate-50 rounded-xl transition-all text-[#1a365d] disabled:opacity-50"
                                >
                                    <Minus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={maxStock || 1}
                                    value={isStockAvailable ? quantity : 0}
                                    onChange={(event) => {
                                        const parsed = Number(event.target.value);
                                        if (!Number.isNaN(parsed)) setQuantity(clampQuantity(parsed));
                                    }}
                                    className="w-14 bg-transparent text-center text-lg font-bold text-[#1a365d] tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    disabled={!isStockAvailable}
                                />
                                <button
                                    onClick={() => setQuantity((prev) => clampQuantity(prev + 1))}
                                    disabled={!isStockAvailable || quantity >= maxStock}
                                    className="p-3 hover:bg-slate-50 rounded-xl transition-all text-[#1a365d] disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                            </div>

                            <Button
                                onClick={addToCartAndReturn}
                                disabled={!isStockAvailable}
                                className="h-[52px] px-8 rounded-2xl bg-[#1a365d] text-white text-base font-bold hover:bg-[#142642] shadow-lg"
                            >
                                <ShoppingCart className="mr-2.5 w-5 h-5" />
                                Sepete Ekle
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="w-full mt-6 py-12">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b border-slate-100 mb-12">
                            <TabsList className="flex justify-center bg-transparent h-auto p-0 gap-16 w-full">
                                <TabsTrigger
                                    value="description"
                                    className="relative py-6 px-4 text-xl font-bold tracking-tight text-slate-400 data-[state=active]:text-[#1a365d] bg-transparent rounded-none transition-all hover:text-[#1a365d] data-[state=active]:shadow-none active:bg-transparent"
                                >
                                    Açıklama
                                    {activeTab === "description" && (
                                        <motion.div
                                            layoutId="offlineActiveTabUnderline"
                                            className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1a365d] rounded-t-full"
                                        />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="installments"
                                    className="relative py-6 px-4 text-xl font-bold tracking-tight text-slate-400 data-[state=active]:text-[#1a365d] bg-transparent rounded-none transition-all hover:text-[#1a365d] data-[state=active]:shadow-none active:bg-transparent"
                                >
                                    Taksit Seçenekleri
                                    {activeTab === "installments" && (
                                        <motion.div
                                            layoutId="offlineActiveTabUnderline"
                                            className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1a365d] rounded-t-full"
                                        />
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="w-full min-h-[500px] flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                {activeTab === "description" && (
                                    <motion.div
                                        key="offline-desc"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full max-w-4xl prose prose-slate prose-xl text-slate-600 leading-[1.8] font-medium text-center"
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: courseDetailData.description || "" }} />
                                    </motion.div>
                                )}

                                {activeTab === "installments" && (
                                    <motion.div
                                        key="offline-inst"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-full max-w-4xl py-12 text-center"
                                    >
                                        <p className="text-lg font-medium text-slate-500">
                                            Taksit seçenekleri mevcut değildir
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>

                {relatedCourses.length > 0 && (
                    <div className="w-full mt-10 pt-16 border-t border-slate-50">
                        <div className="flex flex-col items-center mb-12 space-y-4">
                            <h2 className="text-4xl font-black text-[#1a365d] tracking-tight">İlgili Offline Kurslar</h2>
                            <div className="w-24 h-1.5 bg-[#1a365d] rounded-full opacity-10"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
                            {relatedCourses.map((course) => (
                                <Card key={course.id} className="group border-0 rounded-[40px] overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col bg-white">
                                    <div className="relative aspect-16/11 overflow-hidden bg-slate-50">
                                        {course.image_url ? (
                                            <Image src={course.image_url} alt={course.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                <Info className="w-12 h-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-9">
                                        <h3 className="text-2xl font-bold text-[#1a365d] line-clamp-1 mb-3">{course.name}</h3>
                                        <Link href={`/kurslar/offline-almanca-kursu/${course.id}`} className="w-full">
                                            <Button variant="outline" className="w-full rounded-2xl py-6 h-auto border-2 border-slate-100 hover:border-[#1a365d] text-[#1a365d] font-bold text-base transition-all">
                                                Detay Gör
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
