"use client";

import React, { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGetCourseListQuery } from "@/lib/features/course/courseApi";
import { useGetStudentReviewsQuery } from "@/lib/features/users/userApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseFeaturesSlider } from "@/components/course/CourseFeaturesSlider";
import { Loader2, Phone } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";

// Mapping dictionary for slug -> Level
const SLUG_TO_LEVEL: Record<string, string> = {
    "a1-almanca-kursu": "A1",
    "a2-almanca-kursu": "A2",
    "b1-almanca-kursu": "B1",
    "b2-almanca-kursu": "B2",
    "c1-almanca-kursu": "C1",
    "c2-almanca-kursu": "C2",
    "ozel-ders": "Özel Ders"
};

export default function LevelCoursePage({ params }: { params: Promise<{ "level-slug": string }> }) {
    // Unpack params and map the level string from the matched slug.
    const resolvedParams = use(params);
    const slug = resolvedParams["level-slug"];
    const activeLevel = SLUG_TO_LEVEL[slug] || "A1";
    const dispatch = useAppDispatch();
    const [addedItemKey, setAddedItemKey] = useState<string | null>(null);

    const { data: coursesData, isLoading, error } = useGetCourseListQuery({ level: activeLevel });
    const courseListByLevel = coursesData?.results || [];
    const { data: studentReviewsData } = useGetStudentReviewsQuery({});
    const allStudentReviews = studentReviewsData?.results || [];
    const lessonReviews = allStudentReviews.filter((review) => review.type === "lesson");
    const thinkReviews = allStudentReviews.filter((review) => review.type === "think");

    const getVideoId = (videoId?: string, youtubeUrl?: string) => {
        if (videoId?.trim()) return videoId.trim();
        if (!youtubeUrl) return "";

        try {
            const parsedUrl = new URL(youtubeUrl);
            if (parsedUrl.hostname.includes("youtu.be")) {
                return parsedUrl.pathname.replace("/", "");
            }

            if (parsedUrl.searchParams.get("v")) {
                return parsedUrl.searchParams.get("v") || "";
            }

            if (parsedUrl.pathname.includes("/shorts/")) {
                return parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || "";
            }
        } catch {
            return "";
        }

        return "";
    };

    const handleQuickAdd = (courseItem: (typeof courseListByLevel)[number]) => {
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

        const key = `course-${courseItem.id}`;
        setAddedItemKey(key);
        setTimeout(() => {
            setAddedItemKey((prev) => (prev === key ? null : prev));
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

            {/* Course Grid Layout */}
            <main className="grow max-w-7xl mx-auto w-full px-4 py-12 md:py-20 mt-16">

                <div className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#1a365d] mb-4">
                        {activeLevel} Almanca Eğitimi
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Size en uygun {activeLevel} seviye grubunu seçerek Almanca öğrenmeye hemen başlayın. Canlı derslerimiz alanında uzman eğitmenlerce verilmektedir.
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
                ) : courseListByLevel.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xl text-slate-500 font-medium">Bu seviye için şu an aktif bir kurs bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full pt-6 pb-12">
                        {courseListByLevel.map((courseItem) => {
                            const isDiscountActive = courseItem.discounted_price && Number(courseItem.discounted_price) > 0;
                            const courseTypeBadge = courseItem.type === "online" ? "Online" : "Offline";
                            const stockLimit = Math.max(0, Number(courseItem.quota ?? 0));
                            const isOutOfStock = stockLimit <= 0;
                            const itemKey = `course-${courseItem.id}`;
                            const isAddedFeedback = addedItemKey === itemKey;

                            return (
                                <Card key={courseItem.id} className="h-full flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
                                    {/* Görsel Alanı - 16:10 Oranı ile daha geniş duruş */}
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
                                                {courseTypeBadge}
                                            </Badge>
                                            <Badge className="bg-[#1a365d] text-white hover:bg-[#1a365d] font-bold px-3 py-1 text-xs border-0 shadow-sm">
                                                {courseItem.level}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* İçerik Alanı - Daha kompakt p-6 */}
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

                                            {courseItem.start_date && (
                                                <p className="text-xs text-slate-400 font-medium flex items-center mb-4">
                                                    Başlangıç: {new Date(courseItem.start_date).toLocaleDateString('tr-TR')}
                                                </p>
                                            )}
                                        </div>

                                        {/* Alt Kısım - Fiyat ve Butonlar */}
                                        <div className="mt-auto pt-5 border-t border-slate-50">
                                            <div className="mb-4">
                                                {isDiscountActive ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-slate-400 line-through font-medium mb-0.5">
                                                            {courseItem.price} ₺
                                                        </span>
                                                        <span className="text-2xl font-bold text-[#1a365d]">
                                                            {courseItem.discounted_price} ₺
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-2xl font-bold text-[#1a365d]">
                                                        {courseItem.price} ₺
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2.5">
                                                <Link href={`/kurslar/${slug}/${courseItem.id}`} className="w-full relative z-10">
                                                    <Button variant="outline" className="cursor-pointer w-full py-2.5 h-11 rounded-xl border-2 border-[#1a365d] text-[#1a365d] font-bold text-sm hover:bg-slate-50 transition-all">
                                                        Detaylı İncele
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={() => handleQuickAdd(courseItem)}
                                                    disabled={isOutOfStock || isAddedFeedback}
                                                    className="cursor-pointer w-full py-2.5 h-11 rounded-xl bg-[#1a365d] text-white font-bold text-sm hover:bg-[#142a4a] transition-all relative z-10 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {isOutOfStock ? "Stokta Yok" : isAddedFeedback ? "Eklendi!" : "Sepete Ekle"}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Features Section - Neden Alman Akademisi? */}
                <section className="mt-24 pt-20 border-t border-slate-200">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Neden Alman Akademisi?</h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">Size en iyi öğrenme deneyimini sunmak için sürekli gelişen eğitim modelimizle yanınızdayız.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Ders Kaçırma Derdi Yok", desc: "Tüm canlı dersler kaydedilir ve panonuzdan tekrar izleyebilirsiniz.", icon: "🎥" },
                            { title: "Yabancı Dil Hafıza Teknikleri", desc: "Görsel hafıza teknikleri ile kelime ezberleme sorunu tarihe karışır.", icon: "🧠" },
                            { title: "Öğrenci Odaklı Canlı Dersler", desc: "Bol pratikli interaktif sınıf ortamıyla Almancaya maruz kalın.", icon: "👨‍🏫" },
                            { title: "Gelişmiş Kanal Sistemi", desc: "Öğretmenler ile dilediğiniz an iletişimde kalarak takıldığınız yerleri sorun.", icon: "💬" }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                                <div className="text-5xl mb-6 bg-slate-50 w-20 h-20 flex items-center justify-center rounded-2xl">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <CourseFeaturesSlider />

                <section className="mt-24 w-full space-y-16">
                    <div>
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Derslerimizden <span className="text-[#1a365d]">Kesitler</span>
                            </h2>
                        </div>

                        {lessonReviews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lessonReviews.map((review) => {
                                    const videoId = getVideoId(review.video_id, review.youtube_url);
                                    if (!videoId) return null;

                                    return (
                                        <div
                                            key={review.id}
                                            className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                        >
                                            <div className="relative aspect-video w-full">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                                    title={review.name || "Ders videosu"}
                                                    className="h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                                Derslerimizden kesit videosu bulunamadı.
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                                Öğrencilerimizin <span className="text-[#1a365d]">Düşünceleri</span>
                            </h2>
                        </div>

                        {thinkReviews.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {thinkReviews.map((review) => {
                                    const videoId = getVideoId(review.video_id, review.youtube_url);
                                    if (!videoId) return null;

                                    return (
                                        <div
                                            key={review.id}
                                            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <div className="relative aspect-9/16 w-full">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                                    title={review.name || "Öğrenci yorumu videosu"}
                                                    className="h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                                Öğrenci yorumu videosu bulunamadı.
                            </div>
                        )}
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="mt-20 flex flex-col items-center justify-center bg-linear-to-br from-[#1a365d] to-[#1e40af] rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-xl">
                    <div className="absolute opacity-10 blur-3xl rounded-full bg-white w-96 h-96 -top-20 -right-20 pointer-events-none"></div>
                    <div className="z-10 w-full max-w-4xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Aklınıza takılan bir sorun mu var?</h2>
                        <p className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto">Eğitim danışmanlarımızla iletişime geçin, size en uygun öğrenme planını birlikte hazırlayalım.</p>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                            <Button className="cursor-pointer h-16 px-8 rounded-2xl bg-white text-[#1a365d] hover:bg-slate-50 font-bold text-lg shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex items-center justify-center group">
                                <Phone className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                                Hemen Arayın
                            </Button>
                            <Button className="cursor-pointer h-16 px-8 rounded-2xl bg-[#25D366] hover:bg-[#1fae54] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all border-0 w-full sm:w-auto flex items-center justify-center group">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-7 h-7 mr-3 text-white group-hover:scale-110 transition-transform duration-300"
                                    fill="currentColor"
                                    aria-label="WhatsApp"
                                    role="img"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                </svg>
                                Whatsapp'tan Yazın
                            </Button>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
