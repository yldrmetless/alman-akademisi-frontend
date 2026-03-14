import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CallToActionSection() {
    return (
        <section className="py-20 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 mb-8">
                    Dil yolculuğunuza bizimle başlamaya hazır mısınız?
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        size="lg"
                        className="bg-[#1A3EB1] hover:bg-[#1A3EB1]/90 text-white px-8 h-12 rounded-xl font-medium text-base shadow-sm transition-all"
                        asChild
                    >
                        <Link href="/register">Hemen Kayıt Ol</Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 h-12 rounded-xl font-medium text-base transition-all"
                        asChild
                    >
                        <Link href="#">Ücretsiz Seviye Belirleme</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
