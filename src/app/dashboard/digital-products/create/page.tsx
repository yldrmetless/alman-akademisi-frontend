"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Loader2, UploadCloud, X } from "lucide-react";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDigitalProductMutation } from "@/lib/features/course/courseApi";
import { useUploadImageMutation } from "@/lib/features/blog/blogApi";

const createDigitalProductSchema = z.object({
    name: z.string().min(3, "İsim en az 3 karakter olmalı"),
    description: z.string().min(10, "Açıklama yetersiz"),
    price: z.coerce.number().positive("Geçerli bir fiyat giriniz"),
    discounted_price: z.preprocess(
        (value) => {
            if (value === "" || value === null || value === undefined) return null;
            return Number(value);
        },
        z.number().nonnegative("İndirimli fiyat negatif olamaz").nullable()
    ),
    stock: z.coerce.number().int("Stok tam sayı olmalı").min(0, "Stok 0'dan küçük olamaz").default(100),
    external_link: z.string().url("Geçerli bir URL giriniz"),
    download_limit: z.coerce.number().int("İndirme limiti tam sayı olmalı").min(1, "En az 1 olmalı").default(10),
});

type CreateDigitalProductFormValues = z.infer<typeof createDigitalProductSchema>;

type UploadedDigitalImage = {
    digital_product_image_url: string;
    digital_product_public_id: string;
    order: number;
};

const getErrorMessages = (errorData: unknown): string[] => {
    if (!errorData) return [];
    if (typeof errorData === "string") return [errorData];
    if (Array.isArray(errorData)) {
        return errorData.flatMap((item) => getErrorMessages(item));
    }
    if (typeof errorData === "object") {
        return Object.values(errorData as Record<string, unknown>).flatMap((item) => getErrorMessages(item));
    }
    return [];
};

export default function CreateDigitalProductPage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading } = useAuthGuard("admin");

    const [uploadedImages, setUploadedImages] = useState<UploadedDigitalImage[]>([]);
    const [createDigitalProduct, { isLoading: isSubmitting }] = useCreateDigitalProductMutation();
    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateDigitalProductFormValues>({
        resolver: zodResolver(createDigitalProductSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            discounted_price: null,
            stock: 100,
            external_link: "",
            download_limit: 10,
        },
    });

    const isFormBusy = isSubmitting || isUploadingImage;

    const normalizedImages = useMemo(
        () =>
            uploadedImages.map((image, index) => ({
                ...image,
                order: index + 1,
            })),
        [uploadedImages]
    );

    const handleRemoveImage = (publicIdToRemove: string) => {
        setUploadedImages((prev) =>
            prev
                .filter((image) => image.digital_product_public_id !== publicIdToRemove)
                .map((image, index) => ({ ...image, order: index + 1 }))
        );
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const selectedFiles = Array.from(files);

        for (const file of selectedFiles) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name}: Görsel boyutu maks 5MB olmalıdır.`);
                continue;
            }

            const formData = new FormData();
            formData.append("file", file);

            try {
                const uploadResponse = await uploadImage(formData).unwrap();
                const firstResult = uploadResponse?.results?.[0];

                if (!firstResult?.url || !firstResult?.public_id) {
                    throw new Error("Yükleme yanıtı geçersiz.");
                }

                setUploadedImages((prev) => [
                    ...prev,
                    {
                        digital_product_image_url: firstResult.url,
                        digital_product_public_id: firstResult.public_id,
                        order: prev.length + 1,
                    },
                ]);
                toast.success(`${file.name} başarıyla yüklendi.`);
            } catch (error: any) {
                const backendMessages = getErrorMessages(error?.data);
                toast.error(backendMessages[0] || `${file.name} yüklenirken bir hata oluştu.`);
            }
        }

        event.target.value = "";
    };

    const onSubmit = async (data: CreateDigitalProductFormValues) => {
        const payload = {
            name: data.name.trim(),
            description: data.description.trim(),
            price: data.price,
            discounted_price: data.discounted_price,
            stock: data.stock,
            is_active: true,
            product_type: "link",
            external_link: data.external_link.trim(),
            download_limit: data.download_limit,
            images: normalizedImages,
        };

        try {
            const result = await createDigitalProduct(payload);

            if ("error" in result) {
                const errorPayload: any = result.error;
                const isCreatedWithParsingIssue =
                    errorPayload?.status === "PARSING_ERROR" &&
                    Number(errorPayload?.originalStatus) === 201;

                if (isCreatedWithParsingIssue) {
                    toast.success("Dijital ürün başarıyla oluşturuldu.");
                    router.push("/dashboard/digital-products");
                    return;
                }

                const backendMessages = getErrorMessages(errorPayload?.data);
                toast.error(backendMessages[0] || "Dijital ürün oluşturulurken bir hata oluştu.");
                return;
            }

            const successMessage =
                result.data?.data?.message ||
                result.data?.message ||
                "Dijital ürün başarıyla oluşturuldu.";
            toast.success(successMessage);
            router.push("/dashboard/digital-products");
        } catch {
            toast.error("Dijital ürün oluşturulurken bir hata oluştu.");
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
                <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-500">
                            <span
                                className="hover:text-slate-900 cursor-pointer"
                                onClick={() => router.push("/dashboard/digital-products")}
                            >
                                Dijital Eser Yönetimi
                            </span>
                            <span className="mx-2">›</span>
                            <span className="font-medium text-slate-900">Yeni Dijital Eser Ekle</span>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h1 className="text-2xl font-bold text-slate-900">Yeni Dijital Eser Ekle</h1>
                                <p className="text-slate-500 mt-1">
                                    Dijital ürün bilgilerini girerek platformda yeni eser oluşturun.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Ürün Adı</Label>
                                    <Input
                                        placeholder="Örn: B1 Hazırlık PDF Seti"
                                        className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.name ? "border-red-500" : ""}`}
                                        {...register("name")}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Açıklama</Label>
                                    <Textarea
                                        placeholder="Ürünün içeriğini ve kullanım amacını detaylı olarak anlatın..."
                                        className={`min-h-[120px] bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.description ? "border-red-500" : ""}`}
                                        {...register("description")}
                                    />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Fiyat (TL)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Örn: 299.90"
                                            className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.price ? "border-red-500" : ""}`}
                                            {...register("price")}
                                        />
                                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">İndirimli Fiyat (Opsiyonel)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Örn: 199.90"
                                            className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.discounted_price ? "border-red-500" : ""}`}
                                            {...register("discounted_price")}
                                        />
                                        {errors.discounted_price && (
                                            <p className="text-red-500 text-xs mt-1">{errors.discounted_price.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Stok</Label>
                                        <Input
                                            type="number"
                                            placeholder="Örn: 100"
                                            className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.stock ? "border-red-500" : ""}`}
                                            {...register("stock")}
                                        />
                                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">İndirme Limiti</Label>
                                        <Input
                                            type="number"
                                            placeholder="Örn: 10"
                                            className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.download_limit ? "border-red-500" : ""}`}
                                            {...register("download_limit")}
                                        />
                                        {errors.download_limit && (
                                            <p className="text-red-500 text-xs mt-1">{errors.download_limit.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Harici Link</Label>
                                    <Input
                                        type="url"
                                        placeholder="https://..."
                                        className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.external_link ? "border-red-500" : ""}`}
                                        {...register("external_link")}
                                    />
                                    {errors.external_link && (
                                        <p className="text-red-500 text-xs mt-1">{errors.external_link.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Ürün Görselleri</Label>
                                    <div className="relative rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1A3EB1] bg-slate-50 transition-colors px-4 py-10 text-center">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            onChange={handleImageUpload}
                                            disabled={isFormBusy}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            {isUploadingImage ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
                                                    <span className="text-sm text-slate-600">Görseller yükleniyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-8 w-8 text-[#1A3EB1]" />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        Çoklu görsel yüklemek için tıklayın veya sürükleyin
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        JPG, PNG, WEBP (Maksimum 5MB / dosya)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {normalizedImages.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold text-slate-700">Yüklenen Görseller</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {normalizedImages.map((image) => (
                                                <div
                                                    key={image.digital_product_public_id}
                                                    className="group relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                >
                                                    <Image
                                                        src={image.digital_product_image_url}
                                                        alt="Dijital ürün görseli"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                        #{image.order}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(image.digital_product_public_id)}
                                                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                        aria-label="Görseli kaldır"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isFormBusy}
                                        className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Kaydediliyor...</span>
                                            </>
                                        ) : (
                                            <span>Dijital Eseri Oluştur</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
