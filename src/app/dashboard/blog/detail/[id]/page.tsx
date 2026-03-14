"use client";

import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Loader2, ArrowLeft, Eye, Trash2 } from "lucide-react";
import Image from "next/image";
import { useGetBlogPostDetailQuery, useUpdateBlogPostMutation } from "@/lib/features/blog/blogApi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

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

export default function BlogDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    // Public Fetch Execution: RTK mapping directly to blog-post-detail/[id] without Bearer tokens
    const { data: post, isLoading: isPostLoading, isError } = useGetBlogPostDetailQuery(params.id, {
        skip: !params.id
    });

    const [updateBlogPost, { isLoading: isDeleting }] = useUpdateBlogPostMutation();

    const handleDelete = async () => {
        try {
            await updateBlogPost({
                id: params.id,
                body: { is_deleted: true } as any // Type override due to is_deleted not explicitly defined in existing mapped interface payload config but accepted by backend
            }).unwrap();

            toast.success("Blog yazısı başarıyla silindi.");
            router.push('/dashboard/blog');
            router.refresh();
        } catch (error) {
            console.error("Delete Action Error:", error);
            toast.error("Blog silinirken bir hata oluştu.");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-[#FAFBFF] relative flex flex-col items-start lg:flex-row">
            <Sidebar
                firstName="Metehan"
                lastName="Yıldırım"
                username="YÖNETİCİ"
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
                                    className="h-10 w-10 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Blog Detayı</h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-2 h-4 w-4" />
                                            )}
                                            {isDeleting ? "Siliniyor..." : "Sil"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bu gönderiyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bu işlem geri alınamaz. Bu blog yazısı kalıcı olarak silinecektir.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                    e.preventDefault();
                                                    handleDelete();
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Evet, Sil
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button
                                    className="cursor-pointer bg-[#1A3EB1] hover:bg-[#1E3BB3]/90 text-white font-medium"
                                    onClick={() => router.push(`/dashboard/blog/edit/${params.id}`)}
                                >
                                    Düzenle
                                </Button>
                            </div>
                        </div>

                        {isPostLoading ? (
                            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
                                <div className="flex flex-col items-center gap-4 text-slate-500">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
                                    <p className="font-medium animate-pulse">Blog detayı yükleniyor...</p>
                                </div>
                            </div>
                        ) : isError || !post ? (
                            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                    <p className="font-semibold text-lg text-slate-800">Blog bulunamadı</p>
                                    <p className="text-sm">İstenilen blog yazısı silinmiş veya erişilemiyor olabilir.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => router.push('/dashboard/blog')}
                                    >
                                        Listeye Dön
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                                {/* LEFT COLUMN */}
                                <div className="flex-1 flex flex-col gap-6 w-full">
                                    {/* Cover Image */}
                                    <div className="relative w-full aspect-video sm:h-[400px] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-sm">
                                        {post.image_url ? (
                                            <Image
                                                src={post.image_url}
                                                alt={post.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 1024px) 100vw, 800px"
                                                priority
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                Görsel Yok
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Block */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm flex flex-col gap-6">
                                        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                <Eye className="h-4 w-4" />
                                                {post.view_count || 0} okunma
                                            </div>
                                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
                                                {post.title}
                                            </h1>
                                        </div>

                                        {/* Rich Text Injection */}
                                        <div
                                            className="prose prose-slate prose-blue max-w-none text-slate-700 w-full"
                                            dangerouslySetInnerHTML={{ __html: post.content }}
                                        />
                                    </div>
                                </div>

                                {/* RIGHT SIDEBAR */}
                                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-8 shadow-sm text-sm sticky top-24">

                                        {/* Author */}
                                        <div className="flex flex-col gap-4">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Yazar</span>
                                            <div className="flex items-center gap-4">
                                                {/* Hidden avatar explicitly instructed by user, maintaining structural space if needed or just showing text */}
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-base">{post.author_first_name} {post.author_last_name}</span>
                                                    <span className="font-medium text-slate-500">{post.author_user_type || 'Admin'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Tarih</span>
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400"><path d="M4.5 2C4.77614 2 5 2.22386 5 2.5V3H10V2.5C10 2.22386 10.2239 2 10.5 2C10.7761 2 11 2.22386 11 2.5V3H12.5C13.3284 3 14 3.67157 14 4.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V4.5C1 3.67157 1.67157 3 2.5 3H4V2.5C4 2.22386 4.22386 2 4.5 2ZM2.5 4C2.22386 4 2 4.22386 2 4.5V6H13V4.5C13 4.22386 12.7761 4 12.5 4H2.5ZM2 7.5V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V7.5H2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                                {formatDate(post.created_at)}
                                            </div>
                                        </div>

                                        {/* Categories */}
                                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Kategoriler</span>
                                            <div className="flex flex-wrap gap-2">
                                                {post.categories && post.categories.length > 0 ? (
                                                    post.categories.map((cat, idx) => (
                                                        <Badge
                                                            key={cat.id || idx}
                                                            variant="outline"
                                                            className={`${getCategoryColor(cat.name)} font-semibold px-2.5 py-1`}
                                                        >
                                                            {cat.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic">Kategori yok</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Etiketler</span>
                                            <div className="flex flex-wrap gap-2">
                                                {post.tags && post.tags.length > 0 ? (
                                                    post.tags.map((tag, idx) => (
                                                        <div key={idx} className="bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors border border-slate-200 font-medium px-3 py-1 rounded-full text-xs">
                                                            #{tag.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 italic">Etiket yok</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 pb-2">
                                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Durum</span>
                                            <div className="flex">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-200 bg-green-50 text-green-700 font-semibold text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    Yayınlandı
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
