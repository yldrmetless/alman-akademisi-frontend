"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, X, Loader2, Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { useCreateCourseMutation, useGetCourseCategoriesQuery } from "@/lib/features/course/courseApi";
import { toast } from "react-hot-toast";
const courseSchema = z.object({
    name: z.string().min(1, "Kurs adı zorunludur").max(200, "En fazla 200 karakter"),
    description: z.string().min(1, "Açıklama zorunludur"),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
        error: "Geçersiz veya eksik seviye seçimi",
    }),
    type: z.enum(['online', 'offline'], {
        error: "Kurs türü seçimi zorunludur"
    }),
    is_private_lesson: z.boolean().default(false),
    start_date: z.string().min(1, "Başlangıç tarihi zorunludur"),
    end_date: z.string().min(1, "Bitiş tarihi zorunludur"),
    start_time: z.string().min(1, "Başlangıç saati zorunludur"),
    end_time: z.string().min(1, "Bitiş saati zorunludur"),
    price: z.coerce.number().min(1, "Geçerli bir fiyat giriniz"),
    discounted_price: z.coerce.number().min(0, "Negatif değer olamaz").optional(),
    category_id: z.string().min(1, "Kategori zorunludur"),
    capacity: z.coerce.number().min(1, "Kontenjan zorunludur"),
    tags: z.array(z.string()).optional(),
    education_link: z.string().url("Geçerli bir eğitim linki giriniz").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.discounted_price && data.price && data.discounted_price >= data.price) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "İndirimli fiyat normal fiyattan düşük olmalıdır",
            path: ["discounted_price"],
        });
    }

    if (data.is_private_lesson === true && data.type === "offline") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Özel Ders için Kurs Türü 'Offline' olamaz.",
            path: ["type"],
        });
    }
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function CreateCoursePage() {
    const router = useRouter();
    const { isAuthorized, profile, isLoading: isAuthLoading, token } = useAuthGuard("admin");

    const [createCourse, { isLoading: isSubmitting }] = useCreateCourseMutation();
    const { data: categories, isError: isCategoryError } = useGetCourseCategoriesQuery({ page: 1, token }, { skip: !token });

    useEffect(() => {
        if (isCategoryError) {
            toast.error("Kategoriler yüklenirken bir hata oluştu.");
        }
    }, [isCategoryError]);

    const formattedCategoryOptions = categories?.results?.map((cat: { id: number, name: string }) => ({
        label: cat.name,
        value: cat.id.toString()
    })) || [];

    const [uploadedImage, setUploadedImage] = useState<{ url: string; public_id: string } | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            start_date: "",
            end_date: "",
            start_time: "",
            end_time: "",
            price: 0,
            discounted_price: undefined,
            category_id: "",
            capacity: 0,
            tags: [],
            education_link: "",
            type: "" as any,
            is_private_lesson: false,
        }
    });

    const [newTagInput, setNewTagInput] = useState("");
    const courseTags = watch("tags") || [];
    const isPrivateLesson = watch("is_private_lesson");
    const selectedCourseType = watch("type");

    useEffect(() => {
        if (isPrivateLesson && selectedCourseType === "offline") {
            setValue("type", "online", { shouldValidate: true, shouldDirty: true });
        }
    }, [isPrivateLesson, selectedCourseType, setValue]);

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // prevent form submission
            const value = newTagInput.trim();
            if (value && !courseTags.includes(value)) {
                setValue("tags", [...courseTags, value]);
            }
            setNewTagInput("");
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setValue("tags", courseTags.filter(tag => tag !== tagToDelete));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Görsel boyutu maks 5MB olmalıdır.");
            return;
        }

        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("access");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}blog/cloudinary-upload/`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Görsel yüklenemedi");

            const data = await res.json();

            if (data.results && data.results.length > 0) {
                setUploadedImage({
                    url: data.results[0].url,
                    public_id: data.results[0].public_id
                });
                toast.success("Görsel başarıyla yüklendi");
            } else {
                throw new Error("Geçersiz yanıt formatı");
            }

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Görsel yüklenirken bir hata oluştu");
        } finally {
            setIsUploadingImage(false);
            e.target.value = ""; // reset input
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
    };

    const onSubmit = async (data: CourseFormValues) => {
        if (!uploadedImage) {
            toast.error("Lütfen bir kurs görseli yükleyin.");
            return;
        }

        const { capacity, category_id, ...restData } = data;

        const payload = {
            ...restData,
            quota: capacity,
            image_url: uploadedImage.url,
            image_public_id: uploadedImage.public_id,
            category: Number(category_id),
        };

        try {
            await createCourse(payload).unwrap();
            toast.success("Kurs başarıyla oluşturuldu!");
            router.push('/dashboard/courses');
        } catch (error: any) {
            console.error("Create course failed:", error);
            toast.error(error?.data?.message || "Kurs oluşturulurken bir hata oluştu.");
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

                    {/* Breadcrumbs & Header */}
                    <div className="space-y-4">
                        <div className="flex items-center text-sm text-slate-500">
                            <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push('/dashboard/courses')}>Kurs Yönetimi</span>
                            <span className="mx-2">›</span>
                            <span className="font-medium text-slate-900">Yeni Kurs Ekle</span>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h1 className="text-2xl font-bold text-slate-900">Yeni Kurs Ekle</h1>
                                <p className="text-slate-500 mt-1">
                                    Platforma yeni bir Almanca dil kursu tanımlamak için aşağıdaki formu doldurun.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">

                                {/* 1. Kurs Adı */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Kurs Adı</Label>
                                    <Input
                                        placeholder="Örn: A1 Yoğun Almanca"
                                        className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.name ? 'border-red-500' : ''}`}
                                        {...register("name")}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                {/* 2. Kurs Açıklaması */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Kurs Açıklaması</Label>
                                    <Textarea
                                        placeholder="Kurs içeriği, hedefleri ve kazanımları hakkında detaylı bilgi giriniz..."
                                        className={`min-h-[120px] bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.description ? 'border-red-500' : ''}`}
                                        {...register("description")}
                                    />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>

                                {/* 3. Seviye Seçimi */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Seviye Seçimi</Label>
                                    <Controller
                                        control={control}
                                        name="level"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <SelectTrigger className={`bg-slate-50 border-slate-200 focus:ring-[#1A3EB1] ${errors.level ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Seviye Seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                                                        <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level.message}</p>}
                                </div>

                                {/* 4. Kurs Türü ve Kurs Tipi */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Kurs Türü</Label>
                                        <Controller
                                            control={control}
                                            name="type"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <SelectTrigger className={`bg-slate-50 border-slate-200 focus:ring-[#1A3EB1] ${errors.type ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Tür Seçiniz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="online">Online</SelectItem>
                                                        <SelectItem value="offline" disabled={Boolean(isPrivateLesson)}>
                                                            Offline
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Kurs Tipi</Label>
                                        <Controller
                                            control={control}
                                            name="is_private_lesson"
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value ? "true" : "false"}
                                                    onValueChange={(value) => field.onChange(value === "true")}
                                                >
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-[#1A3EB1]">
                                                        <SelectValue placeholder="Kurs Tipi Seçiniz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="false">Kurs</SelectItem>
                                                        <SelectItem value="true">Özel Ders</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* 4. Tarih Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Başlangıç Tarihi</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                className={`pl-3 bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.start_date ? 'border-red-500' : ''}`}
                                                {...register("start_date")}
                                            />
                                        </div>
                                        {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Bitiş Tarihi</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                className={`pl-3 bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.end_date ? 'border-red-500' : ''}`}
                                                {...register("end_date")}
                                            />
                                        </div>
                                        {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
                                    </div>
                                </div>

                                {/* 5. Saat Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Başlangıç Saati</Label>
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                className={`pl-3 bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.start_time ? 'border-red-500' : ''}`}
                                                {...register("start_time")}
                                            />
                                        </div>
                                        {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Bitiş Saati</Label>
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                className={`pl-3 bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.end_time ? 'border-red-500' : ''}`}
                                                {...register("end_time")}
                                            />
                                        </div>
                                        {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time.message}</p>}
                                    </div>
                                </div>

                                {/* 6. Fiyat, İndirimli Fiyat, Kontenjan, Kategori Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Sol Kolon: Fiyat ve İndirimli Fiyat */}
                                    <div className="flex flex-col gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Fiyat (TL)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="4500"
                                                    className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.price ? 'border-red-500' : ''}`}
                                                    {...register("price")}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                                    TL
                                                </div>
                                            </div>
                                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">İndirimli Fiyat (TL)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="Örn: 150"
                                                    className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.discounted_price ? 'border-red-500' : ''}`}
                                                    {...register("discounted_price")}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                                    TL
                                                </div>
                                            </div>
                                            {errors.discounted_price && <p className="text-red-500 text-xs mt-1">{errors.discounted_price.message}</p>}
                                        </div>
                                    </div>

                                    {/* Sağ Kolon: Kontenjan ve Kategori */}
                                    <div className="flex flex-col gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Kontenjan</Label>
                                            <Input
                                                type="number"
                                                placeholder="Örn: 20"
                                                className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.capacity ? 'border-red-500' : ''}`}
                                                {...register("capacity")}
                                            />
                                            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Kategori</Label>
                                            <Controller
                                                control={control}
                                                name="category_id"
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className={`bg-slate-50 border-slate-200 focus:ring-[#1A3EB1] ${errors.category_id ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Kategori Seçiniz" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {formattedCategoryOptions.map((cat: { label: string, value: string }) => (
                                                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                            ))}
                                                            {formattedCategoryOptions.length === 0 && (
                                                                <SelectItem value="1" disabled>Statik Kategori</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* 7. Etiketler Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Etiketler</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                placeholder="Etiket yazıp Enter'a basın..."
                                                value={newTagInput}
                                                onChange={(e) => setNewTagInput(e.target.value)}
                                                onKeyDown={handleTagInputKeyDown}
                                                className="bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1]"
                                            />
                                            {courseTags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {courseTags.map(tag => (
                                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#1A3EB1] text-xs font-semibold border border-[#DCE4FF]">
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTag(tag)}
                                                                className="hover:bg-[#DCE4FF] rounded-full p-0.5 transition-colors"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* NEW FIELD: Eğitim Linki */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Eğitim Linki</Label>
                                        <Input
                                            placeholder="Örn: Zoom, Google Meet veya Drive linki"
                                            className={`bg-slate-50 border-slate-200 focus-visible:ring-[#1A3EB1] ${errors.education_link ? 'border-red-500' : ''}`}
                                            {...register("education_link")}
                                        />
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            Bu link sadece kursa kayıtlı olan öğrencilerle paylaşılacaktır.
                                        </p>
                                        {errors.education_link && <p className="text-red-500 text-xs mt-1">{errors.education_link.message}</p>}
                                    </div>
                                </div>

                                {/* 8. Image Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Kurs Görseli</Label>
                                        <div className="relative h-[200px] rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1A3EB1] bg-slate-50 transition-colors flex flex-col items-center justify-center overflow-hidden">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleImageUpload}
                                                disabled={isUploadingImage}
                                            />
                                            {isUploadingImage ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 animate-spin text-[#1A3EB1]" />
                                                    <span className="text-sm text-slate-500 font-medium tracking-tight">Görsel Yükleniyor...</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-center px-4">
                                                    <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-1">
                                                        <UploadCloud className="w-6 h-6 text-[#1A3EB1]" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        Dosyayı buraya sürükleyin veya tıklayın
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        JPG, PNG veya WEBP (Maksimum 5MB)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Yüklenen Görseller</Label>
                                        {uploadedImage && (
                                            <div className="relative w-32 h-32 rounded-lg border border-slate-200 overflow-hidden group">
                                                <img src={uploadedImage.url} alt="Uploaded course preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={removeImage}
                                                        className="h-8 w-8 rounded-full"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Footer */}
                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isUploadingImage}
                                        className="bg-[#1A3EB1] hover:bg-[#15308A] text-white shadow-sm flex items-center gap-2 px-6 h-11 rounded-lg font-medium transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Kaydediliyor...</span>
                                            </>
                                        ) : (
                                            <span>Değişiklikleri Kaydet</span>
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
