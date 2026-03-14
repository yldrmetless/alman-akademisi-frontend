"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Pencil, Eye, EyeOff } from "lucide-react";
import { StudentSidebar } from "@/components/profile/StudentSidebar";
import { useGetProfileQuery, useEditProfileMutation } from "@/lib/features/auth/authApi";
import { useUploadImageMutation } from "@/lib/features/blog/blogApi";
import toast from "react-hot-toast";

export default function AccountSettingsPage() {
    const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery();
    const [editProfile, { isLoading: isUpdatingProfile }] = useEditProfileMutation();
    const [uploadImage] = useUploadImageMutation();

    // Unified Profile form state
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        phone: "",
        avatar_url: "",
        avatar_url_id: "",
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Avatar state
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Contact form state
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactMessage, setContactMessage] = useState("");
    const [isContactSubmitting, setIsContactSubmitting] = useState(false);

    // Populate form fields from profile API
    useEffect(() => {
        if (profileData) {
            setFormData({
                first_name: profileData.first_name || "",
                last_name: profileData.last_name || "",
                email: profileData.email || "",
                username: profileData.username || "",
                phone: profileData.phone || "",
                avatar_url: profileData.avatar_url || "",
                avatar_url_id: profileData.avatar_url_id || "",
            });
            if (profileData.avatar_url) {
                setAvatarPreviewUrl(profileData.avatar_url);
            }
        }
    }, [profileData]);

    // Avatar upload handler
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type & size
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Yalnızca JPG, PNG veya WebP formatı desteklenmektedir.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Dosya boyutu 2MB'dan küçük olmalıdır.");
            return;
        }

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setAvatarPreviewUrl(localPreview);

        // Upload to Cloudinary
        setIsUploadingAvatar(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);

            const uploadRes = await uploadImage(uploadFormData).unwrap();
            // Sync avatar state with Cloudinary response
            setFormData((prev) => ({
                ...prev,
                avatar_url: uploadRes.results[0].url,
                avatar_url_id: uploadRes.results[0].public_id,
            }));
            toast.success("Fotoğraf yüklendi.");
        } catch {
            toast.error("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
            // Revert preview to previous avatar
            setAvatarPreviewUrl(profileData?.avatar_url || "");
        } finally {
            setIsUploadingAvatar(false);
            // Cleanup object URL
            URL.revokeObjectURL(localPreview);
        }

        // Reset input so the same file can be re-selected
        e.target.value = "";
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Password validation
        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                toast.error("Yeni şifre belirlemek için mevcut şifrenizi giriniz.");
                return;
            }
            if (newPassword.length < 8) {
                toast.error("Yeni şifre en az 8 karakter olmalıdır.");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("Yeni şifreler eşleşmiyor.");
                return;
            }
        }

        // Build comprehensive payload — ALL fields always included
        const profileSubmissionBody: {
            first_name: string;
            last_name: string;
            email: string;
            username: string;
            phone: string;
            avatar_url: string;
            avatar_url_id: string;
            current_password?: string;
            new_password?: string;
        } = {
            ...formData,
        };

        // Include password fields only if changing
        if (currentPassword && newPassword) {
            profileSubmissionBody.current_password = currentPassword;
            profileSubmissionBody.new_password = newPassword;
        }

        try {
            const response = await editProfile(profileSubmissionBody).unwrap();
            if (response.status === 200) {
                if (response.message) {
                    toast.success(response.message);
                } else {
                    toast.success("Profil başarıyla güncellendi.");
                }
                // Clear password fields on success
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else if (response.message) {
                 toast.success(response.message);
            }
        } catch (error: unknown) {
            const apiError = error as { data?: { detail?: string; message?: string } };
            toast.error(apiError?.data?.detail || apiError?.data?.message || "Profil güncellenemedi.");
        }
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
            toast.error("Lütfen tüm alanları doldurunuz.");
            return;
        }

        setIsContactSubmitting(true);
        try {
            // TODO: Integrate actual contact form API
            console.log("Contact form:", { name: contactName, email: contactEmail, message: contactMessage });
            toast.success("Mesajınız başarıyla gönderildi.");
            setContactName("");
            setContactEmail("");
            setContactMessage("");
        } catch {
            toast.error("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setIsContactSubmitting(false);
        }
    };

    const userInitials = `${(profileData?.first_name || "U").charAt(0)}${(profileData?.last_name || "").charAt(0)}`.toUpperCase();

    return (
        <StudentSidebar>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/profile" className="hover:text-slate-600 transition-colors">Profil</Link>
                <span>›</span>
                <Link href="/profile/settings/account" className="hover:text-slate-600 transition-colors">Ayarlar</Link>
                <span>›</span>
                <span className="text-slate-700 font-medium">Hesap Ayarları</span>
            </div>

            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Ayarlar</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.
                </p>
            </div>

            {/* ===================== PROFILE SETTINGS CARD ===================== */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Profil Ayarları</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Kişisel bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.
                        </p>
                    </div>

                    {/* Avatar Section */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                                aria-label="Profil fotoğrafı seç"
                            />

                            {avatarPreviewUrl ? (
                                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100">
                                    <Image
                                        src={avatarPreviewUrl}
                                        alt="Avatar"
                                        width={64}
                                        height={64}
                                        className="object-cover h-full w-full"
                                    />
                                </div>
                            ) : (
                                <Avatar className="h-16 w-16 border-2 border-slate-200 bg-slate-100 text-slate-500">
                                    <AvatarFallback className="bg-transparent text-lg font-bold">
                                        {isProfileLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : userInitials}
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={isUploadingAvatar}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#1A3EB1] text-white flex items-center justify-center shadow-md hover:bg-[#1A3EB1]/90 transition-colors disabled:opacity-50"
                                aria-label="Fotoğraf düzenle"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Pencil className="h-3 w-3" />
                                )}
                            </button>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Profil Fotoğrafı</p>
                            <p className="text-xs text-slate-400">JPG veya PNG formatında, max 2MB.</p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                        {/* First Name + Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Adınız
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    placeholder="Örn: Ahmet"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Soyadınız
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    placeholder="Örn: Yılmaz"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                E-posta Adresi
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="ornek@email.com"
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                            />
                        </div>

                        {/* Username + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="username" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Kullanıcı Adı
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="Kullanıcı adınız"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Telefon Numarası
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+90"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-slate-100 pt-5" />

                        {/* Current Password */}
                        <div>
                            <label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                Mevcut Şifre
                            </label>
                            <div className="relative">
                                <input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label="Şifreyi göster/gizle"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password + Confirm Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="newPassword" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Yeni Şifre
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        aria-label="Şifreyi göster/gizle"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Şifreyi Onayla
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        aria-label="Şifreyi göster/gizle"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isUpdatingProfile || isUploadingAvatar}
                                className="rounded-xl px-6 h-11 text-sm font-semibold bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white transition-all"
                            >
                                {isUpdatingProfile ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    "Değişiklikleri Kaydet"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ===================== CONTACT FORM CARD ===================== */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Bize Ulaşın</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            Herhangi bir sorunuz mu var? Formu doldurun, size en kısa sürede dönüş yapalım.
                        </p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-5">
                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="contactName" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    Ad Soyad
                                </label>
                                <input
                                    id="contactName"
                                    type="text"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    placeholder="Ad Soyad giriniz"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="contactEmail" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                    E-posta Adresi
                                </label>
                                <input
                                    id="contactEmail"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="E-posta adresinizi giriniz"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 transition-all"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="contactMessage" className="text-sm font-semibold text-slate-700 block mb-1.5">
                                Mesajınız
                            </label>
                            <textarea
                                id="contactMessage"
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                placeholder="Mesajınızı buraya yazın..."
                                rows={5}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3EB1] focus-visible:ring-offset-0 resize-none transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isContactSubmitting}
                                className="rounded-xl px-6 h-11 text-sm font-semibold bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white transition-all"
                            >
                                {isContactSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    "Mesajı Gönder"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </StudentSidebar>
    );
}
