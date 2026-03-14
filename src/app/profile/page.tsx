"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ShoppingBag,
    Award,
    Box,
} from "lucide-react";
import { useGetProfileQuery, useGetStudentDashboardQuery } from "@/lib/features/auth/authApi";
import { StudentSidebar } from "@/components/profile/StudentSidebar";
import toast from "react-hot-toast";

export default function StudentProfilePage() {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setAccessToken(localStorage.getItem("access"));
        }
    }, []);

    const { data: profileData } = useGetProfileQuery(undefined, {
        skip: !accessToken,
    });

    const { data: studentStats, isLoading: isStatsLoading } = useGetStudentDashboardQuery(undefined, {
        skip: !accessToken,
    });

    // Contact form state
    const [contactFullName, setContactFullName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactMessage, setContactMessage] = useState("");

    // Prefill contact form with user data
    useEffect(() => {
        if (profileData) {
            const displayFullName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim();
            setContactFullName(displayFullName);
            setContactEmail(profileData.email || "");
        }
    }, [profileData]);

    const handleContactSubmit = () => {
        if (!contactFullName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
            toast.error("Lütfen tüm alanları doldurun.");
            return;
        }
        toast.success("Mesajınız başarıyla gönderildi!");
        setContactMessage("");
    };

    const displayUsername = profileData?.username || "kullanıcı";

    const statCardItems = [
        {
            label: "SON SİPARİŞLER",
            value: studentStats?.total_orders_count ?? 0,
            icon: ShoppingBag,
            iconBgColor: "bg-blue-50",
            iconTextColor: "text-blue-600",
        },
        {
            label: "AKTİF ÜRÜNLER",
            value: studentStats?.total_products_count ?? 0,
            icon: Box,
            iconBgColor: "bg-emerald-50",
            iconTextColor: "text-emerald-600",
        },
        {
            label: "TAMAMLANAN KURSLAR",
            value: studentStats?.completed_course_count ?? 0,
            icon: Award,
            iconBgColor: "bg-indigo-50",
            iconTextColor: "text-indigo-600",
        },
    ];

    return (
        <StudentSidebar>
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A3EB1]">
                    Merhaba {displayUsername}, hesabına hoş geldin! 👋
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Eğitim yolculuğuna kaldığın yerden devam edebilirsin.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isStatsLoading ? (
                    <div className="col-span-3 flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1A3EB1]" />
                    </div>
                ) : (
                    statCardItems.map((statItem) => (
                        <Card key={statItem.label} className="rounded-2xl border-slate-100 shadow-sm">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={`p-3 ${statItem.iconBgColor} ${statItem.iconTextColor} rounded-xl`}>
                                    <statItem.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">{statItem.label}</p>
                                    <h3 className="text-2xl font-extrabold text-slate-800">{statItem.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Contact Form */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-800">Bize Ulaşın</CardTitle>
                    <p className="text-sm text-slate-400">
                        Herhangi bir sorunuz mu var? Formu doldurun, size en kısa sürede dönüş yapalım.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="contactFullName" className="text-sm font-semibold text-slate-700">
                                Ad Soyad
                            </Label>
                            <Input
                                id="contactFullName"
                                type="text"
                                value={contactFullName}
                                onChange={(e) => setContactFullName(e.target.value)}
                                placeholder="John Doe"
                                className="bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail" className="text-sm font-semibold text-slate-700">
                                E-posta Adresi
                            </Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="bg-white border-slate-200 focus-visible:ring-[#1A3EB1]"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactMessage" className="text-sm font-semibold text-slate-700">
                            Mesajınız
                        </Label>
                        <textarea
                            id="contactMessage"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Size nasıl yardımcı olabiliriz?"
                            rows={4}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 resize-none"
                        />
                    </div>
                    <Button
                        onClick={handleContactSubmit}
                        className="bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white px-8 h-11 rounded-lg font-medium transition-all"
                    >
                        Mesajı Gönder
                    </Button>
                </CardContent>
            </Card>
        </StudentSidebar>
    );
}
