"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGetCourseDetailQuery, useGetCourseListQuery } from "@/lib/features/course/courseApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Minus, Plus, ShoppingCart, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

export default function CourseDetailPage({ params }: { params: Promise<{ "level-slug": string; id: string }> }) {
    // Standardizing with Next.js 15 param resolution
    const resolvedParams = use(params);
    const courseId = resolvedParams.id;
    const levelSlug = resolvedParams["level-slug"];

    const { data: courseDetailData, isLoading, error } = useGetCourseDetailQuery(courseId);

    // Fetch related courses (same level)
    const { data: relatedCoursesData } = useGetCourseListQuery({ level: courseDetailData?.level || "A1" });
    const relatedCourses = relatedCoursesData?.results?.filter(c => c.id.toString() !== courseId).slice(0, 3) || [];

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const dispatch = useAppDispatch();
    const max_stock = Math.max(0, Number(courseDetailData?.quota ?? 0));
    const clampQuantity = (value: number) => {
        if (max_stock <= 0) return 0;
        return Math.min(max_stock, Math.max(1, value));
    };

    useEffect(() => {
        setQuantity((prev) => clampQuantity(prev));
    }, [max_stock]);

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
                <Link href="/kurslar">
                    <Button variant="outline" className="rounded-xl border-[#1a365d] text-[#1a365d]">
                        Kurslara Dön
                    </Button>
                </Link>
            </div>
        );
    }

    const isDiscountActive = courseDetailData.discounted_price && Number(courseDetailData.discounted_price) > 0;
    const isStockAvailable = max_stock > 0;

    const incrementQuantity = () => {
        if (!isStockAvailable || quantity >= max_stock) return;
        setQuantity((prev) => prev + 1);
    };

    const decrementQuantity = () => {
        if (!isStockAvailable) return;
        setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleQuantityInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isStockAvailable) return;

        const rawValue = event.target.value;
        if (rawValue === "") {
            setQuantity(1);
            return;
        }

        const parsedValue = Number(rawValue);
        if (Number.isNaN(parsedValue)) return;

        if (parsedValue > max_stock) {
            setQuantity(max_stock);
            toast(`Maksimum stok miktari: ${max_stock}`, { icon: "ℹ️" });
            return;
        }

        setQuantity(Math.max(1, parsedValue));
    };

    const handleAddToCart = () => {
        if (!isStockAvailable) {
            toast("Bu urun stokta bulunmuyor.", { icon: "⚠️" });
            return;
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
                stock_limit: max_stock,
            })
        );
        toast("Urun sepete eklendi.", { icon: "🛒" });
    };

    // Formatting currency for Turkish locale
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Number(amount));
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans pt-20 overflow-x-hidden">
            <main className="max-w-[1200px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-12 md:py-16 flex flex-col items-center">

                {/* Dynamic Breadcrumb - Centered Container Alignment */}
                <div className="w-full flex justify-start">
                    <nav className="flex items-center text-sm text-slate-400 mb-10 gap-2 font-medium">
                        <Link href="/" className="hover:text-[#1a365d] transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/kurslar" className="hover:text-[#1a365d] transition-colors">Kurslar</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/kurslar/${levelSlug}`} className="hover:text-[#1a365d] transition-colors uppercase">
                            {courseDetailData.level || levelSlug.split('-')[0].toUpperCase()}
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-bold truncate">{courseDetailData.name}</span>
                    </nav>
                </div>

                {/* Hero Section - Balanced PDP Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-10 lg:gap-[60px] w-full items-center mb-20">
                    {/* Course Image - Constrained and balanced */}
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

                        {/* Status Badge Overlay */}
                        <div className="absolute top-5 left-5 sm:top-6 sm:left-6 flex gap-3 pointer-events-none">
                            <Badge className="bg-white/95 text-[#1a365d] font-semibold px-4 py-1.5 rounded-xl text-[10px] border border-slate-200 shadow-sm backdrop-blur-md uppercase tracking-[0.08em]">
                                {courseDetailData.type === 'online' ? 'Online Eğitim' : 'Yüz Yüze'}
                            </Badge>
                        </div>
                    </div>

                    {/* Course Details - Hierarchical content */}
                    <div className="flex flex-col justify-center">
                        <div className="mb-5">
                            <Badge className="bg-[#1a365d]/5 text-[#1a365d] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
                                {courseDetailData.category_name || "Almanca Dil Kursu"}
                            </Badge>
                            <h1 className="text-[2.2rem] sm:text-[2.5rem] lg:text-[2.9rem] font-extrabold text-[#1a365d] mb-5 leading-[1.08] tracking-tight">
                                {courseDetailData.name}
                            </h1>
                        </div>

                        <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-9 font-medium max-w-[62ch]">
                            {courseDetailData.description?.replace(/<[^>]*>?/gm, '').slice(0, 320)}...
                        </p>

                        {/* Pricing & Stock Section */}
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

                            {isStockAvailable && (
                                <div className="flex flex-col">
                                    <span className="text-sm sm:text-base font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                                        {max_stock} adet stokta
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Stabilized Action Section */}
                        <div className="flex flex-row items-center gap-4 pb-9 border-b border-slate-100">
                            <div className="flex items-center justify-between border border-slate-200 rounded-2xl px-2 py-1.5 bg-white w-[170px] shrink-0">
                                <button
                                    onClick={decrementQuantity}
                                    disabled={!isStockAvailable || quantity <= 1}
                                    className="p-3 hover:bg-slate-50 rounded-xl transition-all text-[#1a365d] active:scale-95"
                                >
                                    <Minus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={max_stock || 1}
                                    value={isStockAvailable ? quantity : 0}
                                    onChange={handleQuantityInputChange}
                                    className="w-14 bg-transparent text-center text-lg font-bold text-[#1a365d] tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    disabled={!isStockAvailable}
                                    aria-label="Urun adedi"
                                />
                                <button
                                    onClick={incrementQuantity}
                                    disabled={!isStockAvailable || quantity >= max_stock}
                                    className="p-3 hover:bg-slate-50 rounded-xl transition-all text-[#1a365d] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                            </div>
                            <Button
                                onClick={handleAddToCart}
                                disabled={!isStockAvailable}
                                className="h-[52px] px-8 sm:px-10 rounded-2xl bg-[#1a365d] text-white text-base sm:text-lg font-bold hover:bg-[#142642] transition-all shadow-lg shadow-blue-950/20 w-fit max-w-[240px] min-w-[200px] justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="mr-2.5 w-5 h-5" />
                                Sepete Ekle
                            </Button>
                        </div>

                        {/* Metadata Tags */}
                        {courseDetailData.tags && courseDetailData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2.5 mt-7">
                                {courseDetailData.tags.map((tag, index) => (
                                    <span key={index} className="px-4 py-2 rounded-xl bg-slate-50 text-slate-500 font-medium text-xs sm:text-sm tracking-tight border border-slate-100">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Overhauled Tab System - Stability & Elegance */}
                <div className="w-full mt-10">
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
                                            layoutId="activeTabUnderline"
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
                                            layoutId="activeTabUnderline"
                                            className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1a365d] rounded-t-full"
                                        />
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Content Container - Height Stability */}
                        <div className="w-full min-h-[500px] flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                {activeTab === "description" && (
                                    <motion.div
                                        key="desc"
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
                                        key="inst"
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

                {/* Related Products Grid - Professional Layout */}
                {relatedCourses.length > 0 && (
                    <div className="w-full mt-32 pt-24 border-t border-slate-50">
                        <div className="flex flex-col items-center mb-16 space-y-4">
                            <h2 className="text-4xl font-black text-[#1a365d] tracking-tight">İlgili Kurslar</h2>
                            <div className="w-24 h-1.5 bg-[#1a365d] rounded-full opacity-10"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
                            {relatedCourses.map((course) => (
                                <Card key={course.id} className="group border-0 rounded-[40px] overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col bg-white">
                                    <div className="relative aspect-16/11 overflow-hidden bg-slate-50">
                                        {course.image_url ? (
                                            <Image
                                                src={course.image_url}
                                                alt={course.name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                <Info className="w-12 h-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-9 flex-1 flex flex-col justify-between">
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-[#1a365d] line-clamp-1 mb-3 group-hover:text-[#1e40af] transition-colors">
                                                {course.name}
                                            </h3>
                                            <p className="text-lg text-slate-400 line-clamp-2 leading-relaxed">
                                                {course.description?.replace(/<[^>]*>?/gm, '') || "Almanca dil eğitimi programı."}
                                            </p>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="flex items-center gap-3 mb-8">
                                                <span className="text-3xl font-black text-[#1a365d]">
                                                    {formatCurrency(course.discounted_price || course.price)} ₺
                                                </span>
                                                {course.discounted_price && (
                                                    <span className="text-lg text-slate-300 line-through font-bold">
                                                        {formatCurrency(course.price)} ₺
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <Link href={`/kurslar/${levelSlug}/${course.id}`} className="w-full">
                                                    <Button variant="outline" className="w-full rounded-2xl py-6 h-auto border-2 border-slate-100 hover:border-[#1a365d] text-[#1a365d] font-bold text-base transition-all">
                                                        Detaylı İncele
                                                    </Button>
                                                </Link>
                                                <Button className="w-full rounded-2xl py-6 h-auto bg-[#1a365d] text-white font-bold text-base shadow-lg shadow-blue-900/5">
                                                    Sepete Ekle
                                                </Button>
                                            </div>
                                        </div>
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
