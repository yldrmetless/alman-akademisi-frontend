"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearCart } from "@/lib/features/cart/cartSlice";
import { selectCartItems, selectCartTotalPrice } from "@/lib/features/cart/cartSlice";

type BillingInfo = {
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    hasAddressData: boolean;
};

type FinalOrderDetails = {
    items: ReturnType<typeof selectCartItems>;
    total: number;
} | null;

declare global {
    interface Window {
        iFrameResize?: (options?: Record<string, unknown>, target?: string) => void;
    }
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(amount);

export default function CheckoutPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector(selectCartItems);
    const totalPrice = useAppSelector(selectCartTotalPrice);

    const [hasMounted, setHasMounted] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paytrToken, setPaytrToken] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [finalOrderDetails, setFinalOrderDetails] = useState<FinalOrderDetails>(null);

    const subtotal = paytrToken && finalOrderDetails ? finalOrderDetails.total : totalPrice;
    const total = paytrToken && finalOrderDetails ? finalOrderDetails.total : totalPrice;
    const isAddressMissing = billingInfo ? !billingInfo.hasAddressData : true;
    const visibleItems = paytrToken && finalOrderDetails ? finalOrderDetails.items : cartItems;

    const orderPayload = useMemo(() => {
        const digital_products = cartItems
            .filter((item) => item.type === "digital_product")
            .map((item) => ({ id: item.id, amount: item.quantity }));

        const courses = cartItems
            .filter((item) => item.type === "course")
            .map((item) => ({ id: item.id, amount: item.quantity }));

        return { digital_products, courses };
    }, [cartItems]);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted) return;

        const rawToken =
            window.localStorage.getItem("access_token") ||
            window.localStorage.getItem("access");
        const normalizedToken =
            rawToken && rawToken !== "null" && rawToken !== "undefined" ? rawToken : null;

        if (!normalizedToken) {
            setIsCheckingAuth(false);
            router.replace("/login");
            return;
        }

        setAccessToken(normalizedToken);
        setIsCheckingAuth(false);
    }, [hasMounted, router]);

    useEffect(() => {
        const fetchBillingInfo = async () => {
            if (!accessToken) return;
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/profile/`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) return;

                const profileData = await response.json();
                const addressData = profileData.address_data;
                const hasAddressData = Boolean(addressData);

                const fullName = hasAddressData
                    ? `${addressData.first_name || ""} ${addressData.last_name || ""}`.trim()
                    : "-";

                const phone = hasAddressData
                    ? addressData.phone || "Telefon belirtilmedi"
                    : "Telefon belirtilmedi";

                const fullAddress = hasAddressData
                    ? `${addressData.address_title || "Adres"}: ${addressData.neighborhood || "-"} Mah. ${addressData.full_address || "-"} ${addressData.district || "-"}/${addressData.city || "-"}`
                    : "-";

                setBillingInfo({
                    full_name: fullName,
                    email: profileData.email,
                    phone,
                    address: fullAddress,
                    hasAddressData,
                });
            } catch {
                // Billing info optional in checkout summary.
            }
        };
        fetchBillingInfo();
    }, [accessToken]);

    useEffect(() => {
        if (!paytrToken) return;

        const scriptId = "paytr-iframe-resizer-script";
        const initializeResizer = () => {
            if (window.iFrameResize) {
                window.iFrameResize({}, "#paytriframe");
            }
        };

        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (existingScript) {
            initializeResizer();
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://www.paytr.com/js/iframeResizer.min.js";
        script.async = true;
        script.onload = initializeResizer;
        document.body.appendChild(script);
    }, [paytrToken]);

    const handleStartPayment = async () => {
        if (!accessToken || cartItems.length === 0 || isAddressMissing || !billingInfo) return;

        setIsSubmitting(true);
        setPaymentError(null);
        try {
            setFinalOrderDetails({
                items: cartItems,
                total: totalPrice,
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}products/create-orders/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(orderPayload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "Odeme oturumu olusturulamadi.");
            }

            if (!data?.token) {
                throw new Error("PayTR token donmedi.");
            }

            setPaytrToken(data.token);
            dispatch(clearCart());
        } catch (error) {
            const message = error instanceof Error ? error.message : "Odeme baslatilirken bir hata olustu.";
            setPaymentError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasMounted || isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-6xl mx-auto py-12 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
                <section className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-[#1e3a8a]">Sipariş Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {visibleItems.length === 0 ? (
                                <p className="text-slate-500 font-medium">Sepetiniz boş.</p>
                            ) : (
                                visibleItems.map((item) => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="flex items-center gap-4 border border-slate-100 rounded-xl p-4 bg-white"
                                    >
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                            <Image
                                                src={item.image || "/logo.webp"}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 line-clamp-2">{item.name}</p>
                                            <p className="text-sm text-slate-500 mt-1">Adet: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#1e3a8a]">
                                                {formatCurrency(item.price * item.quantity)} ₺
                                            </p>
                                            <Badge variant="outline" className="mt-1 text-xs">
                                                {item.type === "course" ? "Kurs" : "Dijital Eser"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-slate-800">Fatura Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="rounded-xl border border-slate-100 p-4 bg-white">
                                    <p className="text-slate-400">Ad Soyad</p>
                                    <p className="font-medium text-slate-700 mt-1">{billingInfo?.full_name || "-"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-4 bg-white">
                                    <p className="text-slate-400">E-posta</p>
                                    <p className="font-medium text-slate-700 mt-1">{billingInfo?.email || "-"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-4 bg-white">
                                    <p className="text-slate-400">Telefon</p>
                                    <p className="font-medium text-slate-700 mt-1">{billingInfo?.phone || "-"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-100 p-4 bg-white">
                                    <p className="text-slate-400">Adres</p>
                                    <p className="font-medium text-slate-700 mt-1 line-clamp-2">
                                        {billingInfo?.address || "-"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isAddressMissing && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium">
                            Lütfen profilinizden adres bilgilerinizi tamamlayın.
                        </div>
                    )}
                    {paytrToken && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50 text-[#1e3a8a] px-4 py-3 text-sm font-medium">
                            Siparişiniz Hazırlanıyor. Ödeme işlemini güvenli pencereden tamamlayabilirsiniz.
                        </div>
                    )}
                </section>

                <aside className="lg:col-span-1">
                    <Card className="rounded-2xl border-slate-200 shadow-sm lg:sticky lg:top-28">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-[#1e3a8a]">Ödeme</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Ara Toplam</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(subtotal)} ₺</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="font-semibold text-slate-700">Toplam</span>
                                <span className="text-2xl font-extrabold text-[#1e3a8a]">{formatCurrency(total)} ₺</span>
                            </div>

                            {!paytrToken ? (
                                <Button
                                    onClick={handleStartPayment}
                                    disabled={isSubmitting || cartItems.length === 0 || isAddressMissing || !billingInfo}
                                    className="w-full h-12 rounded-xl bg-[#1e3a8a] text-white font-semibold hover:bg-[#1a347d]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Ödeme Başlatılıyor...
                                        </>
                                    ) : (
                                        "Ödemeyi Başlat"
                                    )}
                                </Button>
                            ) : (
                                <div
                                    id="paytr-iframe-container"
                                    className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-500"
                                >
                                    <iframe
                                        id="paytriframe"
                                        title="PayTR Ödeme"
                                        src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
                                        frameBorder="0"
                                        scrolling="no"
                                        className="w-full min-h-[600px]"
                                    />
                                </div>
                            )}

                            {paymentError && (
                                <p className="text-sm text-red-600 font-medium">{paymentError}</p>
                            )}

                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#1e3a8a] mt-0.5 shrink-0" />
                                <span>
                                    Ödeme süreci PayTR altyapısı üzerinden güvenle yürütülür. Başarılı işlem sonrası
                                    <strong> /payment-success</strong>, hatalı işlemde <strong> /payment-failed</strong> ekranına yönlendirilirsiniz.
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </main>
        </div>
    );
}
