import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-[#1e3a8a] mb-3">Ödeme Başarılı</h1>
                <p className="text-slate-600 mb-8">
                    Siparişiniz başarıyla alındı. Satın aldığınız ürünleri profilinizden görüntüleyebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1 bg-[#1e3a8a] hover:bg-[#1a347d]">
                        <Link href="/profile/orders">Siparişlerime Git</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 border-slate-200">
                        <Link href="/">Ana Sayfaya Dön</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
