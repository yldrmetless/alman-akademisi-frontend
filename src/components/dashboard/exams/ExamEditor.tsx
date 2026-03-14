"use client";

import { useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Music, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUploadImageMutation } from "@/lib/features/blog/blogApi";
import { toast } from "react-hot-toast";

export function ExamEditor({ submitExamUpdate }: { submitExamUpdate: (values: any) => Promise<void> }) {
    const { control, formState, getValues } = useFormContext<any>();
    const { errors } = formState;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    return (
        <div className="space-y-6">
            {fields.map((questionField, qIndex) => (
                <QuestionBlock
                    key={questionField.id}
                    qIndex={qIndex}
                    remove={() => remove(qIndex)}
                />
            ))}

            <div className="pt-6 pb-12 flex justify-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        const currentMax = Math.max(...fields.map((q: any) => q.order || 0), 0);
                        const newQuestionOrder = currentMax + 1;

                        append({
                            question_text: "",
                            question_type: "single_choice",
                            order: newQuestionOrder,
                            options: [
                                { text: "", is_correct: false },
                                { text: "", is_correct: false },
                                { text: "", is_correct: false },
                                { text: "", is_correct: false }
                            ]
                        });
                    }}
                    className="border-[#1A3EB1] text-[#1A3EB1] hover:bg-blue-50 h-12 px-8 rounded-full font-bold shadow-sm transition-all"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Soru Ekle
                </Button>

                <Button
                    type="button"
                    className="bg-[#01cb6a] hover:bg-[#01a656] text-white shadow-sm flex items-center gap-2 px-8 h-12 rounded-full font-bold transition-all"
                    disabled={formState.isSubmitting}
                    onClick={async () => {
                        if (Object.keys(errors).length > 0) {
                            console.log("Zod Validation Errors:", errors);
                        }
                        const currentValues = getValues();
                        await submitExamUpdate(currentValues);
                    }}
                >
                    {formState.isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Değişiklikleri Kaydet
                </Button>
            </div>

            {errors.questions?.root && (
                <p className="text-center text-red-500 font-bold">
                    {errors.questions.root.message as string}
                </p>
            )}
        </div>
    );
}

function QuestionBlock({ qIndex, remove }: { qIndex: number; remove: () => void }) {
    const { control, register, watch, setValue, formState: { errors } } = useFormContext<any>();
    const audioInputRef = useRef<HTMLInputElement>(null);

    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `questions.${qIndex}.options`
    });

    const [uploadImage] = useUploadImageMutation();

    const audioUrl = watch(`questions.${qIndex}.audio_url`);
    const audioFile = watch(`questions.${qIndex}.audio_file`);
    const isUploadingAudio = watch("is_uploading_audio");

    const hasAudio = !!audioUrl || !!audioFile;
    const previewUrl = audioFile ? URL.createObjectURL(audioFile) : audioUrl;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setValue("is_uploading_audio", true);
                const formData = new FormData();
                formData.append("file", file);

                const res = await uploadImage(formData).unwrap();

                // Process the uploaded audio data from the nested results array
                const uploadedAudioData = res.results ? res.results[0] : res;

                setValue(`questions.${qIndex}.audio_url`, uploadedAudioData.secure_url || uploadedAudioData.url, { shouldDirty: true });
                setValue(`questions.${qIndex}.audio_public_id`, uploadedAudioData.public_id, { shouldDirty: true });
                setValue(`questions.${qIndex}.audio_file`, null);
            } catch (error) {
                toast.error("Ses dosyası yüklenirken hata oluştu.");
            } finally {
                setValue("is_uploading_audio", false);
            }
        }
    };

    const removeAudio = () => {
        setValue(`questions.${qIndex}.audio_file`, null, { shouldDirty: true });
        setValue(`questions.${qIndex}.audio_url`, null, { shouldDirty: true });
        setValue(`questions.${qIndex}.audio_public_id`, null, { shouldDirty: true });
    };

    const qErrors = (errors?.questions as any)?.[qIndex];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative animate-in fade-in zoom-in-95 duration-200">

            {/* Header / Text */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm">
                    {qIndex + 1}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                        {...register(`questions.${qIndex}.question_text`)}
                        placeholder="Soru metnini giriniz..."
                        className={`min-h-[80px] resize-none ${qErrors?.question_text ? "border-red-500" : "border-slate-200"}`}
                    />
                    {qErrors?.question_text && (
                        <p className="text-xs text-red-500 font-medium">{qErrors.question_text.message}</p>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={remove}
                    className="text-red-500 hover:bg-red-50 h-9 w-9 p-0 shrink-0 rounded-full"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Audio Section */}
            <div className="ml-12 mb-4">
                {!hasAudio ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex border-dashed text-slate-500"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={isUploadingAudio}
                    >
                        {isUploadingAudio ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        {isUploadingAudio ? "Yükleniyor..." : "Ses Dosyası Ekle"}
                    </Button>
                ) : (
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3 inline-flex">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-[#1A3EB1] text-white flex items-center justify-center">
                            <Music className="h-5 w-5" />
                        </div>
                        <audio controls src={previewUrl} className="h-8 max-w-[200px]" />
                        <Button type="button" variant="ghost" size="icon" onClick={removeAudio} className="text-red-500 hover:bg-red-50 h-8 w-8 ml-auto">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <input type="file" ref={audioInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
            </div>

            {/* Options Management */}
            <div className="ml-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {optionFields.map((field, oIndex) => {
                        const isCorrect = watch(`questions.${qIndex}.options.${oIndex}.is_correct`);
                        return (
                            <div key={field.id} className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${isCorrect ? "border-green-300 bg-green-50/20" : "border-slate-100 bg-white"}`}>
                                <div
                                    className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors ${isCorrect
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                        }`}
                                    onClick={() => {
                                        const options = watch(`questions.${qIndex}.options`) || [];
                                        options.forEach((_: any, i: number) => {
                                            setValue(`questions.${qIndex}.options.${i}.is_correct`, i === oIndex, { shouldDirty: true });
                                        });
                                    }}
                                >
                                    {String.fromCharCode(65 + oIndex)}
                                </div>
                                <Input
                                    {...register(`questions.${qIndex}.options.${oIndex}.text`)}
                                    placeholder={`${String.fromCharCode(65 + oIndex)} Seçeneği...`}
                                    className="h-9 border-none shadow-none focus-visible:ring-0 bg-transparent px-2 w-full"
                                />
                                {optionFields.length > 2 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(oIndex)} className="text-slate-400 hover:text-red-500 h-8 w-8 shrink-0">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {qErrors?.options?.root && (
                    <p className="text-xs text-red-500 font-medium mb-3">{qErrors.options.root.message}</p>
                )}
                {optionFields.length < 6 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => appendOption({ text: "", is_correct: false })} className="text-[#1A3EB1] hover:bg-blue-50 px-3">
                        <Plus className="h-4 w-4 mr-1.5" /> Seçenek Ekle
                    </Button>
                )}
            </div>

        </div>
    );
}
