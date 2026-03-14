import { ShieldCheck, Headphones, CreditCard, PlayCircle, BookOpen, GraduationCap } from "lucide-react";

export function WhyUsSection() {
    const reasons = [
        {
            title: "Gelişmiş Online Almanca",
            desc: "Alman Akademisi online sınıfları her öğrencisine eğitim için ihtiyaç duyacağı tüm özelliklere sahiptir.",
            icon: <PlayCircle className="w-8 h-8 text-primary" />
        },
        {
            title: "Yüksek Tecrübe",
            desc: "Akademist, uzman, alanında tecrübeli ve pedagojik formasyon sahibi eğitmenlerden oluşur.",
            icon: <GraduationCap className="w-8 h-8 text-primary" />
        },
        {
            title: "Süper Destek",
            desc: "Destek sistemimiz ile teknik sorunlarınızı veya eğitim sorularınızı 7/24 yanıtlıyoruz.",
            icon: <Headphones className="w-8 h-8 text-primary" />
        },
        {
            title: "Uygun Fiyat Garantisi",
            desc: "Kaliteli eğitimi en uygun bütçelerle sunmayı hedefliyor, herkes için erişilebilir oluyoruz.",
            icon: <CreditCard className="w-8 h-8 text-primary" />
        },
        {
            title: "Güvenli Ödeme",
            desc: "3D Secure ve PCI DSS standartları ile ödemeleriniz banka güvencesinde korunmaktadır.",
            icon: <ShieldCheck className="w-8 h-8 text-primary" />
        },
        {
            title: "Özgün Materyaller",
            desc: "Öğrencilerimize özel tasarlanmış dijital kitaplar ve interaktif çalışma kağıtları sunuyoruz.",
            icon: <BookOpen className="w-8 h-8 text-primary" />
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-800">
                        Neden <span className="text-primary">Alman Akademisi?</span>
                    </h2>
                </div>

                <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                    {reasons.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center px-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
