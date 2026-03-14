"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Loader2,
    User,
    ShoppingBag,
    Download,
    CreditCard,
    Settings,
    GraduationCap,
    LogOut,
    ChevronDown,
    UserCog,
    MapPin,
    Wallet,
    LifeBuoy,
} from "lucide-react";
import { useGetProfileQuery } from "@/lib/features/auth/authApi";
import { useAppDispatch } from "@/lib/hooks";
import { clearAuthSession } from "@/lib/features/auth/authSessionSlice";

interface SidebarMenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
    subItems?: { label: string; href: string; icon: React.ElementType }[];
}

const studentSidebarMenuItems: SidebarMenuItem[] = [
    { label: "Profil", href: "/profile", icon: User },
    { label: "Siparişler", href: "/profile/orders", icon: ShoppingBag },
    { label: "İndirmeler", href: "/profile/downloads", icon: Download },
    { label: "Abonelikler", href: "/profile/subscriptions", icon: CreditCard },
    {
        label: "Ayarlar",
        href: "/profile/settings",
        icon: Settings,
        subItems: [
            { label: "Hesap Ayarları", href: "/profile/settings/account", icon: UserCog },
            { label: "Adres", href: "/profile/settings/address", icon: MapPin },
            { label: "Ödeme Yöntemleri", href: "/profile/settings/payment", icon: Wallet },
            { label: "Destek", href: "/profile/settings/support", icon: LifeBuoy },
        ],
    },
];

interface StudentSidebarProps {
    children: React.ReactNode;
}

export function StudentSidebar({ children }: StudentSidebarProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const pathname = usePathname();

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isTokenChecked, setIsTokenChecked] = useState(false);

    // Auto-expand settings if the current path matches a sub-item
    const isSettingsRoute = pathname.startsWith("/profile/settings");
    const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRoute);

    useEffect(() => {
        if (pathname.startsWith("/profile/settings")) {
            setIsSettingsOpen(true);
        }
    }, [pathname]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("access");
            setAccessToken(storedToken);
            setIsTokenChecked(true);

            if (!storedToken) {
                router.push("/");
            }
        }
    }, [router]);

    const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery(undefined, {
        skip: !accessToken,
    });

    const handleLogout = () => {
        dispatch(clearAuthSession());
        localStorage.removeItem("access_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expires_time");
        router.push("/");
    };

    if (!isTokenChecked || isProfileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F3F5FC]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3EB1]" />
            </div>
        );
    }

    const userInitials = `${(profileData?.first_name || "U").charAt(0)}${(profileData?.last_name || "").charAt(0)}`.toUpperCase();
    const displayUsername = profileData?.username || "kullanıcı";
    const displayEmail = profileData?.email || "";

    return (
        <div className="min-h-screen bg-[#F3F5FC]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Student Sidebar */}
                    <aside className="w-full lg:w-[260px] shrink-0">
                        <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                {/* User Info Section */}
                                <div className="flex flex-col items-center py-8 px-6 border-b border-slate-100">
                                    <Avatar className="h-20 w-20 mb-4 border-4 border-white shadow-md bg-slate-200 text-slate-600">
                                        <AvatarFallback className="bg-transparent text-xl font-bold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-base font-bold text-slate-800">{displayUsername}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{displayEmail}</p>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Çıkış Yap
                                    </button>
                                </div>

                                {/* Navigation Menu */}
                                <nav className="py-2">
                                    {studentSidebarMenuItems.map((menuItem) => {
                                        const hasSubItems = menuItem.subItems && menuItem.subItems.length > 0;

                                        if (hasSubItems) {
                                            // Dropdown / Accordion item
                                            const isAnySubActive = menuItem.subItems!.some(
                                                (sub) => pathname === sub.href
                                            );
                                            const isParentActive = isAnySubActive || pathname === menuItem.href;

                                            return (
                                                <div key={menuItem.href}>
                                                    {/* Parent toggle button */}
                                                    <button
                                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                                        className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all w-full ${
                                                            isParentActive && !isSettingsOpen
                                                                ? "bg-[#1A3EB1] text-white"
                                                                : isParentActive
                                                                ? "bg-[#1A3EB1]/5 text-[#1A3EB1]"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                        }`}
                                                    >
                                                        <menuItem.icon className="h-4 w-4" />
                                                        <span className="flex-1 text-left">{menuItem.label}</span>
                                                        <ChevronDown
                                                            className={`h-4 w-4 transition-transform duration-200 ${
                                                                isSettingsOpen ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </button>

                                                    {/* Sub-items */}
                                                    <div
                                                        className={`overflow-hidden transition-all duration-200 ease-in-out ${
                                                            isSettingsOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                                                        }`}
                                                    >
                                                        <div className="bg-slate-50/50">
                                                            {menuItem.subItems!.map((subItem) => {
                                                                const isSubActive = pathname === subItem.href;
                                                                return (
                                                                    <Link
                                                                        key={subItem.href}
                                                                        href={subItem.href}
                                                                        className={`flex items-center gap-3 pl-[52px] pr-6 py-3 text-[13px] font-medium transition-all ${
                                                                            isSubActive
                                                                                ? "bg-[#1A3EB1] text-white"
                                                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                                        }`}
                                                                    >
                                                                        <subItem.icon className="h-3.5 w-3.5" />
                                                                        {subItem.label}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Regular menu item
                                        const isMenuItemActive = pathname === menuItem.href;
                                        return (
                                            <Link
                                                key={menuItem.href}
                                                href={menuItem.href}
                                                className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all ${
                                                    isMenuItemActive
                                                        ? "bg-[#1A3EB1] text-white"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                                <menuItem.icon className="h-4 w-4" />
                                                {menuItem.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 space-y-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
