"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { GoogleReview } from "@/lib/features/reviews/reviewsApi";

interface ReviewCardProps {
    review: GoogleReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isLongReview = review.review_text.length > 140;

    const getAvatarUrl = (url: string) => {
        return url.startsWith('//') ? `https:${url}` : url;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-[#FFB800] mt-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-3 h-3 ${i < rating ? "fill-current" : "fill-[#e2e8f0]"}`}
                    />
                ))}
            </div>
        );
    };

    const AvatarProfile = ({ className }: { className?: string }) => {
        if (review.author_avatar_url) {
            return (
                <img
                    src={getAvatarUrl(review.author_avatar_url)}
                    alt={review.author_name}
                    referrerPolicy="no-referrer"
                    className={`rounded-full object-cover ${className || 'w-12 h-12'}`}
                />
            );
        }
        return (
            <div className={`bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full ${className || 'w-12 h-12 text-lg'}`}>
                {review.author_name.charAt(0)}
            </div>
        );
    };

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow h-full bg-white rounded-2xl flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <AvatarProfile />
                    <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{review.author_name}</h4>
                        {renderStars(review.rating)}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        "{review.review_text}"
                    </p>

                    {/* Dialog Trigger aligned at the bottom */}
                    <div className="mt-auto pt-2">
                        {isLongReview && (
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <button className="text-primary text-sm font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer text-left">
                                        Devamını Oku
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md backdrop-blur-sm shadow-xl border-slate-200">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="sr-only">Öğrenci Yorumu</DialogTitle>
                                        <div className="flex items-center gap-4">
                                            <AvatarProfile className="w-14 h-14 text-xl" />
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{review.author_name}</h4>
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                    </DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">
                                            "{review.review_text}"
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
