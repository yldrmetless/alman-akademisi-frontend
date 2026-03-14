"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useGetDigitalProductDetailCustomerQuery } from "@/lib/features/course/courseApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Minus, Plus, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

type PageParams = {
    slug: string;
};

const FALLBACK_IMAGE = "/logo.webp";

const formatCurrency = (amount: string | number | null | undefined) => {
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(Number(amount ?? 0));
};

const resolveImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return FALLBACK_IMAGE;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return `${base}${imageUrl}`;
};

const extractIdFromSlug = (slug: string) => {
    if (/^\d+$/.test(slug)) return slug;
    const matchedId = slug.match(/(\d+)(?!.*\d)/);
    return matchedId ? matchedId[1] : slug;
};

export default function DigitalProductDetailPage({ params }: { params: Promise<PageParams> }) {
    const { slug } = use(params);
    const productId = extractIdFromSlug(slug);

    const { data: detailResponse, isLoading, error } = useGetDigitalProductDetailCustomerQuery(productId, {
        skip: !productId,
    });

    const product = detailResponse?.data;

    const galleryImages = useMemo(() => {
        if (!product?.images || product.images.length === 0) return [];
        return product.images.map((img) => resolveImageUrl(img.digital_product_image_url));
    }, [product?.images]);

    const [activeImage, setActiveImage] = useState<string>(FALLBACK_IMAGE);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<"description" | "installments">("description");
    const dispatch = useAppDispatch();

    const maxStock = Math.max(0, Number(product?.stock ?? 0));
    const isInStock = maxStock > 0;

    useEffect(() => {
        if (galleryImages.length > 0) {
            setActiveImage(galleryImages[0]);
        } else {
            setActiveImage(FALLBACK_IMAGE);
        }
    }, [galleryImages]);

    useEffect(() => {
        if (!isInStock) {
            setQuantity(0);
            return;
        }
        setQuantity((prev) => Math.min(maxStock, Math.max(1, prev)));
    }, [isInStock, maxStock]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#1a365d]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
                <p className="text-xl text-slate-600 font-semibold mb-4">Dijital eser detayi yuklenemedi.</p>
                <Link href="/dijital-eserler">
                    <Button variant="outline" className="rounded-xl border-[#1a365d] text-[#1a365d]">
                        Dijital Eserlere Don
                    </Button>
                </Link>
            </div>
        );
    }

    const price = Number(product.price ?? 0);
    const discounted = product.discounted_price !== null ? Number(product.discounted_price) : null;
    const hasDiscount = discounted !== null && discounted > 0 && discounted < price;

    const incrementQuantity = () => {
        if (!isInStock || quantity >= maxStock) return;
        setQuantity((prev) => prev + 1);
    };

    const decrementQuantity = () => {
        if (!isInStock) return;
        setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleInputChange = (value: string) => {
        if (!isInStock) return;
        if (value === "") {
            setQuantity(1);
            return;
        }

        const parsed = Number(value);
        if (Number.isNaN(parsed)) return;

        if (parsed > maxStock) {
            setQuantity(maxStock);
            toast(`Maksimum stok: ${maxStock}`, { icon: "ℹ️" });
            return;
        }
        setQuantity(Math.max(1, parsed));
    };

    const handleAddToCart = () => {
        if (!isInStock) {
            toast("Urun stokta yok.", { icon: "⚠️" });
            return;
        }

        const safeQuantity = Math.min(maxStock, Math.max(1, quantity));
        setQuantity(safeQuantity);
        const resolvedPrice = hasDiscount && discounted ? discounted : price;
        dispatch(
            addToCart({
                id: product.id,
                name: product.name,
                price: Number(resolvedPrice),
                image: activeImage || FALLBACK_IMAGE,
                quantity: safeQuantity,
                type: "digital_product",
                stock_limit: maxStock,
            })
        );
        toast("Urun sepete eklendi.", { icon: "🛒" });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans pt-20 overflow-x-hidden">
            <main className="max-w-[1200px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-12 md:py-16">
                <div className="w-full flex justify-start mb-10">
                    <nav className="flex items-center text-sm text-slate-400 gap-2 font-medium">
                        <Link href="/" className="hover:text-[#1a365d] transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/dijital-eserler" className="hover:text-[#1a365d] transition-colors">Dijital Eserler</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-slate-900 font-bold truncate">{product.name}</span>
                    </nav>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-[46%_54%] gap-10 lg:gap-[60px] items-center">
                    <div className="w-full">
                        <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[500px] max-h-[500px] rounded-2xl border border-slate-100 bg-slate-50 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
                            {activeImage ? (
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-6"
                                    sizes="(max-width: 1024px) 100vw, 46vw"
                                    priority
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-slate-300" />
                                </div>
                            )}
                        </div>

                        {galleryImages.length > 1 && (
                            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-3">
                                {galleryImages.map((imageSrc, index) => {
                                    const isActive = imageSrc === activeImage;
                                    return (
                                        <button
                                            key={`${imageSrc}-${index}`}
                                            onClick={() => setActiveImage(imageSrc)}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isActive
                                                ? "border-[#1a365d] ring-2 ring-[#1a365d]/20"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            aria-label={`Gorsel ${index + 1}`}
                                        >
                                            <Image
                                                src={imageSrc}
                                                alt={`${product.name} kucuk gorsel ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="120px"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center">
                        <h1 className="text-[2.1rem] sm:text-[2.5rem] lg:text-[2.9rem] font-extrabold text-[#1a365d] leading-[1.08] tracking-tight mb-5">
                            {product.name}
                        </h1>

                        <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-[62ch]">
                            {product.description || "Bu dijital eser icin aciklama bulunmuyor."}
                        </p>

                        <div className="flex flex-wrap items-center gap-5 mb-8">
                            <div className="flex items-end gap-3">
                                {hasDiscount ? (
                                    <>
                                        <span className="text-base sm:text-lg text-slate-300 line-through font-semibold">
                                            {formatCurrency(price)} ₺
                                        </span>
                                        <span className="text-[2rem] sm:text-[2.3rem] font-extrabold text-[#1a365d] leading-none">
                                            {formatCurrency(discounted)} ₺
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[2.1rem] sm:text-[2.5rem] font-extrabold text-[#1a365d] leading-none">
                                        {formatCurrency(price)} ₺
                                    </span>
                                )}
                            </div>

                            <Badge className={`${isInStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"} hover:bg-inherit px-3 py-1.5 rounded-lg border-0 font-semibold text-sm`}>
                                {isInStock ? `${maxStock} adet stokta` : "Stokta yok"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 h-[52px] w-full mt-6 pb-8 border-b border-slate-100">
                            <div className="flex items-center justify-between h-[52px] w-[140px] shrink-0 rounded-2xl border border-[#e5e7eb] bg-transparent px-4 font-bold text-lg text-[#1e3a8a]">
                                <button
                                    onClick={decrementQuantity}
                                    disabled={!isInStock || quantity <= 1}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={maxStock || 1}
                                    value={isInStock ? quantity : 0}
                                    onChange={(event) => handleInputChange(event.target.value)}
                                    className="w-[34px] min-w-[30px] bg-transparent text-center text-lg font-bold leading-none text-[#1e3a8a] tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    disabled={!isInStock}
                                    aria-label="Urun adedi"
                                />
                                <button
                                    onClick={incrementQuantity}
                                    disabled={!isInStock || quantity >= maxStock}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                </button>
                            </div>

                            <Button
                                onClick={handleAddToCart}
                                disabled={!isInStock}
                                className="h-[52px] w-fit min-w-[220px] max-w-[240px] shrink-0 rounded-2xl bg-[#1e3a8a] px-10 text-lg font-bold text-white shadow-lg inline-flex items-center justify-center gap-2 transition-all hover:bg-[#1a347d] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Sepete Ekle
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="w-full mt-12">
                    <div className="border-b border-slate-200">
                        <div className="flex items-center gap-10">
                            <button
                                type="button"
                                onClick={() => setActiveTab("description")}
                                className={`pb-4 text-base font-semibold transition-colors border-b-2 ${activeTab === "description"
                                    ? "text-[#1e3a8a] border-[#1e3a8a]"
                                    : "text-slate-500 border-transparent hover:text-[#1e3a8a]"
                                    }`}
                            >
                                Açıklama
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("installments")}
                                className={`pb-4 text-base font-semibold transition-colors border-b-2 ${activeTab === "installments"
                                    ? "text-[#1e3a8a] border-[#1e3a8a]"
                                    : "text-slate-500 border-transparent hover:text-[#1e3a8a]"
                                    }`}
                            >
                                Taksit Seçenekleri
                            </button>
                        </div>
                    </div>

                    <div className="py-10 px-1 sm:px-2">
                        {activeTab === "description" ? (
                            <div className="max-w-4xl text-slate-600 leading-8 text-base sm:text-lg">
                                <div dangerouslySetInnerHTML={{ __html: product.description || "Aciklama bulunmuyor." }} />
                            </div>
                        ) : (
                            <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                <div className="grid grid-cols-3 bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base">
                                    <div className="px-5 py-4 border-r border-slate-200">Taksit</div>
                                    <div className="px-5 py-4 border-r border-slate-200">Aylik Tutar</div>
                                    <div className="px-5 py-4">Toplam</div>
                                </div>
                                {[1, 2, 3, 6, 9].map((count) => {
                                    const currentPrice = hasDiscount && discounted ? discounted : price;
                                    const monthly = currentPrice / count;
                                    return (
                                        <div key={count} className="grid grid-cols-3 text-sm sm:text-base text-slate-600 border-t border-slate-100">
                                            <div className="px-5 py-4 border-r border-slate-100">{count} Taksit</div>
                                            <div className="px-5 py-4 border-r border-slate-100">{formatCurrency(monthly)} ₺</div>
                                            <div className="px-5 py-4">{formatCurrency(currentPrice)} ₺</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
