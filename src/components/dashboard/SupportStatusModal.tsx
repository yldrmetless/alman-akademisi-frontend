import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { SupportRequest, useUpdateSupportStatusMutation } from "@/lib/features/users/userApi";

interface SupportStatusModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    supportDetail: SupportRequest | null;
}

const statusColorMap: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    closed: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
};

const statusLabelMap: Record<string, string> = {
    open: "Açık",
    in_progress: "İşlemde",
    closed: "Kapalı",
};

export function SupportStatusModal({ isOpen, setIsOpen, supportDetail }: SupportStatusModalProps) {
    const [statusOption, setStatusOption] = useState<"in_progress" | "closed">("in_progress");
    const [updateStatus, { isLoading: isStatusPatching }] = useUpdateSupportStatusMutation();

    // Reset status select option whenever the modal opens or a new support detail is injected.
    useEffect(() => {
        if (supportDetail) {
            // Default to "in_progress" unless it's already closed.
            setStatusOption(supportDetail.status === "closed" ? "closed" : "in_progress");
        }
    }, [supportDetail, isOpen]);

    if (!supportDetail) return null;

    const handleUpdate = async () => {
        try {
            const patchResponse = await updateStatus({ id: supportDetail.id, status: statusOption }).unwrap();
            
            if (patchResponse && patchResponse.new_status) {
                toast.success("Talep durumu başarıyla güncellendi.");
                setIsOpen(false);
                // Allow modal to close visually before reloading list states completely
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            } else {
                // If API didn't return expected structure but still 200 OK
                toast.error("Talep durumu güncellenirken beklenmedik bir yanıt alındı.");
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Kayıt bulunamadı veya sunucu hatası oluştu.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
                {/* Header Strip */}
                <div className="bg-[#1A3EB1] px-6 py-4">
                    <DialogTitle className="text-xl font-bold text-white tracking-tight">
                        Destek Talebi Detayı (ID: #{supportDetail.id})
                    </DialogTitle>
                </div>

                <div className="p-6 space-y-6">
                    {/* User and Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kullanıcı</h3>
                            <div className="text-sm font-medium text-slate-900">
                                {supportDetail.first_name} {supportDetail.last_name}
                            </div>
                            <div className="text-xs text-slate-500">{supportDetail.email}</div>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mevcut Durum</h3>
                            <Badge
                                variant="secondary"
                                className={`font-medium px-2.5 py-0.5 ${statusColorMap[supportDetail.status] || statusColorMap.closed}`}
                            >
                                {statusLabelMap[supportDetail.status] || "Bilinmiyor"}
                            </Badge>
                        </div>
                    </div>

                    {/* Message Area */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mesaj</h3>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {supportDetail.message}
                        </div>
                    </div>

                    {/* Media Attachments */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ekran Görüntüsü</h3>
                        {supportDetail.image_url ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-[#1A3EB1]/30 group">
                                        <Image
                                            src={supportDetail.image_url}
                                            alt="Ekran Görüntüsü"
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                </DialogTrigger>
                                {/* Nested Lightbox Viewer specific to the Modal detail context */}
                                <DialogContent className="max-w-4xl w-full p-2 bg-transparent border-none shadow-none flex flex-col justify-center items-center">
                                    <DialogTitle className="sr-only">Ekran Görüntüsü Tam Boyut</DialogTitle>
                                    <div className="relative w-full h-[85vh] rounded-md overflow-hidden bg-white/5 backdrop-blur-sm">
                                        <Image
                                            src={supportDetail.image_url}
                                            alt="Ekran Görüntüsü Tam Boyut"
                                            fill
                                            className="object-contain"
                                            unoptimized
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <div className="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 select-none">
                                <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                                <span className="text-[10px] font-semibold tracking-tighter uppercase">Kayıt Yok</span>
                            </div>
                        )}
                    </div>

                    {/* Status Update Action Strip */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="text-sm font-medium text-slate-900 block mb-2">
                            Durumu Güncelle
                        </label>
                        <div className="flex gap-3">
                            <select
                                className="flex-1 h-10 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-[#1A3EB1] focus:border-transparent outline-none transition-all"
                                value={statusOption}
                                onChange={(e) => setStatusOption(e.target.value as "in_progress" | "closed")}
                            >
                                <option value="in_progress">İşleniyor</option>
                                <option value="closed">Çözüldü</option>
                            </select>

                            <Button
                                onClick={handleUpdate}
                                disabled={isStatusPatching}
                                className="bg-[#1A3EB1] hover:bg-[#112d8a] text-white px-6 h-10 w-32 shadow-sm"
                            >
                                {isStatusPatching ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                ) : (
                                    "Güncelle"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
