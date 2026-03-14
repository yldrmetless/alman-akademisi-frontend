"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import { useGetDigitalProductDetailQuery } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";

export default function DigitalProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const { data: response, isLoading: isFetchingProduct, isError } = useGetDigitalProductDetailQuery(id, {
        skip: !id
    });

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const product = response?.data;

    useEffect(() => {
        if (product?.images?.length) {
            // Find primary or default to first
            const primary = product.images.find(img => img.is_primary);
            setSelectedImage(primary ? primary.digital_product_image_url : product.images[0].digital_product_image_url);
        }
    }, [product]);

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-screen bg-[#F8FAFC] flex-col">
                <Sidebar
                    firstName={profile?.first_name || ""}
                    lastName={profile?.last_name || ""}
                    username={profile?.username || ""}
                />
                <main className="flex-1 lg:ml-72 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800">Eser bulunamadı veya bir hata oluştu.</h2>
                        <Button variant="link" onClick={() => router.push("/dashboard/digital-products")} className="mt-2 text-[#1A3EB1]">
                            Listeye dön
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // Skeleton Hydration Rescue
    if (isFetchingProduct || !product) {
        return (
            <div className="flex min-h-screen bg-[#F8FAFC]">
                <Sidebar
                    firstName={profile?.first_name || ""}
                    lastName={profile?.last_name || ""}
                    username={profile?.username || ""}
                />
                <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                    <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-6">
                        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
                        <div className="flex justify-between items-center">
                            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
                            <div className="flex gap-3">
                                <div className="h-11 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
                                <div className="h-11 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
                                <div className="flex flex-col justify-center space-y-6">
                                    <div className="h-10 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="flex gap-4 pt-8">
                                        <div className="h-12 w-32 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const priceVal = parseFloat(product.price as string) || 0;
    const discountVal = product.discounted_price ? parseFloat(product.discounted_price as string) : null;
    const hasDiscount = discountVal !== null && discountVal < priceVal;

    // Handle tags safely
    const tagsArray = Array.isArray(product.tags) ? product.tags : [];
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-6">

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <span
                            className="hover:text-[#1A3EB1] cursor-pointer transition-colors"
                            onClick={() => router.push("/dashboard/digital-products")}
                        >
                            Dijital Eserler
                        </span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-slate-900 font-bold">Eser Detayı</span>
                    </div>

                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Eser Detayı
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                onClick={() => toast("Silme işlemi şu an tasarruf modunda", { icon: "ℹ️" })}
                            >
                                <Trash2 className="h-4 w-4" />
                                Sil
                            </Button>
                            <Button
                                type="button"
                                className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                onClick={() => router.push(`/dashboard/digital-products/edit/${id}`)}
                            >
                                <Pencil className="h-4 w-4" />
                                Düzenle
                            </Button>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">

                            {/* Left Column: Image Gallery */}
                            <div className="p-8 lg:p-12 lg:border-r border-slate-100 flex flex-col gap-6">
                                {/* Large Preview Box */}
                                <div className="w-full aspect-square bg-[#F5F5F3] rounded-2xl overflow-hidden relative border border-slate-100 flex items-center justify-center">
                                    {selectedImage ? (
                                        <Image
                                            src={selectedImage}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-4"
                                        />
                                    ) : (
                                        <ImageIcon className="h-16 w-16 text-slate-200" />
                                    )}
                                </div>

                                {/* Thumbnail Strip */}
                                {product?.images && product.images.length > 0 && (
                                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
                                        {product.images.map((img) => (
                                            <button
                                                key={img.id}
                                                onClick={() => setSelectedImage(img.digital_product_image_url)}
                                                className={`h-24 w-24 rounded-lg bg-[#F5F5F3] flex-shrink-0 relative overflow-hidden transition-all border-2 
                                                    ${selectedImage === img.digital_product_image_url ? 'border-[#1A3EB1] ring-2 ring-[#1A3EB1]/20' : 'border-transparent hover:border-slate-300'}`}
                                            >
                                                <Image
                                                    src={img.digital_product_image_url}
                                                    alt={`Thumbnail ${img.id}`}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Product Info */}
                            <div className="p-8 lg:p-12 flex flex-col justify-center">

                                <h2 className="text-4xl font-extrabold text-[#111827] leading-tight mb-4">
                                    {product.name}
                                </h2>

                                <p className="text-slate-500 text-lg leading-relaxed mb-6">
                                    {product.description || "Bu dijital eser için henüz bir açıklama girilmemiş."}
                                </p>

                                {/* Meta details: Category & Format */}
                                <div className="flex items-center gap-6 mb-6">
                                    {categoryName && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-500">Kategori:</span>
                                            <span className="text-sm font-bold text-slate-900">{categoryName}</span>
                                        </div>
                                    )}
                                    {product.format && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-500">Format:</span>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">
                                                {product.format.toUpperCase()}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Tag Cloud */}
                                {tagsArray.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-8">
                                        {tagsArray.map((tag: any, idx) => {
                                            const tagName = typeof tag === 'object' ? tag.name : tag;
                                            return (
                                                <Badge key={idx} variant="secondary" className="bg-[#F3F4F6] text-slate-600 hover:bg-slate-200 font-medium px-3 py-1">
                                                    #{tagName}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Pricing and Stock Section */}
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-8">
                                    <div className="flex items-end gap-3">
                                        {hasDiscount ? (
                                            <>
                                                <span className="text-2xl font-semibold text-slate-400 line-through mb-1">{priceVal} ₺</span>
                                                <span className="text-5xl font-black text-[#1A3EB1]">{discountVal} ₺</span>
                                            </>
                                        ) : (
                                            <span className="text-5xl font-black text-[#1A3EB1]">{priceVal} ₺</span>
                                        )}
                                    </div>

                                    {/* Stock Indicator */}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Durumu</span>
                                        <Badge variant="outline" className={`px-3 py-1 text-sm font-bold border-2 ${product.stock > 0 ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                                            {product.stock > 0 ? `${product.stock} Adet` : "Tükendi"}
                                        </Badge>
                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
