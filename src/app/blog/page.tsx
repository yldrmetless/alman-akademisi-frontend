"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetPublicBlogPostsQuery, useGetPublicCategoriesQuery } from "@/lib/features/blog/blogApi";

const FALLBACK_IMAGE = "/logo.webp";

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return FALLBACK_IMAGE;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
};

const createPostSlug = (slug: string, id: number) => {
    return `${slug}-${id}`;
};

export default function BlogListPage() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [ordering, setOrdering] = useState("-created_at");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [selectedCategory, ordering]);

    const { data: categoriesData } = useGetPublicCategoriesQuery();
    const { data: postsData, isLoading, isFetching, error } = useGetPublicBlogPostsQuery({
        page,
        title: debouncedSearch || undefined,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        ordering,
    });

    const categories = categoriesData?.results ?? [];
    const posts = postsData?.results ?? [];
    const hasPrevious = Boolean(postsData?.previous);
    const hasNext = Boolean(postsData?.next);
    const isEmpty = !isLoading && !isFetching && !error && posts.length === 0;

    const countLabel = useMemo(() => {
        const total = postsData?.count ?? 0;
        if (total === 0) return "Sonuc bulunamadi";
        return `${total} blog yazisi bulundu`;
    }, [postsData?.count]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <main className="grow max-w-[1200px] mx-auto w-full px-5 sm:px-8 lg:px-10 py-12 md:py-16 mt-16">
                <nav className="py-4 mb-6 border-b border-gray-100 text-sm font-medium flex items-center">
                    <Link href="/" className="text-gray-500 hover:text-[#1e3a8a] transition-colors">Ana Sayfa</Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <Link href="/blog" className="text-[#1e3a8a]">Blog</Link>
                </nav>

                <section className="mb-10">
                    <h1 className="text-4xl font-bold text-[#1e3a8a] mb-3">Blog</h1>
                    <p className="text-gray-600 text-lg max-w-2xl">Almanca egitimi ve yurtdisi yasami hakkinda guncel icerikleri kesfedin.</p>
                </section>

                <section className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10 w-full">
                    <div className="relative w-full max-w-[420px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Bloglarda ara..."
                            className="h-[52px] pl-10 pr-5 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:border-[#1e3a8a] focus:ring-4 focus:ring-[#1e3a8a]/5 outline-none transition-all"
                        />
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-[52px] px-5 rounded-xl border border-gray-200 bg-white min-w-[200px] cursor-pointer hover:border-[#1e3a8a] focus:ring-4 focus:ring-[#1e3a8a]/5 outline-none transition-all">
                                <SelectValue placeholder="Kategori secin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tum Kategoriler</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={ordering} onValueChange={setOrdering}>
                            <SelectTrigger className="h-[52px] px-5 rounded-xl border border-gray-200 bg-white min-w-[200px] cursor-pointer hover:border-[#1e3a8a] focus:ring-4 focus:ring-[#1e3a8a]/5 outline-none transition-all">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="-created_at">Yeniden Eskiye</SelectItem>
                                <SelectItem value="created_at">Eskiden Yeniye</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </section>

                <div className="mb-8 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{countLabel}</p>
                    {isFetching && !isLoading && <span className="text-xs text-slate-400">Guncelleniyor...</span>}
                </div>

                {isLoading ? (
                    <div className="py-20 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
                    </div>
                ) : error ? (
                    <div className="py-16 px-6 text-center rounded-2xl border border-slate-200 bg-white">
                        <p className="text-slate-600 font-medium">Blog yazilari yuklenemedi.</p>
                    </div>
                ) : isEmpty ? (
                    <div className="py-16 px-6 text-center rounded-2xl border border-slate-200 bg-white">
                        <p className="text-slate-600 font-medium">Filtrelere uygun blog yazisi bulunamadi.</p>
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => {
                                const firstCategory = post.categories?.[0]?.name;
                                const remainingCount = Math.max(0, (post.categories?.length || 0) - 1);

                                return (
                                    <Card
                                        key={post.id}
                                        className="h-full border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                                    >
                                        <Link href={`/blog/${createPostSlug(post.slug, post.id)}`} className="block">
                                            <div className="relative aspect-video overflow-hidden">
                                                <Image
                                                    src={getImageUrl(post.image_url)}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                />
                                            </div>
                                        </Link>

                                        <CardContent className="p-6">
                                            <p className="text-sm text-slate-500 font-medium mb-3">{formatDate(post.created_at)}</p>

                                            <Link href={`/blog/${createPostSlug(post.slug, post.id)}`} className="block">
                                                <h2 className="text-xl font-bold text-[#1f2937] hover:text-[#1e3a8a] transition-colors line-clamp-2 mb-4 leading-snug">
                                                    {post.title}
                                                </h2>
                                            </Link>

                                            {firstCategory && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className="bg-[#1e3a8a]/10 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 border-0 font-semibold">
                                                        {firstCategory}
                                                    </Badge>
                                                    {remainingCount > 0 && (
                                                        <Badge variant="outline" className="font-semibold text-slate-600 border-slate-200">
                                                            +{remainingCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </section>

                        <section className="mt-12 flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={!hasPrevious || isFetching}
                                className="h-11 px-4 rounded-xl border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Onceki
                            </Button>

                            <div className="h-11 px-5 rounded-xl border border-slate-200 bg-white flex items-center text-sm font-semibold text-[#1e3a8a]">
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
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
