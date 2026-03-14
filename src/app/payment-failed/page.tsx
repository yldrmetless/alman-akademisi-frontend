import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                <XCircle className="w-14 h-14 text-red-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-[#1e3a8a] mb-3">Ödeme Başarısız</h1>
                <p className="text-slate-600 mb-8">
                    Ödeme sırasında bir sorun oluştu. Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1 bg-[#1e3a8a] hover:bg-[#1a347d]">
                        <Link href="/checkout">Tekrar Dene</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 border-slate-200">
                        <Link href="/">Ana Sayfaya Dön</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
