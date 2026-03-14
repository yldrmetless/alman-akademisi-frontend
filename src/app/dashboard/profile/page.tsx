"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useGetProfileQuery, useEditProfileMutation } from "@/lib/features/auth/authApi";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const { isAuthorized, isLoading: isAuthLoading, profile } = useAuthGuard("admin");

    const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery(undefined, {
        skip: !isAuthorized,
    });

    const [editProfile, { isLoading: isEditingProfile }] = useEditProfileMutation();

    // Personal info state
    const [profileFirstName, setProfileFirstName] = useState("");
    const [profileLastName, setProfileLastName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profileUsername, setProfileUsername] = useState("");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMatchError, setPasswordMatchError] = useState("");
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Prefill profile data
    useEffect(() => {
        if (profileData) {
            setProfileFirstName(profileData.first_name || "");
            setProfileLastName(profileData.last_name || "");
            setProfileEmail(profileData.email || "");
            setProfileUsername(profileData.username || "");
        }
    }, [profileData]);

    // Real-time password match validation
    useEffect(() => {
        if (confirmPassword && newPassword && confirmPassword !== newPassword) {
            setPasswordMatchError("Şifreler eşleşmiyor.");
        } else {
            setPasswordMatchError("");
        }
    }, [newPassword, confirmPassword]);

    const handleProfileUpdate = async () => {
        const profileUpdatePayload: Record<string, string> = {};

        if (profileFirstName.trim() !== (profileData?.first_name || "")) {
            profileUpdatePayload.first_name = profileFirstName.trim();
        }
        if (profileLastName.trim() !== (profileData?.last_name || "")) {
            profileUpdatePayload.last_name = profileLastName.trim();
        }
        if (profileEmail.trim() !== (profileData?.email || "")) {
            if (!profileEmail.trim()) {
                toast.error("E-posta alanı boş bırakılamaz.");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profileEmail.trim())) {
                toast.error("Geçerli bir e-posta adresi giriniz.");
                return;
            }
            profileUpdatePayload.email = profileEmail.trim();
        }
        if (profileUsername.trim() !== (profileData?.username || "")) {
            if (!profileUsername.trim()) {
                toast.error("Kullanıcı adı boş bırakılamaz.");
                return;
            }
            profileUpdatePayload.username = profileUsername.trim();
        }

        if (Object.keys(profileUpdatePayload).length === 0) {
            toast.error("Herhangi bir değişiklik yapılmadı.");
            return;
        }

        try {
            const profileUpdateResult = await editProfile(profileUpdatePayload).unwrap();
            const isUpdateSuccessful = profileUpdateResult?.status === 200 || !!profileUpdateResult?.message;
            if (isUpdateSuccessful) {
                toast.success(profileUpdateResult.message || "Profil başarıyla güncellendi.");
            }
        } catch (error: any) {
            const serverErrorMessage = error?.data?.message || error?.data?.detail || error?.data?.email?.[0] || error?.data?.username?.[0];
            toast.error(serverErrorMessage || "Profil güncellenirken bir hata oluştu.");
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword.trim()) {
            toast.error("Mevcut şifre alanı zorunludur.");
            return;
        }
        if (!newPassword.trim()) {
            toast.error("Yeni şifre alanı zorunludur.");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Yeni şifre en az 8 karakter olmalıdır.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor.");
            return;
        }

        setIsPasswordChanging(true);
        try {
            const passwordResponse = await editProfile({
                current_password: currentPassword,
                new_password: newPassword,
            }).unwrap();
            const passwordSuccessMessage = passwordResponse?.message || "Şifre başarıyla değiştirildi.";
            toast.success(passwordSuccessMessage);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            const serverErrorMessage = error?.data?.detail || error?.data?.message || error?.data?.current_password?.[0];
            toast.error(serverErrorMessage || "Şifre değiştirilirken bir hata oluştu.");
        } finally {
            setIsPasswordChanging(false);
        }
    };

    if (isAuthLoading || isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
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
                <div className="p-4 sm:p-8 max-w-[800px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="pt-1 sm:pt-0 pl-[4.5rem] lg:pl-0">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profil Ayarları</h1>
                        <p className="text-sm text-slate-500 mt-1">Kişisel bilgilerinizi ve şifrenizi yönetin.</p>
                    </div>

                    {/* Personal Info Card */}
                    <Card className="rounded-2xl border-slate-100 shadow-sm">
                        <CardHeader className="pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-800">Kişisel Bilgiler</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="profileFirstName" className="text-sm font-semibold text-slate-700">Ad</Label>
                                    <Input
                                        id="profileFirstName"
                                        type="text"
                                        value={profileFirstName}
                                        onChange={(e) => setProfileFirstName(e.target.value)}
                                        className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profileLastName" className="text-sm font-semibold text-slate-700">Soyad</Label>
                                    <Input
                                        id="profileLastName"
                                        type="text"
                                        value={profileLastName}
                                        onChange={(e) => setProfileLastName(e.target.value)}
                                        className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="profileEmail" className="text-sm font-semibold text-slate-700">E-posta</Label>
                                    <Input
                                        id="profileEmail"
                                        type="email"
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profileUsername" className="text-sm font-semibold text-slate-700">Kullanıcı Adı</Label>
                                    <Input
                                        id="profileUsername"
                                        type="text"
                                        value={profileUsername}
                                        onChange={(e) => setProfileUsername(e.target.value)}
                                        className="bg-white border-slate-200 focus-visible:ring-[#4F46E5]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleProfileUpdate}
                                    disabled={isEditingProfile}
                                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 h-11 rounded-lg font-medium transition-all w-full sm:w-auto"
                                >
                                    {isEditingProfile ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        "Kaydet"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Password Change Card */}
                    <Card className="rounded-2xl border-slate-100 shadow-sm">
                        <CardHeader className="pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 rounded-xl">
                                    <Lock className="h-5 w-5 text-amber-600" />
                                </div>
                                <CardTitle className="text-lg font-bold text-slate-800">Güvenlik</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700">Mevcut Şifre</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-white border-slate-200 focus-visible:ring-[#4F46E5] pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">Yeni Şifre</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="bg-white border-slate-200 focus-visible:ring-[#4F46E5] pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Yeni Şifre (Tekrar)</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={`bg-white border-slate-200 focus-visible:ring-[#4F46E5] pr-10 ${passwordMatchError ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordMatchError && (
                                        <p className="text-xs text-red-500 font-medium">{passwordMatchError}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={isPasswordChanging || !!passwordMatchError}
                                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 h-11 rounded-lg font-medium transition-all w-full sm:w-auto"
                                >
                                    {isPasswordChanging ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Değiştiriliyor...
                                        </>
                                    ) : (
                                        "Şifreyi Değiştir"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
