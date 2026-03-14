"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import Image from "next/image";
import toast from "react-hot-toast";
import { useGetCategoriesQuery, useUploadImageMutation, useCreateBlogPostMutation } from "@/lib/features/blog/blogApi";
import {
    Loader2,
    ArrowLeft,
    CloudUpload,
    Bold,
    Italic,
    List,
    ListOrdered,
    Link as LinkIcon,
    ImageIcon,
    Maximize,
    Calendar,
    X,
    ImagePlus,
    Check,
    ChevronsUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';

export default function NewBlogPostPage() {
    const router = useRouter();
    const { isAuthorized, isLoading: isAuthLoading, profile, token } = useAuthGuard("admin");

    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [uploadImageMutation] = useUploadImageMutation();
    const [createBlogPostMutation] = useCreateBlogPostMutation();

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [coverImageId, setCoverImageId] = useState<string | null>(null);

    const [selectedCategories, setSelectedCategories] = useState<{ id: string, name: string }[]>([]);
    const [openCategory, setOpenCategory] = useState(false);

    // Category Web Search Query States & Debounce Logic
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCategorySearch(categorySearchQuery);
        }, 300); // 300ms smoothing delay
        return () => clearTimeout(handler);
    }, [categorySearchQuery]);

    const { data: categoriesData, isFetching: isCategoriesFetching } = useGetCategoriesQuery(
        debouncedCategorySearch ? { name: debouncedCategorySearch } : undefined,
        {
            skip: !isAuthorized || !token, // Only fetch if we are verified admins
        }
    );

    const availableCategories = categoriesData?.results || [];

    const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        if (!catId) return;

        // Parse IDs safely handling RTK numerical/string schemas interchangeably
        const category = availableCategories.find(c => c.id.toString() === catId);
        if (category && !selectedCategories.some(c => c.id.toString() === catId)) {
            setSelectedCategories([...selectedCategories, { id: category.id.toString(), name: category.name }]);
        }

        e.target.value = "";
    };

    const removeCategory = (idToRemove: string) => {
        setSelectedCategories(selectedCategories.filter(c => c.id !== idToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);

            const data = await uploadImageMutation(formData).unwrap();

            if (data.results && data.results.length > 0) {
                const uploadedImage = data.results[0];
                setPreviewUrl(uploadedImage.url);
                setCoverImageId(uploadedImage.public_id);
                toast.success("Kapak görseli başarıyla yüklendi.");
            } else {
                throw new Error("Sunucudan geçersiz yanıt alındı.");
            }
        } catch (error: any) {
            toast.error(error.data?.error || "Kimlik bilgileri sağlanmadı veya görsel yüklenemedi.");
            console.error("Upload Error:", error);
        } finally {
            setUploadingImage(false);
        }

        e.target.value = '';
    };

    const removeCoverImage = () => {
        setPreviewUrl(null);
        setCoverImageId(null);
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error("Lütfen bir başlık girin.");
            return;
        }

        const editorHtml = editor?.getHTML() || "";
        // Basic check if editor is empty besides paragraph tags
        if (!editorHtml || editorHtml === "<p></p>" || editorHtml === "<p></p>" || editorHtml.trim().length === 0) {
            toast.error("Lütfen blog içeriği girin.");
            return;
        }

        if (!previewUrl || !coverImageId) {
            toast.error("Lütfen bir kapak görseli yükleyin.");
            return;
        }

        try {
            setIsSubmitting(true);

            const categoryIds = selectedCategories.map(c => parseInt(c.id, 10));

            const payload = {
                title: title.trim(),
                content: editorHtml,
                categories: categoryIds,
                tags: tags,
                image_url: previewUrl,
                image_public_id: coverImageId
            };

            await createBlogPostMutation(payload).unwrap();

            toast.success("Blog yazısı başarıyla oluşturuldu.");
            router.push('/dashboard/blog');
        } catch (error: any) {
            const errorData = error.data;
            console.error("Server Error Response:", errorData);

            // Try extracting specific serializer errors gracefully
            if (errorData && typeof errorData === 'object') {
                for (const [key, msgs] of Object.entries(errorData)) {
                    if (Array.isArray(msgs) && msgs.length > 0) {
                        toast.error(`${key}: ${msgs[0]}`);
                        return; // Stop after first error
                    }
                }
                if (errorData.detail) {
                    toast.error(errorData.detail);
                    return;
                }
            }
            toast.error("Kimlik bilgileri sağlanmadı veya bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Bir şeyler yazmaya başla...',
            }),
            LinkExtension.configure({
                openOnClick: false,
                autolink: true,
            }),
            ImageExtension.configure({
                inline: true,
            }),
            CharacterCount,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'w-full min-h-[400px] p-6 text-slate-700 bg-white border-none outline-none focus:ring-0 leading-relaxed font-sans prose max-w-none',
            },
        },
    });

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

    // Fullscreen Layout Protection
    if (isAuthLoading || !token || !isAuthorized || !profile) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-[#FAFBFF] space-y-6">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E3BB3]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFBFF] relative flex flex-col items-start lg:flex-row">
            <Sidebar
                firstName={profile.first_name || ""}
                lastName={profile.last_name || ""}
                username={profile.username || ""}
            />

            <main className="w-full lg:ml-72 transition-all duration-300 min-h-screen flex flex-col">
                <div className="w-full px-4 py-8 pt-[4.5rem] lg:pt-8 flex flex-col flex-1">
                    <div className="max-w-6xl mx-auto flex flex-col gap-8 w-full flex-1">

                        {/* Header Block */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push('/dashboard/blog')}
                                    className="h-10 w-10 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Yeni Blog Yazısı Ekle</h1>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none h-11 px-6 font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Vazgeç
                                </Button>
                                <Button
                                    className="flex-1 sm:flex-none h-11 px-8 bg-[#1A3EB1] hover:bg-[#1E3BB3]/90 text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                                    onClick={handlePublish}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Yayınlanıyor...
                                        </>
                                    ) : "Yayınla"}
                                </Button>
                            </div>
                        </div>

                        {/* Two Column Layout Wrapper */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">

                            {/* LEFT COLUMN: Editor Map */}
                            <div className="flex-1 flex flex-col gap-6 w-full">

                                {/* Image Dropzone */}
                                <div className="relative w-full h-[300px] sm:h-[400px] border-2 border-dashed border-slate-300 hover:border-[#1A3EB1]/50 bg-slate-50 hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center transition-all group overflow-hidden cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={uploadingImage}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                    />
                                    {uploadingImage ? (
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
                                            <h3 className="text-lg font-bold text-slate-700 mb-1">Kapak Görseli Yükle</h3>
                                            <p className="text-sm font-medium text-slate-400">Önerilen boyut: 1600x900px</p>
                                        </div>
                                    )}
                                </div>

                                {/* Title Editor Container */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Başlık</p>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Yazı Başlığı..."
                                            className="w-full text-3xl sm:text-4xl font-bold text-slate-800 placeholder:text-slate-300 bg-transparent border-none outline-none focus:ring-0 p-0"
                                        />
                                    </div>

                                    {/* Rich Text Toolbar Matrix */}
                                    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden mt-2">
                                        {editor && (
                                            <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto sticky top-0 z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('bold') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <Bold className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('italic') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <Italic className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <List className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <ListOrdered className="h-4 w-4" />
                                                </Button>
                                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={setLink}
                                                    className={`h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0 ${editor.isActive('link') ? 'bg-slate-200 text-slate-800' : ''}`}
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 shrink-0">
                                                    <Maximize className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="relative isolate px-6 py-6 pb-4">
                                            {/* Style string mapping placeholder rendering logic */}
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
                                                        className="w-full justify-between font-normal text-slate-600 border-slate-200 hover:bg-slate-50"
                                                    >
                                                        {selectedCategories.length === 0 ? "Kategori ara veya seç..." : `${selectedCategories.length} kategori seçildi`}
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
                                                                            const isSelected = selectedCategories.some(c => c.id.toString() === category.id.toString());
                                                                            if (!isSelected) {
                                                                                setSelectedCategories([...selectedCategories, { id: category.id.toString(), name: category.name }]);
                                                                            } else {
                                                                                setSelectedCategories(selectedCategories.filter(c => c.id.toString() !== category.id.toString()));
                                                                            }
                                                                            setOpenCategory(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 text-[#1A3EB1] transition-opacity ${selectedCategories.some(c => c.id.toString() === category.id.toString()) ? "opacity-100" : "opacity-0"
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

                                            {selectedCategories.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {selectedCategories.map((category) => (
                                                        <Badge key={category.id} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium px-2 py-1 flex items-center gap-1">
                                                            {category.name}
                                                            <button
                                                                type="button"
                                                                className="ml-0.5 hover:bg-red-100 text-blue-600 hover:text-red-600 rounded-full p-0.5 transition-colors focus:outline-none"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    removeCategory(category.id);
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
                                                {tags.map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 font-medium px-2 py-1 flex items-center gap-1">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            className="ml-0.5 hover:bg-red-100 text-blue-600 hover:text-red-600 rounded-full p-0.5 transition-colors focus:outline-none"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeTag(tag);
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
                                                    onKeyDown={handleTagKeyDown}
                                                    placeholder={tags.length === 0 ? "Yeni etiket ekle..." : ""}
                                                    className="flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-700 placeholder:text-slate-400"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">Enter tuşu ile yeni etiket ekleyebilirsiniz.</p>
                                        </div>
                                    </div>

                                    {/* AUTHOR EXCLUDED AS REQUESTED */}

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
