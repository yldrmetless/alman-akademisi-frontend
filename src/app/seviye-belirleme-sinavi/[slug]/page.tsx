"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import {
    startExam,
    answerQuestion,
    nextQuestion,
    finishExam,
    tickTimer,
    resetExam
} from "@/lib/features/course/examSlice";
import { useGetExamQuestionsQuery } from "@/lib/features/course/courseApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { HelpCircle, Clock, Loader2, CheckCircle2, XCircle, ArrowRight, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { z } from "zod";

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const [isMounted, setIsMounted] = useState(false);

    const dispatch = useDispatch();
    const {
        phase,
        currentQuestionIndex,
        userAnswers,
        remainingTime,
        timerActive
    } = useSelector((state: RootState) => state.examEngine);

    const { data: examData, isLoading } = useGetExamQuestionsQuery(slug!, { skip: !slug });
    const examDataLoading = isLoading || !slug;
    const safeWindowAccess = typeof window !== "undefined";

    const [contactForm, setContactForm] = useState({
        full_name: "",
        phone: "",
        message: "",
        call_permission: "Evet (genellikle daha hızlı)"
    });
    const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
    const [isContactSubmitting, setIsContactSubmitting] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const schema = z.object({
                full_name: z.string().min(2, "İsim alanı zorunludur."),
                phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
                message: z.string().optional(),
                call_permission: z.string()
            });
            schema.parse(contactForm);
            setContactErrors({});
            setIsContactSubmitting(true);
            await new Promise(resolve => setTimeout(resolve, 800)); // fake backend delay
            setIsContactSubmitting(false);
            setContactForm({ full_name: "", phone: "", message: "", call_permission: "Evet (genellikle daha hızlı)" });
            alert("Talebiniz alınmıştır. Teşekkür ederiz.");
        } catch (error: any) {
            if (error?.errors) {
                const errors: Record<string, string> = {};
                error.errors.forEach((err: any) => {
                    if (err.path[0]) errors[err.path[0].toString()] = err.message;
                });
                setContactErrors(errors);
            }
        }
    };

    // Ensure we start fresh when mounting a new exam page
    useEffect(() => {
        setIsMounted(true);
        dispatch(resetExam());
        return () => { dispatch(resetExam()); };
    }, [dispatch, slug]);

    useEffect(() => {
        if (!isMounted) return;
        console.log("[ExamPage] mounted", { slug, safeWindowAccess, phase, examDataLoading });
    }, [isMounted, slug, safeWindowAccess, phase, examDataLoading]);

    // Timer logic binding native React Effect hooks to the Redux tick
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timerActive) {
            timer = setInterval(() => {
                dispatch(tickTimer());
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timerActive, dispatch]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const renderStickyHeader = (examName?: string) => (
        <section className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] tracking-tight mb-2">
                    Almanca Seviye Belirleme Sınavı
                </h1>
                <Breadcrumb items={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Seviye Belirleme Sınavı", href: "/seviye-belirleme-sinavi" },
                    ...(examName ? [{ label: examName }] : [])
                ]} />
            </div>
        </section>
    );

    if (!isMounted || examDataLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                {renderStickyHeader()}
                <main className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-[#1a365d] animate-spin" />
                </main>
            </div>
        );
    }

    if (!slug) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                {renderStickyHeader()}
                <main className="flex-grow flex items-center justify-center">
                    <p className="text-xl text-slate-600">Geçersiz sınav bağlantısı.</p>
                </main>
            </div>
        );
    }

    if (!examData || !examData.questions || examData.questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                {renderStickyHeader()}
                <main className="flex-grow flex items-center justify-center">
                    <p className="text-xl text-slate-600">Sınav bulunamadı.</p>
                </main>
            </div>
        );
    }

    const questions = examData?.questions ?? [];
    const currentQuestion = questions[currentQuestionIndex];
    const hasNextQuestion = currentQuestionIndex < questions.length - 1;
    const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion?.id);

    useEffect(() => {
        setSelectedOptionId(currentAnswer?.optionId ?? null);
    }, [currentQuestion?.id, currentAnswer?.optionId]);

    // --- Action Handlers ---
    const handleStart = () => {
        dispatch(startExam(examData.time_limit));
    };

    const handleOptionSelect = (optionId: number, isCorrect: boolean) => {
        if (!currentQuestion?.id) return;
        setSelectedOptionId(optionId);
        dispatch(answerQuestion({
            questionId: currentQuestion.id,
            optionId,
            isCorrect
        }));
    };

    const handleNext = () => {
        if (!currentAnswer) return; // Prevent skipping without answer
        if (hasNextQuestion) {
            dispatch(nextQuestion());
        } else {
            dispatch(finishExam());
        }
    };

    // --- Rendering Functions ---
    const renderActive = () => {
        if (!currentQuestion) return null;

        return (
            <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full flex-grow flex flex-col justify-start"
            >
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a365d]/10 text-[#1a365d] font-bold text-sm">
                            {currentQuestionIndex + 1}
                        </span>
                        <span className="text-slate-500 font-medium">/ {questions.length}</span>
                    </div>
                    <div className={`flex items-center space-x-2 font-bold px-4 py-2 rounded-lg ${remainingTime < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-700'}`}>
                        <Clock className="w-5 h-5" />
                        <span>{formatTime(remainingTime)}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-[#1a365d] transition-all duration-300 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>

                {/* Question */}
                <div className="mb-8">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                        {currentQuestion.text}
                    </h3>
                </div>

                {/* Audio Player if present */}
                {currentQuestion.audio_url && (
                    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center shadow-sm">
                        <audio controls controlsList="nodownload" className="w-full h-10 outline-none">
                            <source src={currentQuestion.audio_url} type="audio/mpeg" />
                            Tarayıcınız ses formatını desteklemiyor.
                        </audio>
                    </div>
                )}

                {/* Options Grid */}
                <div className="space-y-4 mb-10">
                    {currentQuestion?.options?.map((option, optionIndex) => {
                        const isOptionSelected = option.id === selectedOptionId;
                        return (
                        <button
                            key={`${currentQuestion.id}-${option.id}-${optionIndex}`}
                            onClick={() => handleOptionSelect(option.id, option.is_correct)}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${isOptionSelected
                                ? 'border-[#1a365d] bg-[#1a365d]/5 shadow-md flex items-center justify-between'
                                : 'border-slate-200 hover:border-[#1a365d]/50 hover:bg-slate-50'
                                }`}
                        >
                            <span className="text-base md:text-lg text-slate-700 font-medium">
                                {option.text}
                            </span>
                            {isOptionSelected && (
                                <div className="h-6 w-6 rounded-full bg-[#1a365d] text-white flex items-center justify-center shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    )}) || null}
                </div>

                <div className="mt-auto pt-6 flex justify-end">
                    <Button
                        onClick={handleNext}
                        disabled={!currentAnswer}
                        className="h-14 px-8 text-lg font-bold bg-[#1a365d] hover:bg-[#112d52] text-white rounded-xl shadow-lg transition-all"
                    >
                        {hasNextQuestion ? (
                            <>Sıradaki Soru <ArrowRight className="w-5 h-5 ml-2" /></>
                        ) : (
                            <>Sınavı Bitir <CheckCircle2 className="w-5 h-5 ml-2" /></>
                        )}
                    </Button>
                </div>
            </motion.div>
        );
    };

    const renderIntroOrQuiz = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-grow w-full max-w-7xl mx-auto p-4 pt-8 md:pt-12"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 flex flex-col">
                    <Card className="border-slate-200 overflow-hidden shadow-sm">
                        <CardContent className="p-8 md:p-10">
                            {phase === 'intro' && (
                                <h2 className="text-2xl md:text-3xl font-bold text-[#1a365d] mb-6 text-center border-b border-slate-100 pb-6">
                                    {examData.exam_name}
                                </h2>
                            )}
                            
                            {/* INTRO METRICS */}
                            {phase === 'intro' && (
                                <AnimatePresence>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <HelpCircle className="w-10 h-10 text-[#1a365d] mb-4" />
                                                <span className="text-3xl md:text-4xl font-bold text-slate-900">{examData.question_count}</span>
                                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-2">Soru Sayısı</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <Clock className="w-10 h-10 text-[#1a365d] mb-4" />
                                                <span className="text-3xl md:text-4xl font-bold text-slate-900">{examData.time_limit}</span>
                                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-2">Dakika</span>
                                            </div>
                                        </div>
                                        <Button onClick={handleStart} className="w-full h-16 text-xl font-bold bg-[#1a365d] hover:bg-[#112d52] text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                                            Sınava Başla
                                        </Button>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                            
                            {/* ACTIVE QUIZ ENGINE */}
                            {phase === 'active' && renderActive()}

                        </CardContent>
                    </Card>

                    {examData?.description && (
                        <div
                            className="mt-8 bg-transparent prose prose-slate max-w-none break-words text-slate-700 leading-relaxed mx-auto w-full"
                            dangerouslySetInnerHTML={{ __html: examData?.description || "" }}
                        />
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-28 bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
                        <h3 className="text-2xl font-bold text-[#1a365d] mb-6">İletişime Geç</h3>
                        <form onSubmit={handleContactSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mesajınız</label>
                                <textarea 
                                    className="w-full min-h-[120px] p-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1a365d] outline-none transition-all resize-y" 
                                    placeholder="Mesajınız"
                                    value={contactForm.message}
                                    onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">İsim <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 text-sm rounded-lg border ${contactErrors.full_name ? 'border-red-500' : 'border-slate-300'} focus:ring-2 focus:ring-[#1a365d] outline-none transition-all`}
                                    placeholder="İsim *"
                                    value={contactForm.full_name}
                                    onChange={e => setContactForm(prev => ({ ...prev, full_name: e.target.value }))}
                                />
                                {contactErrors.full_name && <p className="text-red-500 text-xs mt-1">{contactErrors.full_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefon Numaranız <span className="text-red-500">*</span></label>
                                <input 
                                    type="tel" 
                                    className={`w-full p-3 text-sm rounded-lg border ${contactErrors.phone ? 'border-red-500' : 'border-slate-300'} focus:ring-2 focus:ring-[#1a365d] outline-none transition-all`}
                                    placeholder="Telefon Numaranız *"
                                    value={contactForm.phone}
                                    onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                                />
                                {contactErrors.phone && <p className="text-red-500 text-xs mt-1">{contactErrors.phone}</p>}
                            </div>
                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-800 mb-3 leading-tight">İzninizi istiyoruz. Sizi arayabilir miyiz?</label>
                                <div className="space-y-3">
                                    <label className="flex items-start space-x-3 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="call_permission" 
                                            value="Evet (genellikle daha hızlı)"
                                            checked={contactForm.call_permission === "Evet (genellikle daha hızlı)"}
                                            onChange={e => setContactForm(prev => ({ ...prev, call_permission: e.target.value }))}
                                            className="mt-0.5 h-4 w-4 text-[#1a365d] border-slate-300 focus:ring-[#1a365d]"
                                        />
                                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Evet (genellikle daha hızlı)</span>
                                    </label>
                                    <label className="flex items-start space-x-3 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="call_permission" 
                                            value="Hayır (whatsapptan iletişime geçilir)"
                                            checked={contactForm.call_permission === "Hayır (whatsapptan iletişime geçilir)"}
                                            onChange={e => setContactForm(prev => ({ ...prev, call_permission: e.target.value }))}
                                            className="mt-0.5 h-4 w-4 text-[#1a365d] border-slate-300 focus:ring-[#1a365d]"
                                        />
                                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Hayır (whatsapptan iletişime geçilir)</span>
                                    </label>
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isContactSubmitting}
                                className="w-full h-12 mt-6 text-base font-bold bg-[#1a365d] hover:bg-[#112d52] text-white rounded-lg shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isContactSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Gönder"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderResult = () => {
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const totalQuestions = questions.length;
        const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

        let feedbackMessage = "";
        if (scorePercentage >= 90) feedbackMessage = "Harika! Seviyenizi mükemmel bir şekilde kanıtladınız.";
        else if (scorePercentage >= 70) feedbackMessage = "Tebrikler, oldukça başarılısınız.";
        else if (scorePercentage >= 40) feedbackMessage = "İyi bir temeliniz var ancak daha fazla pratiğe ihtiyacınız var.";
        else feedbackMessage = "Bu seviye sizin için zorlayıcı olabilir. Bir alt seviyeden başlamanızı öneririz.";

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex-grow flex flex-col justify-center max-w-2xl mx-auto w-full p-4"
            >
                <Card className="border-slate-200 shadow-xl overflow-hidden rounded-2xl">
                    <div className="bg-[#1a365d] p-10 text-center text-white relative h-48 flex flex-col justify-end">
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                            {/* Decorative background shape */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white blur-3xl" />
                        </div>
                        <h2 className="text-3xl font-bold z-10 relative">Sınav Sonucu</h2>
                    </div>

                    <CardContent className="p-8 -mt-12 relative z-20">
                        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center mx-auto w-[160px] h-[160px] border-4 border-slate-50 mb-8">
                            <span className="text-5xl font-extrabold text-[#1a365d]">{scorePercentage}%</span>
                            <span className="text-sm font-semibold text-slate-500 uppercase mt-1">Başarı</span>
                        </div>

                        <p className="text-center text-lg text-slate-700 font-medium mb-8 px-4">
                            {feedbackMessage}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-emerald-50 rounded-xl p-4 flex items-center border border-emerald-100">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-emerald-700">{correctAnswers}</p>
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Doğru</p>
                                </div>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-4 flex items-center border border-rose-100">
                                <XCircle className="w-8 h-8 text-rose-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-rose-700">{totalQuestions - correctAnswers}</p>
                                    <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest">Yanlış / Boş</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push("/seviye-belirleme-sinavi")}
                            className="w-full h-14 text-lg font-bold bg-[#1a365d] hover:bg-[#112d52] text-white rounded-xl shadow transition-all"
                        >
                            Tüm Sınavlara Dön
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            {renderStickyHeader(phase === 'active' ? `${examData?.exam_name} - Devam Ediyor` : examData?.exam_name)}
            <AnimatePresence mode="wait">
                {(phase === 'intro' || phase === 'active') && renderIntroOrQuiz()}
                {phase === 'result' && renderResult()}
            </AnimatePresence>
        </div>
    );
}
