"use client";

import React, { use, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Eye, Loader2, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetBlogPostDetailQuery } from "@/lib/features/blog/blogApi";

type PageParams = {
    slug: string;
};

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

const extractPostId = (slug: string) => {
    const matchedId = slug.match(/(\d+)(?!.*\d)/);
    return matchedId ? matchedId[1] : null;
};

export default function BlogPostDetailPage({ params }: { params: Promise<PageParams> }) {
    const { slug } = use(params);
    const identifier = extractPostId(slug);

    const { data: post, isLoading, error } = useGetBlogPostDetailQuery(identifier, {
        skip: !identifier,
    });

    const categories = post?.categories ?? [];
    const tags = useMemo(() => {
        if (!post?.tags) return [];
        return post.tags
            .map((tag) => (typeof tag === "string" ? tag : tag?.name))
            .filter((tagName): tagName is string => Boolean(tagName));
    }, [post?.tags]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-lg text-slate-600 font-medium mb-4">
                        {!identifier ? "Gecerli bir yazi kimligi bulunamadi." : "Blog yazisi yuklenemedi."}
                    </p>
                    <Link href="/blog" className="text-[#1e3a8a] font-semibold hover:underline">
                        Blog listesine don
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <main className="max-w-[1200px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-12 md:py-16 mt-16">
                <nav className="py-4 mb-6 border-b border-gray-100 text-sm font-medium flex items-center text-[#1e3a8a]">
                    <Link href="/" className="hover:opacity-80 transition-opacity">Ana Sayfa</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <Link href="/blog" className="hover:opacity-80 transition-opacity">Blog</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <span className="truncate">Yazi Detay</span>
                </nav>

                <section className="max-w-4xl mx-auto mt-8 mb-12 px-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                        {categories.map((category) => (
                            <Badge
                                key={category.id}
                                className="rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 border-0 font-semibold px-3 py-1"
                            >
                                {category.name}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e3a8a] leading-tight mb-6">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-3 text-gray-500 text-sm sm:text-base">
                        <div className="inline-flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{post.author_first_name} {post.author_last_name}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="inline-flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(post.created_at)}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="inline-flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{post.view_count}</span>
                        </div>
                    </div>

                    <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg mt-8 bg-slate-100">
                        <Image
                            src={getImageUrl(post.image_url)}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 896px"
                            priority
                        />
                    </div>
                </section>

                <section className="max-w-3xl mx-auto py-12 px-4">
                    <article className="prose prose-blue prose-lg max-w-none text-slate-700 leading-[1.8]">
                        <div
                            className="[&_table]:w-full [&_table]:border [&_table]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-700 [&_td]:border-t [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-2 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:rounded-xl [&_img]:shadow-sm"
                            dangerouslySetInnerHTML={{ __html: post.content || "" }}
                        />
                    </article>
                </section>

                {tags.length > 0 && (
                    <section className="max-w-3xl mx-auto mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-2 px-4">
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tagName, index) => (
                                <Badge
                                    key={`${tagName}-${index}`}
                                    variant="secondary"
                                    className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
                                >
                                    #{tagName}
                                </Badge>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
