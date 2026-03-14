"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    FileText,
    MonitorPlay,
    PenTool,
    MessageSquare,
    LogOut,
    Menu,
    Tags,
    LayoutList,
    ChevronDown,
    ShoppingCart,
    User,
    LifeBuoy
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppDispatch } from "@/lib/hooks";
import { clearAuthSession } from "@/lib/features/auth/authSessionSlice";

interface SidebarProps {
    firstName: string;
    lastName: string;
    username: string;
}

type NavItem = {
    name: string;
    href?: string;
    icon: any;
    subItems?: { name: string; href: string; icon: any }[];
};

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
        name: "Kurs Yönetimi",
        icon: BookOpen,
        subItems: [
            { name: "Kurslar", href: "/dashboard/courses", icon: MonitorPlay },
            { name: "Kurs Kategorileri", href: "/dashboard/courses/categories", icon: Tags },
        ]
    },
    { name: "Öğrenciler", href: "/dashboard/students", icon: Users },
    { name: "Deneme Sınavları", href: "/dashboard/exams", icon: LayoutList },
    {
        name: "Dijital Eser Yönetimi",
        icon: MonitorPlay,
        subItems: [
            { name: "Dijital Eserler", href: "/dashboard/digital-products", icon: MonitorPlay },
            { name: "Dijital Eser Kategorileri", href: "/dashboard/digital-products/categories", icon: Tags },
        ]
    },
    {
        name: "Blog Yönetimi",
        icon: PenTool,
        subItems: [
            { name: "Blog", href: "/dashboard/blog", icon: PenTool },
            { name: "Blog Kategorileri", href: "/dashboard/categories", icon: Tags },
        ]
    },
    { name: "Siparişler", href: "/dashboard/orders/digital-products", icon: ShoppingCart },
    { name: "Öğrenci Yorumları", href: "/dashboard/students-reviews", icon: MessageSquare },
    { name: "Destek Talepleri", href: "/dashboard/support", icon: LifeBuoy },
];

export function Sidebar({ firstName, lastName, username }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);
    const [isDigitalMenuOpen, setIsDigitalMenuOpen] = useState(
        pathname.startsWith("/dashboard/digital-products")
    );
    const [isBlogMenuOpen, setIsBlogMenuOpen] = useState(
        pathname.startsWith("/dashboard/blog") || pathname.startsWith("/dashboard/categories")
    );
    const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(
        pathname.startsWith("/dashboard/courses")
    );
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    const toggleDigitalMenu = () => setIsDigitalMenuOpen((prev) => !prev);
    const toggleBlogMenu = () => setIsBlogMenuOpen((prev) => !prev);
    const toggleCourseMenu = () => setIsCourseMenuOpen((prev) => !prev);

    // Close mobile sheet on route change
    useEffect(() => {
        setIsOpen(false);
        setIsProfileDropdownOpen(false);
    }, [pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        if (isProfileDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isProfileDropdownOpen]);

    const handleLogout = () => {
        dispatch(clearAuthSession());
        localStorage.removeItem("access_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("expires_time");
        router.push("/login");
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-gray-200 text-gray-900 overflow-hidden">
            {/* Top Section: Logo & Nav */}
            <div className="flex-1 overflow-y-auto">
                {/* Logo Section */}
                <div className="p-6 flex items-center justify-center border-b border-gray-300 shrink-0">
                    <Link href="/">
                        <Image
                            src="/logo.webp"
                            alt="Alman Akademisi Logo"
                            width={180}
                            height={60}
                            className="object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Navigation Section */}
                <nav className="py-6 px-4 space-y-2">
                    {navItems.map((item) => {
                        if (item.subItems) {
                            let isParentActive = false;
                            let isOpenState = false;
                            let toggleFn = undefined;

                            if (item.name === "Dijital Eser Yönetimi") {
                                isParentActive = pathname.startsWith("/dashboard/digital-products");
                                isOpenState = isDigitalMenuOpen;
                                toggleFn = toggleDigitalMenu;
                            } else if (item.name === "Blog Yönetimi") {
                                isParentActive = pathname.startsWith("/dashboard/blog") || pathname.startsWith("/dashboard/categories");
                                isOpenState = isBlogMenuOpen;
                                toggleFn = toggleBlogMenu;
                            } else if (item.name === "Kurs Yönetimi") {
                                isParentActive = pathname.startsWith("/dashboard/courses");
                                isOpenState = isCourseMenuOpen;
                                toggleFn = toggleCourseMenu;
                            }

                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={toggleFn}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isParentActive
                                            ? "bg-gray-300 font-semibold text-gray-900"
                                            : "text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            <span className="text-sm">{item.name}</span>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpenState ? "rotate-180" : ""}`} />
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${isOpenState ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0"
                                            }`}
                                    >
                                        <div className="overflow-hidden flex flex-col gap-1 pl-4">
                                            {item.subItems.map(navSubItem => {
                                                let isSubActive = false;
                                                if (navSubItem.href === "/dashboard/digital-products") {
                                                    isSubActive = pathname === "/dashboard/digital-products" || pathname.startsWith("/dashboard/digital-products/create") || pathname.startsWith("/dashboard/digital-products/edit") || pathname.startsWith("/dashboard/digital-products/detail");
                                                } else if (navSubItem.href === "/dashboard/blog") {
                                                    isSubActive = pathname === "/dashboard/blog" || pathname.startsWith("/dashboard/blog/create") || pathname.startsWith("/dashboard/blog/edit") || pathname.startsWith("/dashboard/blog/detail");
                                                } else if (navSubItem.href === "/dashboard/courses") {
                                                    isSubActive = pathname === "/dashboard/courses" || pathname.startsWith("/dashboard/courses/create") || pathname.startsWith("/dashboard/courses/edit") || pathname.startsWith("/dashboard/courses/detail");
                                                } else {
                                                    isSubActive = pathname.startsWith(navSubItem.href);
                                                }

                                                return (
                                                    <Link
                                                        key={navSubItem.name}
                                                        href={navSubItem.href}
                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isSubActive
                                                            ? "bg-gray-400/20 text-gray-900 font-medium"
                                                            : "text-gray-600 hover:bg-gray-300"
                                                            }`}
                                                    >
                                                        <navSubItem.icon className="h-4 w-4" />
                                                        <span className="text-sm">{navSubItem.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        let isActive = false;

                        if (item.name === "Siparişler") {
                            isActive = pathname.startsWith("/dashboard/orders");
                        } else {
                            isActive = Boolean(
                                (item.href && pathname === item.href) ||
                                (item.href && item.href !== "/dashboard" &&
                                    item.href !== "#" &&
                                    pathname.startsWith(item.href))
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href || "#"}
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? "bg-gray-300 font-semibold text-gray-900"
                                    : "text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Section: User Profile with Dropdown */}
            <div className="p-4 mt-auto border-t border-gray-300 shrink-0 bg-gray-300/50 relative">
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                    <div
                        ref={profileDropdownRef}
                        className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                    >
                        <Link
                            href="/dashboard/profile"
                            prefetch={false}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        >
                            <User className="h-4 w-4" />
                            Profil
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100"
                        >
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </button>
                    </div>
                )}

                {/* Profile Card — click to toggle dropdown */}
                <button
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-300 transition-colors text-left"
                >
                    <Avatar className="h-10 w-10 border-2 border-gray-300 bg-emerald-500/20 text-emerald-700">
                        <AvatarFallback className="bg-transparent">{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-bold truncate">{firstName} {lastName}</p>
                        <p className="text-[10px] text-gray-500 font-semibold tracking-wider">YÖNETİCİ</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile/Tablet Floating Hamburger Menu (hidden on lg) */}
            <div className="lg:hidden fixed top-6 left-6 z-50">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="p-2.5 bg-white text-gray-800 hover:bg-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E3BB3]/20 rounded-xl flex items-center justify-center">
                            <Menu className="h-6 w-6" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-0 w-72 bg-gray-200">
                        {sidebarContent}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Fixed Sidebar (visible on lg) */}
            <aside className="hidden lg:flex w-72 bg-gray-200 h-screen text-gray-900 flex-col fixed left-0 top-0 z-40 shadow-xl overflow-hidden">
                {sidebarContent}
            </aside>
        </>
    );
}
