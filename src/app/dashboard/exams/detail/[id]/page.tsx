"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
    Loader2,
    ChevronLeft,
    Pencil,
    Trash2,
    Clock,
    ClipboardList,
    Play,
    Pause,
    Plus,
    CheckCircle2
} from "lucide-react";

import { useGetExamQuestionsQuery, useEditExamMutation } from "@/lib/features/course/courseApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { ExamEditor } from "@/components/dashboard/exams/ExamEditor";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const examFormSchema = z.object({
    exam_name: z.string().min(1, "Sınav adı zorunludur."),
    time_limit: z.number().min(1, "Süre zorunludur."),
    is_uploading_audio: z.boolean().optional(),
    questions: z.array(z.object({
        id: z.number().optional(),
        question_text: z.string().optional(),
        question_type: z.string(),
        order: z.number().optional(),
        audio_url: z.string().nullable().optional(),
        audio_public_id: z.string().nullable().optional(),
        audio_file: z.any().optional(),
        options: z.array(z.object({
            id: z.number().optional(),
            text: z.string().optional(),
            is_correct: z.boolean()
        })).min(2, "En az 2 seçenek eklemelisiniz.")
    })).min(1, "En az 1 soru eklemelisiniz.")
}).superRefine((data, ctx) => {
    data.questions.forEach((q, i) => {
        const hasCorrectOption = q.options.some(opt => opt.is_correct);
        if (!hasCorrectOption) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "En az bir doğru cevap işaretlemelisiniz.",
                path: ["questions", i, "options"]
            });
        }
    });
});

type ExamFormValues = z.infer<typeof examFormSchema>;

const extractLevel = (name: string): string | null => {
    const match = name.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    return match ? match[0].toUpperCase() : null;
};

// --- Custom Audio Player Component ---
function CustomAudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("00:00");
    const [durationText, setDurationText] = useState("00:00");

    const formatTime = (timeInSeconds: number) => {
        if (!timeInSeconds || isNaN(timeInSeconds)) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        setCurrentTime(formatTime(current));
        if (duration) {
            setProgress((current / duration) * 100);
            setDurationText(formatTime(duration));
        }
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDurationText(formatTime(audioRef.current.duration));
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percentage = offsetX / rect.width;

        audioRef.current.currentTime = percentage * (audioRef.current.duration || 0);
        setProgress(percentage * 100);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleEnded = () => setIsPlaying(false);
            audio.addEventListener("ended", handleEnded);
            return () => audio.removeEventListener("ended", handleEnded);
        }
    }, []);

    return (
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3 max-w-xl mb-4">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />
            <Button
                variant="default"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-[#1A3EB1] hover:bg-[#15308A]"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
            </Button>

            <div className="flex-1 flex flex-col gap-1.5">
                <div
                    className="relative w-full h-2 bg-slate-200 rounded-full cursor-pointer group"
                    onClick={handleSeek}
                >
                    <div
                        className="absolute left-0 top-0 h-full bg-[#1A3EB1] rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className="absolute h-3 w-3 bg-[#1A3EB1] rounded-full top-1/2 -translate-y-1/2 -mt-[0px] shadow-sm transform scale-0 group-hover:scale-100 transition-transform"
                        style={{ left: `calc(${progress}% - 6px)` }}
                    />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>{currentTime}</span>
                    <span>{durationText}</span>
                </div>
            </div>

        </div>
    );
}

export default function ExamDetailManagementPage(props: { params: Promise<{ id: string }> }) {
    const { id } = React.use(props.params);
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const { data: initialExamData, isLoading: isExamLoading, isError, refetch } = useGetExamQuestionsQuery(id, {
        skip: !id
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editExam, { isLoading: isUpdating }] = useEditExamMutation();

    const confirmSoftDelete = async () => {
        try {
            await editExam({ id, body: { is_deleted: true } }).unwrap();
            toast.success("Sınav başarıyla silindi");
            router.push("/dashboard/exams");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.data?.message || "Bir hata oluştu.");
        }
    };

    const methods = useForm<ExamFormValues>({
        resolver: zodResolver(examFormSchema),
        defaultValues: {
            exam_name: "",
            time_limit: 0,
            is_uploading_audio: false,
            questions: []
        }
    });

    useEffect(() => {
        if (initialExamData) {
            methods.reset({
                exam_name: initialExamData.exam_name || "",
                time_limit: initialExamData.time_limit || 0,
                is_uploading_audio: false,
                questions: initialExamData.questions?.map((q: any) => ({
                    ...q,
                    question_text: q.question_text || q.text || "",
                    options: q.options || []
                })) || []
            });
        }
    }, [initialExamData, methods]);

    const submitExamUpdate = async (values: ExamFormValues) => {
        try {
            let currentMaxOrder = Math.max(...values.questions.filter(q => q.id).map(q => q.order || 0), 0);

            const cleanQuestions = values.questions.map(q => {
                let finalOrder = q.order;
                if (!q.id) {
                    currentMaxOrder += 1;
                    finalOrder = currentMaxOrder;
                }

                return {
                    ...(q.id ? { id: q.id } : {}),
                    question_text: q.question_text || "",
                    question_type: "single_choice",
                    order: finalOrder,
                    ...(q.audio_url ? { audio_url: q.audio_url } : {}),
                    ...(q.audio_public_id ? { audio_public_id: q.audio_public_id } : {}),
                    options: q.options.map(o => ({
                        ...(o.id ? { id: o.id } : {}),
                        text: o.text || "",
                        is_correct: o.is_correct || false
                    }))
                };
            });

            const bulkUpdatePayload = {
                name: values.exam_name,
                time_limit: values.time_limit,
                questions: cleanQuestions
            };

            await editExam({ id, body: bulkUpdatePayload }).unwrap();

            toast.success("Sınav başarıyla güncellendi");
            setIsEditMode(false);
            refetch();
            router.push(`/dashboard/exams/detail/${id}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.data?.message || "Bir hata oluştu.");
        }
    };

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined") || isExamLoading || !id) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-8">
                <div className="h-40 bg-slate-200 animate-pulse rounded-xl w-full" />
                <div className="h-64 bg-slate-200 animate-pulse rounded-xl w-full" />
            </div>
        );
    }

    if (isError || !initialExamData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800">Sınav bulunamadı veya bir hata oluştu.</h2>
                    <Button variant="link" onClick={() => router.push("/dashboard/exams")}>
                        Sınav listesine dön
                    </Button>
                </div>
            </div>
        );
    }

    const { exam_name, time_limit, question_count, questions } = initialExamData;
    const level = extractLevel(exam_name);
    const isUploadingAudio = methods.watch("is_uploading_audio");

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                <div className="p-4 sm:p-8 max-w-[1000px] mx-auto space-y-6">

                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 text-slate-600 border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm"
                                onClick={() => router.push("/dashboard/exams")}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    Sınav Detayı & Soru Yönetimi
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Sınav içeriğini ve sorularını buradan yönetebilirsiniz.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isEditMode ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                        onClick={() => setIsEditMode(false)}
                                        disabled={isUpdating}
                                    >
                                        İptal
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                        onClick={() => setShowDeleteModal(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Sil
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Düzenle
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {isEditMode ? (
                        <FormProvider {...methods}>
                            <form id="exam-editor-form" className="space-y-6">
                                {/* Top Exam Header Card - Form View */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-6 shadow-sm relative">
                                    <div className="w-32 h-24 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                                        <ClipboardList className="h-10 w-10 text-slate-300" />
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex flex-col gap-1">
                                                <Input
                                                    {...methods.register("exam_name")}
                                                    className={`text-lg font-bold h-9 w-64 border-slate-300 focus-visible:ring-[#1A3EB1] ${methods.formState.errors.exam_name ? "border-red-500" : ""}`}
                                                    placeholder="Sınav Adı"
                                                />
                                                {methods.formState.errors.exam_name && (
                                                    <p className="text-xs text-red-500 font-medium">{methods.formState.errors.exam_name.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm font-medium text-slate-500 mb-2">
                                            <div className="flex items-center gap-1.5 h-8">
                                                <Clock className="h-4 w-4" />
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        {...methods.register("time_limit", { valueAsNumber: true })}
                                                        className={`h-8 w-20 text-center border-slate-300 focus-visible:ring-[#1A3EB1] ${methods.formState.errors.time_limit ? "border-red-500" : ""}`}
                                                    />
                                                    <span>Dakika</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 h-8">
                                                <ClipboardList className="h-4 w-4" />
                                                <span>{methods.watch("questions").length} Soru</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                            Sınav detaylarını ve sorularını bu ekrandan topluca güncelleyebilirsiniz.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 pb-2">
                                    <h3 className="text-lg font-bold text-slate-900">Soruları Düzenle</h3>
                                </div>

                                <ExamEditor submitExamUpdate={submitExamUpdate} />
                            </form>
                        </FormProvider>
                    ) : (
                        <>
                            {/* Top Exam Header Card - Static View */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-6 shadow-sm relative">
                                <div className="w-32 h-24 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                                    <ClipboardList className="h-10 w-10 text-slate-300" />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-slate-900">{exam_name}</h2>
                                        {level && (
                                            <Badge variant="secondary" className="bg-blue-50 text-[#1A3EB1] hover:bg-blue-100 font-bold px-2 py-0.5">
                                                {level}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6 text-sm font-medium text-slate-500 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            <span>{time_limit} Dakika</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <ClipboardList className="h-4 w-4" />
                                            <span>{question_count} Soru</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                        {initialExamData.exam_name} testine ait soru havuzu detayları. Soruları inceleyebilir veya genel sınav kurallarını güncelleyebilirsiniz.
                                    </p>
                                </div>
                            </div>

                            {/* Question List Header - Static View */}
                            <div className="flex items-center justify-between pt-4 pb-2">
                                <h3 className="text-lg font-bold text-slate-900">Soru Listesi</h3>
                                <span className="text-xs font-bold text-slate-400 tracking-wider">
                                    {questions.length} SORU GÖRÜNTÜLENİYOR
                                </span>
                            </div>

                            {/* Questions Mapping - Static View */}
                            <div className="space-y-4">
                                {questions.map((question: any, idx: number) => (
                                    <div key={question.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative">

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm">
                                                {idx + 1}
                                            </div>

                                            <div className="flex-1 mt-1 pr-16 text-slate-900 font-bold text-base leading-snug">
                                                {question.question_text || question.text}
                                                <div className="mt-2 text-[10px] font-bold tracking-wider text-[#1A3EB1] uppercase">
                                                    {question.question_type === "single_choice" && !question.audio_url ? "METİN TABANLI SORU" :
                                                        question.audio_url ? "DİNLEME (SESLİ) SORU" : "SORU"}
                                                </div>
                                            </div>
                                        </div>

                                        {question.audio_url && (
                                            <div className="ml-12 mb-4">
                                                <CustomAudioPlayer src={question.audio_url} />
                                            </div>
                                        )}

                                        <div className="ml-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {question.options.map((option: any) => {
                                                const isCorrect = option.is_correct;
                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-colors ${isCorrect
                                                            ? "border-green-300 bg-green-50/50 text-green-700"
                                                            : "border-slate-100 bg-white text-slate-600"
                                                            }`}
                                                    >
                                                        <span>{option.text}</span>
                                                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </main>

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sınavı Sil</DialogTitle>
                        <DialogDescription>
                            Bu deneme sınavını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isUpdating}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmSoftDelete}
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sil
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
