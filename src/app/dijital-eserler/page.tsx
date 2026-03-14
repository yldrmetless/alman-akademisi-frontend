"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetDigitalProductsQuery } from "@/lib/features/course/courseApi";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

const FALLBACK_IMAGE = "/logo.webp";

const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return FALLBACK_IMAGE;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
};

const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(Number(amount ?? 0));
};

const createProductSlug = (name: string, id: number) => {
    const normalized = name
        .toLocaleLowerCase("tr-TR")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    return `${normalized}-${id}`;
};

export default function DigitalProductsPage() {
    const dispatch = useAppDispatch();
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [addedItemKey, setAddedItemKey] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, 450);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isFetching, error } = useGetDigitalProductsQuery({
        page,
        search: debouncedSearch || undefined,
    });

    const products = data?.results ?? [];
    const hasNext = Boolean(data?.next);
    const hasPrevious = Boolean(data?.previous);

    const isEmpty = !isLoading && !isFetching && !error && products.length === 0;

    const resultLabel = useMemo(() => {
        const total = data?.count ?? 0;
        if (total === 0) return "Sonuc bulunamadi";
        return `${total} dijital eser bulundu`;
    }, [data?.count]);

    const handleQuickAdd = (product: (typeof products)[number]) => {
        const stockLimit = Math.max(0, Number(product.stock ?? 0));
        if (stockLimit <= 0) return;

        const resolvedPrice =
            product.discounted_price && Number(product.discounted_price) > 0
                ? Number(product.discounted_price)
                : Number(product.price);

        dispatch(
            addToCart({
                id: product.id,
                name: product.name,
                price: resolvedPrice,
                image: getImageUrl(product.main_image?.url),
                quantity: 1,
                type: "digital_product",
                stock_limit: stockLimit,
            })
        );

        const key = `digital-${product.id}`;
        setAddedItemKey(key);
        setTimeout(() => {
            setAddedItemKey((prev) => (prev === key ? null : prev));
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <main className="grow max-w-[1200px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-12 md:py-16 mt-16">
                <div className="w-full flex justify-start mb-8">
                    <nav className="flex items-center text-sm text-slate-400 gap-2 font-medium">
                        <Link href="/" className="hover:text-[#1a365d] transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-bold">Dijital Eserler</span>
                    </nav>
                </div>

                <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a365d] tracking-tight">Dijital Eserler</h1>
                        <p className="text-slate-600 mt-3 text-base md:text-lg">Aninda erisebileceginiz premium dijital icerikleri kesfedin.</p>
                    </div>

                    <div className="w-full md:w-[360px]">
                        <label className="relative block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Dijital eser ara..."
                                className="w-full h-12 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a365d]/15 focus:border-[#1a365d]/40 transition-all"
                                aria-label="Dijital eser arama"
                            />
                        </label>
                    </div>
                </section>

                <div className="mb-7 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{resultLabel}</p>
                    {isFetching && !isLoading && (
                        <span className="text-xs text-slate-400">Guncelleniyor...</span>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1a365d]" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-lg text-slate-500 font-medium">Dijital eserler yuklenirken bir hata olustu.</p>
                    </div>
                ) : isEmpty ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-lg text-slate-500 font-medium">Aramaniza uygun dijital eser bulunamadi.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                            {products.map((product) => {
                                const isDiscounted = product.discounted_price && Number(product.discounted_price) > 0;
                                const productImage = getImageUrl(product.main_image?.url);
                                const stockLimit = Math.max(0, Number(product.stock ?? 0));
                                const isOutOfStock = stockLimit <= 0;
                                const itemKey = `digital-${product.id}`;
                                const isAddedFeedback = addedItemKey === itemKey;

                                return (
                                    <Card
                                        key={product.id}
                                        className="h-full flex flex-col bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                                            <Image
                                                src={productImage}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                                            />
                                        </div>

                                        <CardContent className="p-5 flex-1 flex flex-col">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-[#1a365d] line-clamp-1 mb-2">{product.name}</h3>
                                                <Badge className={`${isOutOfStock ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"} hover:bg-inherit px-2.5 py-1 rounded-md border-0 font-semibold text-xs mb-4`}>
                                                    {isOutOfStock ? "Stokta Yok" : `${product.stock} adet stokta`}
                                                </Badge>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-slate-100">
                                                <div className="mb-4">
                                                    {isDiscounted ? (
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-sm text-slate-400 line-through font-medium">
                                                                {formatCurrency(product.price)} ₺
                                                            </span>
                                                            <span className="text-2xl font-bold text-[#1a365d] leading-none">
                                                                {formatCurrency(product.discounted_price || 0)} ₺
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-2xl font-bold text-[#1a365d] leading-none">
                                                            {formatCurrency(product.price)} ₺
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 h-11 rounded-xl border-[#1a365d]/20 text-[#1a365d] hover:bg-slate-50"
                                                        asChild
                                                    >
                                                        <Link href={`/dijital-eserler/${createProductSlug(product.name, product.id)}`}>Detay</Link>
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleQuickAdd(product)}
                                                        disabled={isOutOfStock || isAddedFeedback}
                                                        className="flex-2 h-11 rounded-xl bg-[#1a365d] hover:bg-[#142a4a] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                                        {isOutOfStock ? "Stokta Yok" : isAddedFeedback ? "Eklendi!" : "Sepete Ekle"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <div className="mt-12 flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={!hasPrevious || isFetching}
                                className="h-11 px-4 rounded-xl border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Onceki
                            </Button>

                            <div className="h-11 px-5 rounded-xl border border-slate-200 bg-white flex items-center text-sm font-semibold text-[#1a365d]">
                                Sayfa {page}
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!hasNext || isFetching}
                                className="h-11 px-4 rounded-xl border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Sonraki
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
