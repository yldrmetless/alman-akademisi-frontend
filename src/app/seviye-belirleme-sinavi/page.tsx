"use client";

import React, { useState } from "react";
import { useGetExamsQuery, Exam } from "@/lib/features/course/courseApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Clock, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

const LEVEL_OPTIONS = ["Tümü", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function LevelExamListPage() {
    const [examFilterState, setExamFilterState] = useState("Tümü");

    // Fetch exams, passing the selected level if it is not 'Tümü'
    const { data: fetchExamsByLevel, isLoading: isFetchingExams } = useGetExamsQuery({
        level: examFilterState !== "Tümü" ? examFilterState : undefined,
    });

    const exams = fetchExamsByLevel?.results || [];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">

            <main className="flex-grow">
                {/* Sticky Header Section */}
                <section className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                    <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] tracking-tight mb-2">
                            Almanca Seviye Belirleme Sınavı
                        </h1>
                        <Breadcrumb items={[
                            { label: "Ana Sayfa", href: "/" },
                            { label: "Seviye Belirleme Sınavı" }
                        ]} />
                    </div>
                </section>

                <div className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {LEVEL_OPTIONS.map((level) => (
                            <button
                                key={level}
                                onClick={() => setExamFilterState(level)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${examFilterState === level
                                    ? "bg-[#1a365d] text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-[#1a365d] hover:text-[#1a365d]"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Results Area */}
                    {isFetchingExams ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 text-[#1a365d] animate-spin mb-4" />
                            <p className="text-slate-500">Sınavlar yükleniyor...</p>
                        </div>
                    ) : exams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map((exam: Exam) => (
                                <Card key={exam.id} className="overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:border-[#1a365d]/20 bg-white">
                                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-[#1a365d] line-clamp-2">
                                                {exam.name}
                                            </h3>
                                        </div>

                                        {/* Status / Level Badge */}
                                        <div className="mb-6">
                                            <Badge className="bg-[#1a365d]/10 text-[#1a365d] hover:bg-[#1a365d]/20 border-0 rounded-full font-semibold px-3 py-1">
                                                {exam.level || "Genel"} Seviye
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 mb-8 flex-grow">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <HelpCircle className="w-4 h-4 mr-2 text-slate-400" />
                                                <span className="font-medium">{exam.question_count} Soru</span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                                <span className="font-medium">{exam.time_limit} Dakika</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <Link href={`/seviye-belirleme-sinavi/${exam.id}`} className="w-full cursor-pointer">
                                                <Button className="cursor-pointer w-full bg-[#1a365d] hover:bg-[#112d52] text-white">
                                                    Sınava Başla
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="h-16 w-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
                                <Info className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Sınav Bulunamadı</h3>
                            <p className="text-slate-500 max-w-md">
                                Henüz bu seviyede bir sınav bulunmamaktadır. Lütfen başka bir seviye seçin veya daha sonra tekrar kontrol edin.
                            </p>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}
