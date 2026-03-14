"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Loader2, ChevronRight, MessageSquareText, User, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const bilgiAlSchema = z.object({
    name: z.string().min(2, "Ad Soyad gereklidir"),
    phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
    is_whatsapp: z.boolean().default(false),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    message: z.string().min(10, "Mesajınız en az 10 karakter olmalıdır"),
});

type BilgiAlFormValues = z.infer<typeof bilgiAlSchema>;

const priorityItems: Array<{ label: string; value: BilgiAlFormValues["priority"] }> = [
    { label: "Düşük", value: "low" },
    { label: "Normal", value: "normal" },
    { label: "Yüksek", value: "high" },
];

export default function BilgiAlPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<BilgiAlFormValues>({
        resolver: zodResolver(bilgiAlSchema),
        defaultValues: {
            name: "",
            phone: "",
            is_whatsapp: false,
            priority: "normal",
            message: "",
        },
    });

    const onSubmit = async (values: BilgiAlFormValues) => {
        const normalizedPhone = values.phone.replace(/\D/g, "");

        const payload = {
            name: values.name.trim(),
            phone: normalizedPhone,
            is_whatsapp: values.is_whatsapp,
            priority: values.priority,
            message: values.message.trim(),
        };

        try {
            setIsSubmitting(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/info-request-create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("request_failed");
            }

            toast.success("Talebiniz başarıyla iletildi.");
            router.push("/");
        } catch {
            toast.error("Hata oluştu, lütfen alanları kontrol edin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 pt-24 pb-16">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
                <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Link href="/" className="transition-colors hover:text-[#1a365d]">Anasayfa</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-slate-900">Bilgi Al</span>
                </nav>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.4)]">
                    <div className="border-b border-slate-100 bg-linear-to-r from-[#1a365d]/5 to-[#8DC63F]/10 p-6 sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                                <MessageSquareText className="h-5 w-5 text-[#1a365d]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-[#1a365d]">Bilgi Al</h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 p-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Ad Soyad</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Ad Soyad"
                                        className={`h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 focus-visible:ring-[#1A3EB1] ${errors.name ? "border-red-500" : ""}`}
                                        {...register("name")}
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Telefon Numaranız</Label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="05xx xxx xx xx"
                                        className={`h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 focus-visible:ring-[#1A3EB1] ${errors.phone ? "border-red-500" : ""}`}
                                        {...register("phone")}
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Mesajınız</Label>
                            <Textarea
                                placeholder="Size nasıl yardımcı olabiliriz?"
                                className={`min-h-[150px] rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-[#1A3EB1] ${errors.message ? "border-red-500" : ""}`}
                                {...register("message")}
                            />
                            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            WhatsApp üzerinden iletişime geçilmesini istiyorum
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Açık olduğunda size WhatsApp üzerinden ulaşırız.
                                        </p>
                                    </div>
                                    <Controller
                                        control={control}
                                        name="is_whatsapp"
                                        render={({ field }) => (
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Öncelik</Label>
                                <Controller
                                    control={control}
                                    name="priority"
                                    render={({ field }) => (
                                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                                            {priorityItems.map((item) => {
                                                const isActive = field.value === item.value;
                                                return (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        onClick={() => field.onChange(item.value)}
                                                        className={`h-10 rounded-xl text-sm font-semibold transition-all ${isActive
                                                            ? "bg-[#1a365d] text-white shadow-sm"
                                                            : "text-slate-600 hover:bg-white"
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                />
                                {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-12 rounded-2xl bg-linear-to-r from-[#1A3EB1] to-[#1d4ed8] px-8 text-white font-bold shadow-lg shadow-blue-900/20 transition-transform hover:scale-[1.01] hover:from-[#15308A] hover:to-[#1a3eb1]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    "Gönder"
                                )}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
