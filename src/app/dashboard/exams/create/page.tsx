"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Clock, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useCreateExamMutation } from "@/lib/features/course/courseApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { ExamEditor } from "@/components/dashboard/exams/ExamEditor";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const examFormSchema = z.object({
    exam_name: z.string().min(1, "Sınav adı zorunludur."),
    level: z.string().min(1, "Seviye seçimi zorunludur."),
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

export default function CreateExamPage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");
    const [createExam] = useCreateExamMutation();
    const [isCreating, setIsCreating] = useState(false);

    const methods = useForm<ExamFormValues>({
        resolver: zodResolver(examFormSchema),
        defaultValues: {
            exam_name: "",
            level: "",
            time_limit: 0,
            is_uploading_audio: false,
            questions: [
                {
                    question_text: "",
                    question_type: "single_choice",
                    order: 1,
                    options: [
                        { text: "", is_correct: false },
                        { text: "", is_correct: false },
                        { text: "", is_correct: false },
                        { text: "", is_correct: false }
                    ]
                }
            ]
        }
    });

    const isUploadingAudio = methods.watch("is_uploading_audio");

    const submitCreateExam = async (values: ExamFormValues) => {
        try {
            setIsCreating(true);
            let currentMaxOrder = 0;

            const cleanQuestions = values.questions.map(q => {
                currentMaxOrder += 1;

                return {
                    question_text: q.question_text || "",
                    question_type: "single_choice",
                    order: currentMaxOrder,
                    ...(q.audio_url ? { audio_url: q.audio_url } : {}),
                    ...(q.audio_public_id ? { audio_public_id: q.audio_public_id } : {}),
                    options: q.options.map(o => ({
                        text: o.text || "",
                        is_correct: o.is_correct || false
                    }))
                };
            });

            const createPayload = {
                name: values.exam_name,
                level: values.level,
                time_limit: values.time_limit,
                questions: cleanQuestions
            };

            await createExam(createPayload).unwrap();

            toast.success("Sınav ve sorular başarıyla oluşturuldu");
            router.push(`/dashboard/exams`);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.data?.message || Object.values(error?.data || {}).flat().join(", ") || "Bir hata oluştu.");
        } finally {
            setIsCreating(false);
        }
    };

    if (isAuthLoading || (!isAuthorized && typeof window !== "undefined")) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar
                firstName={profile?.first_name || ""}
                lastName={profile?.last_name || ""}
                username={profile?.username || ""}
            />

            <main className="flex-1 lg:ml-72 min-w-0 pb-24">
                <div className="p-4 sm:p-8 max-w-[1000px] mx-auto space-y-6">

                    <div className="flex flex-col gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="w-fit -ml-2 text-slate-500 hover:text-slate-900"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Geri Dön
                        </Button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    Yeni Sınav Oluştur
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    Sınav detaylarını ve sorularını bu ekrandan ekleyebilirsiniz.
                                </p>
                            </div>
                        </div>
                    </div>

                    <FormProvider {...methods}>
                        <form id="exam-creator-form" className="space-y-6">
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
                                                placeholder="Sınav Adı (Örn: A1 İngilizce)"
                                            />
                                            {methods.formState.errors.exam_name && (
                                                <p className="text-xs text-red-500 font-medium">{methods.formState.errors.exam_name.message}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <Controller
                                                name="level"
                                                control={methods.control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className={`h-9 w-32 border-slate-300 focus:ring-[#1A3EB1] ${methods.formState.errors.level ? "border-red-500" : ""}`}>
                                                            <SelectValue placeholder="Seviye Seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
                                                                <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {methods.formState.errors.level && (
                                                <p className="text-xs text-red-500 font-medium">{methods.formState.errors.level.message}</p>
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
                                                    placeholder="Süre"
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
                                        Lütfen sınavınızın başlığını, süresini ve sorularını doğru şekilde doldurduğunuzdan emin olun.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 pb-2">
                                <h3 className="text-lg font-bold text-slate-900">Soruları Ekle</h3>
                            </div>

                            <ExamEditor submitExamUpdate={submitCreateExam} />
                        </form>
                    </FormProvider>
                </div>
            </main>
        </div>
    );
}
