"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetGoogleReviewsQuery } from "@/lib/features/reviews/reviewsApi";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./ReviewCard";

export function ReviewsSection() {
    const { data: reviewsData, isLoading, isError } = useGetGoogleReviewsQuery();
    const [currentIndex, setCurrentIndex] = useState(0);

    const reviews = reviewsData?.results || [];
    const averageRating = reviewsData?.average_rating || 5.0;
    const reviewCount = reviewsData?.count || 0;

    const handleNext = () => {
        if (currentIndex < reviews.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    return (
        <section className="py-24 bg-slate-50 overflow-hidden relative">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                            Öğrenci Yorumları
                        </h2>
                        <p className="text-muted-foreground">
                            Yüzlerce mezunumuzun Türkiye'nin en sevilen Almanca akademisiyle ilgili deneyimlerini kendi ağızlarından dinleyin.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 flex-shrink-0 w-full md:w-auto">
                        <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-2xl shadow-sm border w-full">
                            <div className="text-4xl font-black text-primary">{averageRating.toFixed(1)}</div>
                            <div>
                                <div className="flex text-[#FFB800] mb-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-current" : "fill-transparent"}`} />
                                    ))}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">Google Yorumları ({reviewCount})</p>
                            </div>
                        </div>

                        <div className="flex flex-col w-full text-center md:text-left">
                            <span className="text-lg font-semibold text-slate-500 mb-1 ml-1">
                                Alman Akademisi
                            </span>
                            <a
                                href="https://www.google.com/maps/place/Alman+Akademisi/@41.3370324,36.2526004,17z/data=!3m1!4b1!4m6!3m5!1s0x408879e9cb36f01b:0xe8c158401c217717!8m2!3d41.3370284!4d36.2551753!16s%2Fg%2F11ygpfdldv?entry=ttu&g_ep=EgoyMDI2MDIyNS4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="flex justify-center items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all font-medium text-gray-700 w-full"
                            >
                                <Image src="/google1.png" alt="Google" width={20} height={20} className="w-5 h-5 object-contain" />
                                Bizi Değerlendir
                            </a>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {/* Left Control Desktop */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        disabled={currentIndex === 0 || isLoading}
                        className="hidden lg:flex absolute left-[-20px] xl:left-[-24px] top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-white border-slate-200"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </Button>

                    {/* Right Control Desktop */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        disabled={currentIndex >= reviews.length - 1 || isLoading}
                        className="hidden lg:flex absolute right-[-20px] xl:right-[-24px] top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md bg-white border-slate-200"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                    </Button>

                    {isLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="border-none shadow-md bg-white rounded-2xl h-48 animate-pulse">
                                    <CardContent className="p-6 h-full bg-slate-100 rounded-2xl" />
                                </Card>
                            ))}
                        </div>
                    ) : isError || reviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Şu an için yorum bulunmuyor.
                        </div>
                    ) : (
                        <div className="overflow-hidden w-full relative -mx-4 px-4 sm:mx-0 sm:px-0">
                            <div
                                className="flex transition-transform duration-500 ease-out [--slide-width:100%] md:[--slide-width:50%] lg:[--slide-width:33.333333%]"
                                style={{ transform: `translateX(calc(-${currentIndex} * var(--slide-width)))` } as React.CSSProperties}
                            >
                                {reviews.map(review => (
                                    <div key={review.id} className="w-[var(--slide-width)] shrink-0 px-3 pb-8">
                                        <ReviewCard review={review} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mobile Controls */}
                    <div className="mt-2 flex justify-center gap-4 lg:hidden">
                        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0 || isLoading} className="rounded-full shadow-sm bg-white">
                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex >= reviews.length - 1 || isLoading} className="rounded-full shadow-sm bg-white">
                            <ChevronRight className="w-5 h-5 text-slate-700" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
