import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-white px-4 py-16 md:py-24 lg:py-32">
            <div className="container mx-auto grid gap-12 lg:grid-cols-2 lg:gap-8 items-center px-4 md:px-6">
                <div className="flex flex-col justify-center space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary border-primary/20 bg-primary/10">
                            ✈️ YURT DIŞINA EN KAPSAMLI ALMANCA AKADEMİSİ
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none text-primary">
                            Almanca <br /> Alman Akademisi'nde <br /> öğrenilir.
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg">
                            Alman Akademisi'nde dijital Almanca kursuna kayıt olabilir,
                            dijital eserler ile Almanca seviyenizi geliştirebilir,
                            WhatsApp kulübüne katılarak Almancayı hayatınızın bir parçası yapabilirsiniz.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button size="lg" className="h-12 px-8" asChild>
                            <Link href="/bilgi-al">Bilgi Al</Link>
                        </Button>
                        <Button size="lg" variant="secondary" className="h-12 px-8 text-white">
                            Bize Ulaşın
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-secondary/20 rounded-[3rem] -rotate-6 scale-105 pointer-events-none" />
                    <div className="relative aspect-video w-full max-w-lg overflow-hidden rounded-[24px] border-4 border-white shadow-lg">
                        <Image
                            src="/hero.jpg"
                            alt="Alman Akademisi Hero"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
