import { Card, CardContent } from "@/components/ui/card";
import { MonitorPlay, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeaturesSection() {
    const features = [
        {
            title: "Online Almanca Kursları",
            description: "Online Almanca kurslarına kaydolarak Almanca'nızı geliştirebilir, dilediğiniz zaman ders kayıtlarını izleyebilirsiniz.",
            icon: <MonitorPlay className="w-8 h-8 text-white" />,
            color: "bg-primary text-white",
            link: "/"
        },
        {
            title: "WhatsApp Kulübü",
            description: "Almanca konuşma pratiği yapabileceğiniz, eğitmenlerle birebir soru-cevap yapabileceğiniz aktif öğrenci topluluğu.",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-8 w-8 fill-white"
                >
                    <path d="M20.52 3.48A11.79 11.79 0 0 0 12.12 0C5.58 0 .24 5.34.24 11.88c0 2.1.54 4.14 1.62 5.94L0 24l6.36-1.8a11.8 11.8 0 0 0 5.76 1.5h.06c6.54 0 11.88-5.34 11.88-11.88 0-3.18-1.26-6.18-3.54-8.34ZM12.18 21.6h-.06a9.66 9.66 0 0 1-4.92-1.32l-.36-.24-3.78 1.08 1.08-3.66-.24-.36a9.67 9.67 0 0 1-1.5-5.22c0-5.34 4.38-9.72 9.72-9.72 2.58 0 5.04 1.02 6.9 2.88a9.69 9.69 0 0 1 2.82 6.9c0 5.34-4.38 9.66-9.66 9.66Zm5.28-7.26c-.3-.18-1.8-.9-2.1-1.02-.24-.12-.48-.18-.66.18-.18.3-.72 1.02-.84 1.2-.18.18-.3.24-.6.12-.24-.18-1.14-.42-2.16-1.38a7.92 7.92 0 0 1-1.5-1.8c-.18-.3 0-.42.12-.6.12-.12.3-.36.42-.48.12-.18.18-.3.3-.48.12-.18.06-.36 0-.54-.06-.12-.66-1.62-.9-2.22-.24-.6-.48-.48-.66-.48h-.54c-.18 0-.48.06-.72.3s-.96.9-.96 2.22c0 1.32.96 2.58 1.08 2.76.18.18 1.92 3 4.74 4.2.66.3 1.2.48 1.62.66.66.18 1.32.18 1.8.12.54-.06 1.8-.72 2.04-1.38.3-.72.3-1.32.24-1.44-.06-.12-.24-.18-.54-.36Z" />
                </svg>
            ),
            color: "bg-secondary text-white",
            link: "/dijital-eserler"
        },
        {
            title: "Dijital Eserler",
            description: "Özel olarak hazırlanmış Almanca kelime kartları, çalışma fasikülleri ve hap bilgi dokümanlarına erişin.",
            icon: <FileText className="w-8 h-8 text-primary" />,
            color: "bg-white text-slate-800 border-2 border-slate-100",
            link: "/dijital-eserler"
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-3">
                    {features.map((feature, i) => (
                        <Card key={i} className={`overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl ${feature.color}`}>
                            <CardContent className="p-8 h-full flex flex-col">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${feature.color === "bg-white text-slate-800 border-2 border-slate-100" ? "bg-primary/10" : "bg-white/20 backdrop-blur"}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className={`mb-8 flex-1 ${feature.color.includes("bg-white") ? "text-slate-600" : "text-white/90"}`}>
                                    {feature.description}
                                </p>
                                <Link href={feature.link} className={`inline-flex items-center font-semibold group ${feature.color.includes("bg-white") ? "text-primary" : "text-white"}`}>
                                    İncele <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
