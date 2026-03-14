"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2, Plus, Search, Trash2, Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { useLazyGetBlogPostsQuery, useUpdateBlogPostMutation, useGetCategoriesQuery } from "@/lib/features/blog/blogApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

// Native resilient Image component wrapping Next.js tracking errors safely
const BlogImage = ({ src, alt }: { src: string; alt: string }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400">
                <Avatar className="h-10 w-10 bg-slate-200">
                    <AvatarFallback className="bg-slate-200 text-slate-500 font-bold">
                        {alt ? alt.charAt(0).toUpperCase() : "B"}
                    </AvatarFallback>
                </Avatar>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100px, 100px"
            onError={() => setError(true)}
        />
    );
};

const getCategoryColor = (name: string) => {
    const colors = [
        "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
        "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
        "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
        "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
        "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-100",
        "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100",
        "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const CategoryBadge = ({ categories }: { categories: { name: string }[] }) => {
    if (!categories || categories.length === 0) {
        return <span className="text-slate-400 font-medium text-sm">-</span>;
    }

    const firstCategory = categories[0].name;
    const colorClasses = getCategoryColor(firstCategory);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${colorClasses} font-semibold px-2.5 py-0.5 whitespace-nowrap`}>
                {firstCategory}
            </Badge>
            {categories.length > 1 && (
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 font-bold px-2.5 py-0.5 whitespace-nowrap">
                    +{categories.length - 1}
                </Badge>
            )}
        </div>
    );
};

export default function BlogManagementPage() {
    const router = useRouter();
    const { isAuthorized, isLoading: isAuthLoading, profile, token } = useAuthGuard("admin");

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTitle, setDebouncedTitle] = useState("");

    const [triggerGetPosts, { data, isLoading: isDataLoading, isFetching }] = useLazyGetBlogPostsQuery();
    const [updateBlogPost, { isLoading: isDeleting }] = useUpdateBlogPostMutation();
    const { data: categoriesData } = useGetCategoriesQuery();
    const categories = categoriesData?.results || [];

    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    // 400ms Debounce effect on the Title Search string protecting the API
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTitle(searchTerm);
            setPage(1); // Reset pagination naturally upon any new search query execution
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthorized && token) {
            triggerGetPosts({ page, title: debouncedTitle, category: selectedCategoryName });
        }
    }, [isAuthorized, token, page, debouncedTitle, selectedCategoryName, triggerGetPosts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Manual submission is structurally bypassed by the 400ms live debounce hook above, 
        // but the form preventDefault protects standard HTML browser refresh triggers on "Enter".
    };

    const handleDelete = async () => {
        if (!selectedPostId) return;
        try {
            await updateBlogPost({
                id: selectedPostId.toString(),
                body: { is_deleted: true } as any
            }).unwrap();

            toast.success("Blog yazısı silindi");
            setIsConfirmOpen(false);
            setSelectedPostId(null);

            // Fallback hard refresh against aggressive Next.js App Router client caches locking the table query
            window.location.reload();
        } catch (error) {
            console.error("Delete Action Error:", error);
            toast.error("Blog silinirken bir hata oluştu.");
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const renderDesktopSkeletons = () => {
        return Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`desktop-skeleton-${i}`}>
                <TableCell colSpan={5}>
                    <div className="flex items-center gap-4 animate-pulse">
                        <div className="h-12 w-16 bg-slate-200 rounded-md shrink-0"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    </div>
                </TableCell>
            </TableRow>
        ));
    };

    const renderMobileSkeletons = () => {
        return Array.from({ length: 3 }).map((_, i) => (
            <div key={`mobile-skeleton-${i}`} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-pulse flex gap-4">
                <div className="h-20 w-24 bg-slate-200 rounded-md shrink-0"></div>
                <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
        ));
    };

    const showLoading = isDataLoading || isFetching;

    return (
        <div className="min-h-screen bg-[#FAFBFF] relative flex flex-col items-start lg:flex-row">
            <Sidebar
                firstName={profile.first_name || ""}
                lastName={profile.last_name || ""}
                username={profile.username || ""}
            />

            <main className="w-full lg:ml-72 transition-all duration-300 min-h-screen flex flex-col">
                <div className="w-full px-4 py-8 pt-[4.5rem] lg:pt-8 flex flex-col flex-1">
                    <div className="max-w-6xl mx-auto flex flex-col gap-6 w-full flex-1">
                        {/* Header Block mapping aligned with Cards */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Blog Yönetimi</h1>
                                <p className="text-sm sm:text-base text-slate-500 font-medium">Platformdaki tüm blog yazılarını yönetin.</p>
                            </div>
                            <div className="w-full sm:w-auto">
                                <Button
                                    className="bg-[#1A3EB1] cursor-pointer hover:bg-[#1E3BB3]/90 text-white gap-2 font-medium w-full sm:w-auto"
                                    onClick={() => router.push("/dashboard/blog/new-blog")}
                                >
                                    <Plus className="h-4 w-4" />
                                    Yeni Yazı Ekle
                                </Button>
                            </div>
                        </div>

                        {/* Responsive Utility Bar (Filters) */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <form onSubmit={handleSearch} className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Yazı başlığı ara"
                                    className="pl-9 bg-white border-slate-200 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </form>
                            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isCategoryOpen}
                                        className="w-full sm:w-[240px] justify-between bg-white border-slate-200 text-sm font-normal h-10 px-3 cursor-pointer"
                                    >
                                        <span className="truncate">
                                            {selectedCategoryName || "Tüm Kategoriler"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full sm:w-[240px] p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Kategori ara..." />
                                        <CommandList>
                                            <CommandEmpty>Kategori bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    onSelect={() => {
                                                        setSelectedCategoryName("");
                                                        setIsCategoryOpen(false);
                                                        setPage(1);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCategoryName === "" ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    Tüm Kategoriler
                                                </CommandItem>
                                                {categories.map((category) => (
                                                    <CommandItem
                                                        key={category.id}
                                                        value={category.name}
                                                        onSelect={() => {
                                                            setSelectedCategoryName(category.name);
                                                            setIsCategoryOpen(false);
                                                            setPage(1);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCategoryName === category.name ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {category.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* DESKTOP TABLE (Hidden heavily natively below lg) */}
                        <div className="hidden lg:flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-600 w-[400px]">YAZI</TableHead>
                                            <TableHead className="font-semibold text-slate-600">KATEGORİ</TableHead>
                                            <TableHead className="font-semibold text-slate-600">YAZAR</TableHead>
                                            <TableHead className="font-semibold text-slate-600">YAYIN TARİHİ</TableHead>
                                            <TableHead className="font-semibold text-slate-600 text-right">İŞLEMLER</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {showLoading ? renderDesktopSkeletons() : !data || data.count === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-48 text-center text-slate-500 font-medium">
                                                    Henüz blog yazısı bulunmuyor
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.results.map((post) => (
                                                <TableRow key={post.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/blog/detail/${post.id}`)}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-4 p-1">
                                                            <div className="relative h-12 w-16 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                                                                <BlogImage src={post.image_url} alt={post.title} />
                                                            </div>
                                                            <span className="text-slate-800 font-semibold line-clamp-2">{post.title}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <CategoryBadge categories={post.categories} />
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 font-medium">
                                                        {post.author_first_name} {post.author_last_name}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 font-medium">
                                                        {formatDate(post.created_at)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={isDeleting && selectedPostId === post.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedPostId(post.id);
                                                                    setIsConfirmOpen(true);
                                                                }}
                                                                className="h-8 w-8 cursor-pointer text-slate-400 hover:text-red-600 hover:bg-red-50/50 transition-colors"
                                                            >
                                                                {isDeleting && selectedPostId === post.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* MOBILE CARD VIEW (Hidden massively natively starting at lg) */}
                        <div className="lg:hidden flex flex-col gap-4 w-full">
                            {showLoading ? renderMobileSkeletons() : !data || data.count === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-500 font-medium">
                                    Henüz blog yazısı bulunmuyor
                                </div>
                            ) : (
                                data.results.map((post) => (
                                    <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                        <div className="flex gap-4">
                                            <div className="relative h-20 w-24 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                                                <BlogImage src={post.image_url} alt={post.title} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 text-sm leading-tight">{post.title}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <CategoryBadge categories={post.categories} />
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500">{post.author_first_name} {post.author_last_name} • {formatDate(post.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-1 sm:flex-col sm:justify-start pt-3 border-t border-slate-100 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isDeleting && selectedPostId === post.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPostId(post.id);
                                                    setIsConfirmOpen(true);
                                                }}
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50/50"
                                            >
                                                {isDeleting && selectedPostId === post.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Context mapped universally safely away from the canvas origin */}
                        <div className="w-full">
                            {data && data.count > 0 && (
                                <div className="rounded-xl lg:rounded-t-none lg:rounded-b-xl border border-slate-200 lg:border-t-0 p-4 flex flex-col sm:flex-row items-center justify-between bg-white text-sm text-slate-500 shadow-sm gap-4 transition-all">
                                    <div className="text-center sm:text-left">
                                        Toplam <span className="font-bold text-[#1A3EB1]">{data.count}</span> kayıt
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={!data.previous || isFetching}
                                            className="h-8 px-4 font-medium transition-colors hover:text-[#1A3EB1]"
                                        >
                                            Önceki
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={!data.next || isFetching}
                                            className="h-8 px-4 font-medium transition-colors hover:text-[#1A3EB1]"
                                        >
                                            Sonraki
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Bu gönderiyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Seçtiğiniz blog yazısı arşive taşınacak ve listeden kaldırılacaktır.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting} onClick={(e) => e.stopPropagation()}>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    "Evet, Sil"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
