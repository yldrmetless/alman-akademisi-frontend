"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Image from "next/image";
import toast from "react-hot-toast";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
    useGetCategoriesQuery,
    useGetBlogPostDetailQuery,
    useUpdateBlogPostMutation,
    useUploadImageMutation
} from "@/lib/features/blog/blogApi";

import {
    Loader2, ArrowLeft, CloudUpload, Bold, Italic, List, ListOrdered, Link as LinkIcon, ImagePlus, Maximize, X, Check, ChevronsUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';

const blogSchema = z.object({
    title: z.string().min(3, 'Başlık çok kısa').max(200, 'Başlık çok uzun'),
    content: z.string().min(10, 'İçerik çok kısa'),
    categories: z.array(z.number()).min(1, 'En az bir kategori seçin'),
    tags: z.array(z.string()),
    image_url: z.string().min(1, 'Görsel gerekli'),
    image_public_id: z.string().min(1, 'Görsel ID gerekli'),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function EditBlogPostPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { isAuthorized, isLoading: isAuthLoading, profile, token } = useAuthGuard("admin");

    const [updateBlogPost, { isLoading: isUpdating }] = useUpdateBlogPostMutation();
    const [uploadImageMutation, { isLoading: isUploadingImage }] = useUploadImageMutation();

    const { data: post, isLoading: isPostLoading } = useGetBlogPostDetailQuery(params.id, {
        skip: !params.id
    });

    const [tagInput, setTagInput] = useState("");
    const [openCategory, setOpenCategory] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<BlogFormValues>({
        resolver: zodResolver(blogSchema),
        defaultValues: {
            title: "",
            content: "",
            categories: [],
            tags: [],
            image_url: "",
            image_public_id: ""
        }
    });

    const formCategories = watch("categories");
    const formTags = watch("tags");
    const previewUrl = watch("image_url");

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Bir şeyler yazmaya başla...' }),
            LinkExtension.configure({ openOnClick: false, autolink: true }),
            ImageExtension.configure({ inline: true }),
            CharacterCount,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            setValue("content", editor.getHTML(), { shouldValidate: true });
        },
        editorProps: {
            attributes: {
                class: 'w-full min-h-[400px] p-6 text-slate-700 bg-white border-none outline-none focus:ring-0 leading-relaxed font-sans prose max-w-none',
            },
        },
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCategorySearch(categorySearchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [categorySearchQuery]);

    const { data: categoriesData, isFetching: isCategoriesFetching } = useGetCategoriesQuery(
        debouncedCategorySearch ? { name: debouncedCategorySearch } : undefined,
        { skip: !isAuthorized || !token }
    );
    const availableCategories = categoriesData?.results || [];

    useEffect(() => {
        if (post) {
            const initialCategories = post.categories && Array.isArray(post.categories)
                ? post.categories.filter(c => c && c.id).map(c => c.id)
                : [];

            const initialTags = post.tags && Array.isArray(post.tags)
                ? post.tags.filter(t => t && t.name).map(t => t.name)
                : [];

            reset({
                title: post.title || "",
                content: post.content || "",
                categories: initialCategories,
                tags: initialTags,
                image_url: post.image_url || "",
                image_public_id: post.image_public_id || ""
            });

            if (editor && !editor.isDestroyed && post.content) {
                // To prevent overwriting active edits if re-triggered, check content diff or just do once
                editor.commands.setContent(post.content);
            }
        }
    }, [post, editor, reset]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            // RTK Query upload image executes automatically attaching Bearer token from fetchBaseQuery config
            const response = await uploadImageMutation(formData).unwrap();

            if (response.results && response.results.length > 0) {
                setValue("image_url", response.results[0].url, { shouldValidate: true });
                setValue("image_public_id", response.results[0].public_id, { shouldValidate: true });
                toast.success("Yeni görsel başarıyla yüklendi.");
            } else {
                throw new Error("Sunucudan geçersiz yanıt alındı.");
            }
        } catch (error: any) {
            toast.error(error.data?.error || "Görsel yüklenemedi.");
        }

        e.target.value = '';
    };

    const removeCoverImage = () => {
        setValue("image_url", "", { shouldValidate: true });
        setValue("image_public_id", "", { shouldValidate: true });
    };

    const onSubmit = async (data: BlogFormValues) => {
        // Prevent empty TipTap payload slipping explicitly through Zod string min length easily
        if (!data.content || data.content === "<p></p>" || data.content.trim().length === 0) {
            toast.error("Lütfen blog içeriği girin.");
            return;
        }

        try {
            await updateBlogPost({ id: params.id, body: data }).unwrap();
            toast.success("Blog başarıyla güncellendi.");
            // Force hard reload to bypass persistent Next.js App Router client caching
            window.location.href = `/dashboard/blog/detail/${params.id}`;
        } catch (error: any) {
            console.error("Update Error:", error);
            // Dynamic Backend DRF error traversal
            if (error.data && typeof error.data === 'object') {
                for (const [key, msgs] of Object.entries(error.data)) {
                    if (Array.isArray(msgs) && msgs.length > 0) {
                        toast.error(`${key}: ${msgs[0]}`);
                        return;
                    }
                }
            }
            toast.error("Blog güncellenirken bir hata oluştu.");
        }
    };

    const onError = (errors: any) => {
        console.error("Zod Validation Error Payload:", errors);

        // Toast explicit field boundaries trapping submission dynamically
        const errorMessages = Object.values(errors).map((err: any) => err.message);
        if (errorMessages.length > 0) {
            toast.error(`Form doğrulama hatası: ${errorMessages.join(", ")}`);
        } else {
            toast.error("Lütfen formdaki tüm eksik alanları doldurun.");
        }
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL linkini girin:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        if (!editor) return;
        const url = window.prompt('Görsel URL adresini girin:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    if (isAuthLoading || !token || !isAuthorized || !profile) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-[#FAFBFF] space-y-6">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E3BB3]" />
            </div>
        );
    }

    if (isPostLoading) {
        return (
            <div className="flex flex-col h-screen w-full lg:pl-72 items-center justify-center bg-[#FAFBFF]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">Blog bilgileri yükleniyor...</p>
            </div>
        );
    }

    // Helper for category name lookups mapping visual names without redundantly storing states locally outside Form
    const getCategoryName = (id: number) => {
        // Look in newly fetched categories 
        const found = availableCategories.find((c: any) => c.id === id);
        if (found) return found.name;
        // Fallback to original post categories
        const original = post?.categories?.find(c => c.id === id);
        if (original) return original.name;
        return `Kategori #${id}`;
    };

    return (
        <div className="min-h-screen bg-[#FAFBFF] relative flex flex-col items-start lg:flex-row">
            <Sidebar
                firstName={profile.first_name || ""}
                lastName={profile.last_name || ""}
                username={profile.username || ""}
            />

            <main className="w-full lg:ml-72 transition-all duration-300 min-h-screen flex flex-col">
                <div className="w-full px-4 py-8 pt-[4.5rem] lg:pt-8 flex flex-col flex-1">
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="max-w-6xl mx-auto flex flex-col gap-8 w-full flex-1">

                        {/* Header Block */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.back()}
                                    className="h-10 w-10 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Blog Düzenle</h1>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isUpdating}
                                    className="flex-1 sm:flex-none h-11 px-6 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 sm:flex-none h-11 px-8 bg-[#1A3EB1] hover:bg-[#1E3BB3]/90 text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Güncelleniyor...
                                        </>
                                    ) : "Değişiklikleri Kaydet"}
                                </Button>
                            </div>
                        </div>

                        {/* Two Column Layout Wrapper */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">

                            {/* LEFT COLUMN: Editor Map */}
                            <div className="flex-1 flex flex-col gap-6 w-full">

                                {/* Image Dropzone */}
                                <div className={`relative w-full h-[300px] sm:h-[400px] border-2 border-dashed ${errors.image_url ? 'border-red-400' : 'border-slate-300'} hover:border-[#1A3EB1]/50 bg-slate-50 hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center transition-all group overflow-hidden cursor-pointer`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isUploadingImage}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                    />
                                    {isUploadingImage ? (
                                        <div className="flex flex-col items-center text-center p-6">
                                            <Loader2 className="h-10 w-10 text-[#1A3EB1] animate-spin mb-4" />
                                            <h3 className="text-lg font-bold text-slate-700">Yükleniyor...</h3>
                                        </div>
                                    ) : previewUrl ? (
                                        <>
                                            <Image src={previewUrl} alt="Kapak Görseli" fill className="object-cover" />
                                            <div className="absolute top-4 right-4 z-20">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-md hover:scale-105 transition-transform"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeCoverImage();
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-6">
                                            <div className="h-16 w-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                                <CloudUpload className="h-8 w-8 text-[#1A3EB1]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700 mb-1">Görseli Değiştir</h3>
                                            <p className="text-sm font-medium text-slate-400">Yeni bir görsel yüklemek için tıklayın</p>
                                        </div>
                                    )}
                                </div>
                                {errors.image_url && <p className="text-red-500 text-sm font-medium mt-1">{errors.image_url.message}</p>}

                                {/* Title Editor Container */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Başlık</p>
                                        <input
                                            type="text"
                                            {...register("title")}
                                            placeholder="Yazı Başlığı..."
                                            className="w-full text-3xl sm:text-4xl font-bold text-slate-800 placeholder:text-slate-300 bg-transparent border-none outline-none focus:ring-0 p-0"
                                        />
                                        {errors.title && <p className="text-red-500 text-sm font-medium">{errors.title.message}</p>}
                                    </div>

                                    {/* Rich Text Toolbar Matrix */}
                                    <div className={`flex flex-col border ${errors.content ? 'border-red-400' : 'border-slate-200'} rounded-xl overflow-hidden mt-2`}>
                                        {editor && (
                                            <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto sticky top-0 z-10">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('bold') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <Bold className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('italic') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <Italic className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <List className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <ListOrdered className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={setLink}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('link') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={addImage}
                                                    className="h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0"
                                                >
                                                    <ImagePlus className="h-4 w-4" />
                                                </Button>
                                                <div className="flex-1"></div>
                                                <div className="text-xs text-slate-400 font-medium px-2">
                                                    {editor.storage.characterCount?.characters() || 0} Karakter
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0">
                                                    <Maximize className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="relative isolate px-6 py-6 pb-4">
                                            <style jsx global>{`
                                                .tiptap p.is-editor-empty:first-child::before {
                                                    color: #94a3b8;
                                                    content: attr(data-placeholder);
                                                    float: left;
                                                    height: 0;
                                                    pointer-events: none;
                                                }
                                                .tiptap {
                                                    outline: none !important;
                                                }
                                                .tiptap img {
                                                    max-width: 100%;
                                                    height: auto;
                                                    border-radius: 8px;
                                                }
                                                .tiptap ul {
                                                    list-style-type: disc;
                                                    padding-left: 1.5rem;
                                                    margin-top: 0.5rem;
                                                    margin-bottom: 0.5rem;
                                                }
                                                .tiptap ol {
                                                    list-style-type: decimal;
                                                    padding-left: 1.5rem;
                                                    margin-top: 0.5rem;
                                                    margin-bottom: 0.5rem;
                                                }
                                                .tiptap a {
                                                    color: #1A3EB1;
                                                    cursor: pointer;
                                                    text-decoration: underline;
                                                }
                                            `}</style>
                                            <EditorContent editor={editor} />
                                        </div>
                                    </div>
                                    {errors.content && <p className="text-red-500 text-sm font-medium">{errors.content.message}</p>}
                                </div>
                            </div>

                            {/* RIGHT SIDEBAR: Settings Constraints */}
                            <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm">

                                    {/* KATEGORILER */}
                                    <div className="flex flex-col gap-3">
                                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Kategoriler</label>
                                        <div className="flex flex-col gap-2">
                                            <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCategory}
                                                        className={`w-full justify-between font-normal text-slate-600 border-slate-200 hover:bg-slate-50 ${errors.categories ? 'border-red-400' : ''}`}
                                                    >
                                                        {formCategories.length === 0 ? "Kategori ara veya seç..." : `${formCategories.length} kategori seçildi`}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0" align="start">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput
                                                            placeholder="Kategori ara..."
                                                            value={categorySearchQuery}
                                                            onValueChange={setCategorySearchQuery}
                                                        />
                                                        <CommandList>
                                                            {isCategoriesFetching && (
                                                                <div className="p-4 text-sm text-slate-500 overflow-hidden flex items-center justify-center gap-2">
                                                                    <Loader2 className="h-4 w-4 animate-spin text-[#1A3EB1]" />
                                                                    Aranıyor...
                                                                </div>
                                                            )}
                                                            {!isCategoriesFetching && availableCategories.length === 0 && (
                                                                <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
                                                            )}
                                                            <CommandGroup>
                                                                {!isCategoriesFetching && availableCategories.map((category) => (
                                                                    <CommandItem
                                                                        key={category.id}
                                                                        value={category.name}
                                                                        onSelect={() => {
                                                                            if (formCategories.includes(category.id)) {
                                                                                setValue("categories", formCategories.filter(id => id !== category.id), { shouldValidate: true });
                                                                            } else {
                                                                                setValue("categories", [...formCategories, category.id], { shouldValidate: true });
                                                                            }
                                                                            setOpenCategory(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 text-[#1A3EB1] transition-opacity ${formCategories.includes(category.id) ? "opacity-100" : "opacity-0"
                                                                                }`}
                                                                        />
                                                                        {category.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.categories && <p className="text-red-500 text-sm font-medium">{errors.categories.message}</p>}

                                            {formCategories.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {formCategories.map((categoryId) => (
                                                        <Badge key={categoryId} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium px-2 py-1 flex items-center gap-1">
                                                            {getCategoryName(categoryId)}
                                                            <button
                                                                type="button"
                                                                className="ml-0.5 hover:bg-red-100 text-blue-600 hover:text-red-600 rounded-full p-0.5 transition-colors focus:outline-none"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setValue("categories", formCategories.filter(id => id !== categoryId), { shouldValidate: true });
                                                                }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ETIKETLER */}
                                    <div className="flex flex-col gap-3">
                                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Etiketler</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="border border-slate-200 rounded-md bg-white p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#1A3EB1]/20 focus-within:border-[#1A3EB1] transition-all min-h-[42px]">
                                                {formTags.map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium px-2 py-1 flex items-center gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            className="ml-0.5 hover:bg-red-100 text-blue-600 hover:text-red-600 rounded-full p-0.5 transition-colors focus:outline-none"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setValue("tags", formTags.filter(t => t !== tag));
                                                            }}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            const newTag = tagInput.trim();
                                                            if (newTag && !formTags.includes(newTag)) {
                                                                setValue("tags", [...formTags, newTag]);
                                                            }
                                                            setTagInput("");
                                                        }
                                                    }}
                                                    placeholder={formTags.length === 0 ? "Yeni etiket ekle..." : ""}
                                                    className="flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-700 placeholder:text-slate-400"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">Enter tuşu ile yeni etiket ekleyebilirsiniz.</p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
