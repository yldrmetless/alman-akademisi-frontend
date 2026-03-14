"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminPanel = pathname.startsWith("/dashboard");
    const showNavigation = !isAdminPanel;

    return (
        <>
            {showNavigation && <Header />}
            {children}
            {showNavigation && <Footer />}
        </>
    );
}
