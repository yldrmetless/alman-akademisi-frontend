"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Loader2, UploadCloud, File, X, Info } from "lucide-react";
import Link from "next/link";
import { StudentSidebar } from "@/components/profile/StudentSidebar";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { useGetMySupportRequestsQuery, useCreateSupportRequestMutation, SupportRequest } from "@/lib/features/users/userApi";
import { useUploadImageMutation } from "@/lib/features/blog/blogApi";
import { SupportTicketRow } from "./SupportTicketRow";

const supportSchema = z.object({
    name: z.string().min(2, "Konu en az 2 karakter olmalıdır."),
    message: z.string().min(10, "Ayrıntılar en az 10 karakter olmalıdır."),
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    image_url: z.string().optional().nullable(),
    image_url_id: z.string().optional().nullable(),
});

// Date Formatter
const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

// Status and Priority Mappings
const statusColorMap: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    closed: "bg-slate-50 text-slate-700 border-slate-200",
};

const statusLabelMap: Record<string, string> = {
    open: "Açık",
    in_progress: "İşlemde",
    closed: "Kapalı",
};

export default function SupportPage() {
    const [isFormVisible, setIsFormVisible] = useState(false);
    
    // API Queries
    const { data: supportResponse, isLoading: isFetchingTickets } = useGetMySupportRequestsQuery({});
    const tickets = supportResponse?.results || [];

    // Mutations
    const [createSupportTicket, { isLoading: isCreatingTicket }] = useCreateSupportRequestMutation();
    const [uploadImage, { isLoading: isUploadingAttachment }] = useUploadImageMutation();

    // Form State
    const [formSubject, setFormSubject] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formPriority, setFormPriority] = useState<"low" | "normal" | "high">("normal");
    
    // Attachment State
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentId, setAttachmentId] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Verify File Type / Size locally before submitting
        const validTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            toast.error("Sadece PNG, JPG veya PDF yükleyebilirsiniz.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dosya boyutu 5MB'ı geçemez.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);
            
            setAttachmentName(file.name);
            const uploadRes = await uploadImage(formData).unwrap();
            
            if (uploadRes?.status === 200 && uploadRes?.results?.length > 0) {
                setAttachmentUrl(uploadRes.results[0].url);
                setAttachmentId(uploadRes.results[0].public_id || "");
                // System logs upload internally; intentionally silent to avoid toast spam
            } else {
                 throw new Error("Geçersiz sunucu yanıtı.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setAttachmentName(null);
            setAttachmentUrl(null);
            setAttachmentId(null);
            toast.error("Dosya yüklenirken bir hata oluştu.");
        }
    };

    const removeAttachment = () => {
        setAttachmentUrl(null);
        setAttachmentId(null);
        setAttachmentName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const supportSubmissionData = supportSchema.parse({
                name: formSubject,
                message: formMessage,
                priority: formPriority,
                image_url: attachmentUrl || null,
                image_url_id: attachmentId || null,
            });

            await createSupportTicket(supportSubmissionData).unwrap();
            
            toast.success("Destek talebiniz alındı, mail kutunuzu kontrol edin.");
            
            // Reset and Close
            setFormSubject("");
            setFormMessage("");
            setFormPriority("normal");
            removeAttachment();
            setIsFormVisible(false);
            
            window.location.reload();

        } catch (error) {
            if (error instanceof z.ZodError) {
                toast.error((error as any).errors[0].message);
            } else {
                console.error("Ticket creation failed:", error);
                const apiError = error as { data?: { detail?: string; message?: string } };
                toast.error(apiError?.data?.detail || apiError?.data?.message || "Destek talebi oluşturulurken bir hata meydana geldi.");
            }
        }
    };

    return (
        <StudentSidebar>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <Link href="/profile" className="hover:text-slate-600 transition-colors">Profil</Link>
                <span>›</span>
                <Link href="/profile/settings/account" className="hover:text-slate-600 transition-colors">Ayarlar</Link>
                <span>›</span>
                <span className="text-slate-700 font-medium">Destek</span>
            </div>

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Destek</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Destek taleplerinizi buradan oluşturabilir ve takip edebilirsiniz.
                        </p>
                    </div>
                    
                    {/* Global Toggle Button */}
                    {!isFormVisible && (
                        <Button 
                            onClick={() => setIsFormVisible(true)}
                            className="rounded-xl px-4 h-10 text-sm font-semibold bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white transition-all"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Bilet Oluştur
                        </Button>
                    )}
                </div>

            {/* List View Container */}
            {!isFormVisible ? (
                <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white text-lg font-bold text-slate-800">
                        <h2>Tüm Biletler</h2>
                    </div>

                    <CardContent className="p-0">
                        {/* Table Header Row */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-6 md:col-span-7">KONUŞMA</div>
                            <div className="col-span-3 md:col-span-3">TARİH</div>
                            <div className="col-span-3 md:col-span-2 text-right">DURUM</div>
                        </div>

                        {/* Loading State */}
                        {isFetchingTickets ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1] mb-4" />
                                <p className="text-sm">Biletler yükleniyor...</p>
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {tickets.map((ticket: SupportRequest) => (
                                    <SupportTicketRow
                                        key={ticket.id}
                                        ticket={ticket}
                                        formatDate={formatDate}
                                        statusColorMap={statusColorMap}
                                        statusLabelMap={statusLabelMap}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                             <div className="flex flex-col items-center justify-center p-16 text-center">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-[#1A3EB1]">
                                    <Info className="h-5 w-5 opacity-70" />
                                </div>
                                <h3 className="font-medium text-slate-900 mb-1">Bilet bulunamadı</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Mevcut veya geçmiş bir destek talebiniz bulunmuyor.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* Ticket Creation Form View */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsFormVisible(false)}
                        className="text-[#1A3EB1] hover:text-[#112d8a] hover:bg-slate-50 px-3 -ml-3 h-10 font-semibold"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Tüm Biletlere Geri Dön
                    </Button>

                    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 font-bold text-slate-800 text-lg">
                            <h2>Bir Destek Talebi Oluşturun</h2>
                        </div>
                        
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <form onSubmit={handleCreateTicket} className="space-y-6">
                            {/* Subject Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900">Konu</label>
                                <Input 
                                    placeholder="Yardıma ihtiyacınız olan konu nedir?"
                                    value={formSubject}
                                    onChange={(e) => setFormSubject(e.target.value)}
                                    className="h-11 bg-white border-slate-200 focus:border-[#1A3EB1] focus:ring-[#1A3EB1] transition-all"
                                    required
                                />
                            </div>

                            {/* Message Details Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900">Bilet Ayrıntıları</label>
                                <Textarea 
                                    className="min-h-[160px] resize-y bg-white border-slate-200 focus:border-[#1A3EB1] focus:ring-[#1A3EB1] transition-all text-sm py-3"
                                    placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                                    value={formMessage}
                                    onChange={(e) => setFormMessage(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Bottom Grid for Attachments and Priority */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Attachment Uploader */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-900">Ek Ekle</label>
                                    
                                    {!attachmentName ? (
                                        <div 
                                            className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${isUploadingAttachment ? 'bg-slate-50 border-slate-200 pointer-events-none' : 'border-slate-200 hover:border-[#1A3EB1] hover:bg-slate-50 cursor-pointer'}`}
                                            onClick={() => !isUploadingAttachment && fileInputRef.current?.click()}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/png, image/jpeg, application/pdf"
                                                className="hidden" 
                                            />
                                            {isUploadingAttachment ? (
                                                <>
                                                    <Loader2 className="h-6 w-6 text-[#1A3EB1] animate-spin mb-2" />
                                                    <p className="text-sm font-medium text-slate-900">Yükleniyor...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-8 w-8 text-slate-400 mb-3" />
                                                    <p className="text-sm font-medium text-slate-900">Dosya yüklemek için tıklayın</p>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG veya PDF (Maks. 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-10 w-10 rounded bg-[#1A3EB1]/10 flex items-center justify-center shrink-0">
                                                    <File className="h-5 w-5 text-[#1A3EB1]" />
                                                </div>
                                                <div className="truncate pr-4">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{attachmentName}</p>
                                                    <p className="text-xs text-emerald-600 font-medium">Başarıyla yüklendi</p>
                                                </div>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={removeAttachment}
                                                className="shrink-0 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Priority Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-900">Öncelik</label>
                                    <select 
                                        className="w-full h-11 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#1A3EB1]/20 focus:border-[#1A3EB1] transition-all"
                                        value={formPriority}
                                        onChange={(e) => setFormPriority(e.target.value as "low" | "normal" | "high")}
                                    >
                                        <option value="low">Düşük</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Yüksek</option>
                                    </select>
                                    <p className="text-xs text-slate-400 italic mt-2">
                                        * Acil durumlar için lütfen Yüksek seçeneğini belirleyin.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Boundary */}
                            <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={isCreatingTicket || isUploadingAttachment}
                                    className="bg-[#1A3EB1] hover:bg-[#112d8a] text-white h-11 px-8 rounded-lg shadow-sm w-full md:w-auto text-sm font-semibold"
                                >
                                    {isCreatingTicket ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Oluşturuluyor...</>
                                    ) : (
                                        "Bilet Oluştur"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            )}
        </div>
        </StudentSidebar>
    );
}
