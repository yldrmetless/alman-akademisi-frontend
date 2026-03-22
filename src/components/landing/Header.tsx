"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogIn, User, ShoppingBag, Minus, Plus, Trash2, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearCart, removeFromCart, selectCartCount, selectCartItems, selectCartTotalPrice, updateQuantity } from "@/lib/features/cart/cartSlice";
import { clearAuthSession, selectAuthUser, selectIsAuthenticated, selectIsAuthInitialized, setAuthSession } from "@/lib/features/auth/authSessionSlice";
import { useLazyGetProfileQuery } from "@/lib/features/auth/authApi";

type HeaderProps = {
    logoSrc?: string;
};

export function Header({ logoSrc = "/logo.webp" }: HeaderProps) {
    const mainNavLabel = "Yüz Yüze Almanca Kursu";
    const faceToFaceUrl = "/yuz-yuze-almanca-kursu";

    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const [triggerGetProfile] = useLazyGetProfileQuery();
    const cartItems = useAppSelector(selectCartItems);
    const cartCount = useAppSelector(selectCartCount);
    const totalPrice = useAppSelector(selectCartTotalPrice);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isAuthInitialized = useAppSelector(selectIsAuthInitialized);
    const authUser = useAppSelector(selectAuthUser);
    const isStudent = authUser?.user_type === "student";
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isOnlineOpen, setIsOnlineOpen] = useState(false);

    const onlineCourseLinks = [
        { label: "A1 Almanca Kursu", href: "/kurslar/a1-almanca-kursu" },
        { label: "A2 Almanca Kursu", href: "/kurslar/a2-almanca-kursu" },
        { label: "B1 Almanca Kursu", href: "/kurslar/b1-almanca-kursu" },
        { label: "B2 Almanca Kursu", href: "/kurslar/b2-almanca-kursu" },
        { label: "C1 Almanca Kursu", href: "/kurslar/c1-almanca-kursu" },
        { label: "C2 Almanca Kursu", href: "/kurslar/c2-almanca-kursu" },
    ];

    const navbarItems = [
        { label: mainNavLabel, href: faceToFaceUrl },
        { label: "Dijital Eserler", href: "/dijital-eserler" },
        { label: "Bilgi Deposu", href: "/bilgi-deposu" },
        { label: "İletişim", href: "/iletisim" },
        { label: "SSS", href: "/sikca-sorulan-sorular" },
    ];

    const mobileNavLinks = [
        ...navbarItems,
        { label: "Bilgi Al", href: "/bilgi-al" },
    ];

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(amount);

    const decrementItem = (id: number | string, type: "course" | "digital_product", quantity: number) => {
        if (quantity <= 1) return;
        dispatch(updateQuantity({ id, type, quantity: quantity - 1 }));
    };

    const incrementItem = (
        id: number | string,
        type: "course" | "digital_product",
        quantity: number,
        stockLimit: number
    ) => {
        if (quantity >= stockLimit) return;
        dispatch(updateQuantity({ id, type, quantity: quantity + 1 }));
    };

    const handleCheckout = () => {
        const hasLocalAccess =
            typeof window !== "undefined" &&
            Boolean(localStorage.getItem("access_token") || localStorage.getItem("access"));
        const hasCookieAccess =
            typeof document !== "undefined" &&
            (document.cookie.includes("access_token=") || document.cookie.includes("access="));

        setIsCartOpen(false);
        if (!hasLocalAccess && !hasCookieAccess) {
            router.push("/login");
            return;
        }
        router.push("/checkout");
    };

    useEffect(() => {
        let cancelled = false;

        const hydrateAuth = async () => {
            if (isAuthInitialized) return;
            if (typeof window === "undefined") return;

            const accessToken = localStorage.getItem("access_token") || localStorage.getItem("access");
            if (!accessToken) {
                if (!cancelled) dispatch(clearAuthSession());
                return;
            }

            try {
                const profileResult = await triggerGetProfile().unwrap();
                if (cancelled) return;

                dispatch(
                    setAuthSession({
                        user: {
                            email: profileResult.email,
                            username: profileResult.username,
                            first_name: profileResult.first_name,
                            last_name: profileResult.last_name,
                            user_type: profileResult.user_type,
                        },
                        token: accessToken,
                    })
                );
            } catch {
                if (!cancelled) dispatch(clearAuthSession());
            }
        };

        hydrateAuth();
        return () => {
            cancelled = true;
        };
    }, [dispatch, isAuthInitialized, triggerGetProfile]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsOnlineOpen(false);
    }, [pathname]);

    return (
        <header className="sticky top-0 z-100 w-full border-b bg-white">
            <div className="container mx-auto flex h-28 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center">
                    {logoSrc.startsWith("http://") || logoSrc.startsWith("https://") ? (
                        <img
                            src={logoSrc}
                            alt="Alman Akademisi Logo"
                            className="h-14 w-auto object-contain"
                        />
                    ) : (
                        <Image
                            src={logoSrc}
                            alt="Alman Akademisi Logo"
                            width={140}
                            height={70}
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    )}
                </Link>

                <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="cursor-pointer bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent hover:text-primary active:text-primary focus:text-primary font-medium px-0 mr-4 text-base">
                                    Online Almanca Kursları
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-1 p-3 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white rounded-xl shadow-lg border-0 ring-1 ring-slate-900/5">
                                        {[
                                            { title: "Almanca Seviye Belirleme Sınavı", href: "/seviye-belirleme-sinavi" },
                                            { title: "A1 Almanca Kursu", href: "/kurslar/a1-almanca-kursu" },
                                            { title: "A2 Almanca Kursu", href: "/kurslar/a2-almanca-kursu" },
                                            { title: "B1 Almanca Kursu", href: "/kurslar/b1-almanca-kursu" },
                                            { title: "B2 Almanca Kursu", href: "/kurslar/b2-almanca-kursu" },
                                            { title: "C1 Almanca Kursu", href: "/kurslar/c1-almanca-kursu" },
                                            { title: "C2 Almanca Kursu", href: "/kurslar/c2-almanca-kursu" },
                                            { title: "Almanca Özel Ders", href: "/kurslar/ozel-ders" },
                                            { title: "Offline (Kayıtlı) Almanca Kursları", href: "/kurslar/offline-almanca-kursu" }
                                        ].map((item) => (
                                            <li key={item.title}>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href={item.href}
                                                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-50 hover:text-primary focus:bg-slate-50 focus:text-primary"
                                                    >
                                                        <div className="text-sm font-medium leading-none">{item.title}</div>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {navbarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="hover:text-primary px-3 py-2 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {isAuthInitialized && (
                        isAuthenticated ? (
                            <Button variant="ghost" size="sm" className="flex sm:hidden px-3 py-1.5 text-sm font-medium items-center gap-1" asChild>
                                <Link href={isStudent ? "/profile" : "/dashboard"}>
                                    <User className="w-4 h-4" />
                                    Profil
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" className="flex sm:hidden px-3 py-1.5 text-sm font-medium items-center gap-1" asChild>
                                <Link href="/login">
                                    <LogIn className="w-4 h-4" />
                                    Giriş Yap
                                </Link>
                            </Button>
                        )
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Mobil menuyu ac"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    {isAuthInitialized && (
                        isAuthenticated && isStudent ? (
                            <Button variant="ghost" size="sm" className="hidden sm:flex cursor-pointer" asChild>
                                <Link href="/profile">
                                    <User className="w-4 h-4 mr-2" />
                                    Profil
                                </Link>
                            </Button>
                        ) : !isAuthenticated ? (
                            <Button variant="ghost" size="sm" className="hidden sm:flex cursor-pointer" asChild>
                                <Link href="/login">
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Giriş Yap
                                </Link>
                            </Button>
                        ) : null
                    )}
                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="relative cursor-pointer">
                                <ShoppingBag className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                    {cartCount}
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="sm:max-w-[430px] p-0 bg-white shadow-2xl">
                            <SheetHeader className="px-6 py-5 border-b border-slate-100">
                                <SheetTitle className="text-xl font-bold text-[#1e3a8a]">Sepetim</SheetTitle>
                                <SheetDescription className="text-slate-500">
                                    Toplam {cartCount} urun
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {cartItems.length === 0 ? (
                                    <div className="h-full min-h-[220px] flex items-center justify-center text-slate-500 font-medium">
                                        Sepetiniz boş
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className="rounded-xl border border-slate-200 p-3 shadow-sm bg-white"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                        <img
                                                            src={item.image || "/logo.webp"}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm font-bold text-[#1e3a8a] mt-1">
                                                            {formatCurrency(item.price)} ₺
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Max stok: {item.stock_limit}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => dispatch(removeFromCart({ id: item.id, type: item.type }))}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="h-10 rounded-full border border-slate-200 px-3 flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            onClick={() => decrementItem(item.id, item.type, item.quantity)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-sm font-bold text-[#1e3a8a] min-w-6 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                            onClick={() => incrementItem(item.id, item.type, item.quantity, item.stock_limit)}
                                                            disabled={item.quantity >= item.stock_limit}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {formatCurrency(item.price * item.quantity)} ₺
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <SheetFooter className="px-6 pb-6 pt-4 border-t border-slate-100">
                                <div className="w-full space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Genel Toplam</span>
                                        <span className="text-lg font-bold text-[#1e3a8a]">{formatCurrency(totalPrice)} ₺</span>
                                    </div>

                                    <Button
                                        onClick={handleCheckout}
                                        disabled={cartItems.length === 0}
                                        className="w-full h-11 rounded-xl bg-[#1e3a8a] text-white font-semibold hover:bg-[#1a347d]"
                                    >
                                        Alışverişi Tamamla
                                    </Button>

                                    <SheetClose asChild>
                                        <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200">
                                            Alışverişe Geri Dön
                                        </Button>
                                    </SheetClose>

                                    <Button
                                        variant="ghost"
                                        onClick={() => dispatch(clearCart())}
                                        disabled={cartItems.length === 0}
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Sepeti Temizle
                                    </Button>
                                </div>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.aside
                        className="fixed inset-0 z-9999 overflow-y-auto bg-white lg:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobil navigasyon"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        <div className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
                            <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                                {logoSrc.startsWith("http://") || logoSrc.startsWith("https://") ? (
                                    <img
                                        src={logoSrc}
                                        alt="Alman Akademisi Logo"
                                        className="h-14 w-auto object-contain"
                                    />
                                ) : (
                                    <Image
                                        src={logoSrc}
                                        alt="Alman Akademisi Logo"
                                        width={150}
                                        height={80}
                                        className="h-14 w-auto object-contain"
                                    />
                                )}
                            </Link>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Mobil menuyu kapat"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex flex-col gap-8 px-6 py-8">
                            <div className="border-b border-slate-200 pb-4">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between text-left text-xl font-semibold text-slate-800 transition-colors hover:text-[#1e3a8a]"
                                    onClick={() => setIsOnlineOpen((prev) => !prev)}
                                    aria-expanded={isOnlineOpen}
                                    aria-controls="mobile-online-kurslar"
                                >
                                    <span>Online Kurslar</span>
                                    {isOnlineOpen ? (
                                        <ChevronUp className="h-5 w-5 shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 shrink-0" />
                                    )}
                                </button>

                                {isOnlineOpen && (
                                    <div id="mobile-online-kurslar" className="ml-4 mt-4 space-y-1 border-l border-slate-200 pl-4">
                                        {onlineCourseLinks.map((course) => (
                                            <Link
                                                key={course.label}
                                                href={course.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block py-3 text-base font-medium text-slate-700 transition-colors hover:text-[#1e3a8a]"
                                            >
                                                {course.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {mobileNavLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="border-b border-slate-200 pb-4 text-xl font-semibold text-slate-800 transition-colors hover:text-[#1e3a8a]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>
        </header>
    );
}
