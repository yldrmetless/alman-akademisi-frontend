"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

type FaqQuestion = {
    q: string;
    a: string;
};

type FaqSection = {
    title: string;
    questions: FaqQuestion[];
};

const FAQ_SECTIONS: FaqSection[] = [
    {
        title: "Çevrimiçi Eğitimler",
        questions: [
            {
                q: "Gelişmiş sınıf sistemi nedir?",
                a: "Gelişmiş dijital sınıf sistemimiz, eğitimlerin online oluşunun tüm avantajlarından yararlandığımız bir sistemdir. Ödevlerinizi tek bir yerden takip edebilir, eski ders kayıtlarına ulaşabilir ve diğer öğrencilerle gerçek bir sınıftaymışçasına etkileşim kurabilirsiniz. Mobil ve tablet uygulamalarımızla derslere her yerden katılabilirsiniz.",
            },
            {
                q: "Derslere her yerden katılabilir miyim?",
                a: "İhtiyacınız olan tek şey internet bağlantısı olan bir tablet, bilgisayar veya telefon. Dünyanın neresinde olursanız olun derslere erişebilirsiniz.",
            },
            {
                q: "Eğitim setlerinin sanal materyalleri sınıfa nasıl yükleniyor?",
                a: "Eğitim setlerinin sanal materyalleri sistemimize entegre şekilde yüklenir ve öğrencilerimiz tarafından kolayca kullanılabilir.",
            },
            {
                q: "Kurs sona erdiğinde sertifika alacak mıyım?",
                a: "Evet, kurs sonunda katılımınızı onurlandıran ve kariyer hedeflerinizde referans olarak kullanabileceğiniz bir katılım sertifikası alacaksınız.",
            },
            {
                q: "Almanca seviyemi nasıl belirlerim?",
                a: "Web sitemizdeki özel deneme sınavına katılarak seviyenizi test edebilir ve size en uygun sınıfa yönlendirilmenizi sağlayabilirsiniz.",
            },
            {
                q: "Eğitimleri kimler veriyor?",
                a: "Eğitimlerimiz, sınav hazırlığı konusunda uzman ve zengin tecrübeye sahip, kendi alanında otorite olan hocalar tarafından verilmektedir.",
            },
            {
                q: "Uluslararası sınavlara hazırlanabilir miyim?",
                a: "Evet, GOETHE, TELC ve ÖSD gibi uluslararası sınavlara yönelik özel ve grup derslerimiz mevcuttur. Kişiselleştirilmiş planlarla potansiyelinizi en üst düzeye çıkarıyoruz.",
            },
            {
                q: "Almanca kursu seçerken nelere dikkat etmeliyim?",
                a: "Kursun seviyesi ve içeriği, eğitmenin deneyimi, materyallerin güncelliği, sınıf mevcudu (düşük olması tercih edilir), esneklik ve fiyat/performans oranına dikkat edilmelidir.",
            },
            {
                q: "Neden sizin kursunuzu seçmeliyim?",
                a: "Yüksek öğretim deneyimine sahip profesyonel kadromuz, güncel interaktif materyallerimiz ve gerçek hayat senaryolarına dayalı eğitim metodolojimizle fark yaratıyoruz.",
            },
            {
                q: "Ödemeyi nasıl yapabiliriz?",
                a: "Havale yöntemi veya güvenli ödeme altyapımız (PayTR) üzerinden tüm kredi kartları (Visa, MasterCard vb.) ile ödeme yapabilirsiniz.",
            },
        ],
    },
    {
        title: "Yayınlar & Dijital Eserler",
        questions: [
            {
                q: "Dijital eser nedir?",
                a: "Kitap, müzik ve film gibi içeriklerin fiziksel bir materyale (kağıt, CD) ihtiyaç duymadan cihazlar üzerinden erişilebilir formatta sunulmasıdır.",
            },
            {
                q: "Satın aldığım dijital eser adresime gelecek mi?",
                a: "Hayır, ürünlerimiz tamamen dijitaldir. Satın alma sonrası içerikler doğrudan e-posta adresinize gönderilir; fiziksel teslimat yoktur.",
            },
            {
                q: "Eserleri nasıl indirebilirim?",
                a: "Üyeyseniz profiliniz üzerinden, üye değilseniz satın alma sırasında belirttiğiniz e-posta adresine gönderilen bağlantı üzerinden erişebilirsiniz.",
            },
        ],
    },
    {
        title: "Ödemeler & Güvenlik",
        questions: [
            {
                q: "Faturamı ne zaman alırım?",
                a: "Faturalar aynı gün otomatik olarak oluşturulur (e-arşiv). Ayrıca WhatsApp hattımızdan da talep edebilirsiniz.",
            },
            {
                q: "Taksit imkanı var mı?",
                a: "Evet, bankanıza bağlı olarak 12 taksite kadar ödeme yapabilirsiniz. Taksit oranları bankadan bankaya değişebilir.",
            },
            {
                q: "Ödemeler güvenli mi?",
                a: "Evet, Türkiye'nin en büyük ödeme çözümlerinden PAYTR ile çalışmaktayız. Kart bilgileriniz asla bizimle paylaşılmaz.",
            },
        ],
    },
    {
        title: "WhatsApp Kulübü",
        questions: [
            {
                q: "WhatsApp Kulübü'ne ne zaman dahil olurum?",
                a: "Aboneliğinizi başlattığınız aynı iş günü içerisinde kaydınız yapılarak gruba dahil edilirsiniz.",
            },
        ],
    },
];

const makeSectionId = (title: string) =>
    title
        .toLocaleLowerCase("tr-TR")
        .replace(/&/g, "ve")
        .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/gi, "")
        .trim()
        .replace(/\s+/g, "-");

export default function FaqPage() {
    const [openItem, setOpenItem] = useState<string | null>(null);

    const sectionsWithId = useMemo(
        () =>
            FAQ_SECTIONS.map((section) => ({
                ...section,
                id: makeSectionId(section.title),
            })),
        []
    );

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <main className="max-w-[1200px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-12 md:py-16 mt-16">
                <div className="w-full flex justify-start mb-8">
                    <nav className="flex items-center text-sm text-slate-400 gap-2 font-medium">
                        <Link href="/" className="hover:text-[#1e3a8a] transition-colors">Ana Sayfa</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[#1e3a8a] font-semibold">Sıkça Sorulan Sorular</span>
                    </nav>
                </div>

                <section className="mb-12">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#1e3a8a] tracking-tight mb-4">Sıkça Sorulan Sorular</h1>
                    <p className="text-slate-600 text-base md:text-lg max-w-3xl">
                        Eğitimlerimiz, dijital eserler, ödeme süreçleri ve güvenlik konularında en çok merak edilen soruları burada bulabilirsiniz.
                    </p>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
                    <aside className="hidden lg:block">
                        <div className="sticky top-28 bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
                            <p className="text-sm font-bold text-slate-700 mb-3">Kategoriler</p>
                            <div className="flex flex-col gap-1.5">
                                {sectionsWithId.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="text-sm px-3 py-2 rounded-lg text-slate-600 hover:text-[#1e3a8a] hover:bg-[#1e3a8a]/5 transition-colors"
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-10">
                        {sectionsWithId.map((section) => (
                            <div key={section.id} id={section.id} className="scroll-mt-28">
                                <h2 className="text-2xl font-bold text-[#1e3a8a] mb-5">{section.title}</h2>
                                <div className="space-y-3">
                                    {section.questions.map((item, index) => {
                                        const itemId = `${section.id}-${index}`;
                                        const isOpen = openItem === itemId;
                                        return (
                                            <div
                                                key={itemId}
                                                className={`rounded-xl border shadow-sm transition-all ${isOpen
                                                    ? "border-[#1e3a8a]/20 bg-[#1e3a8a]/5"
                                                    : "border-slate-200 bg-white"
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenItem((prev) => (prev === itemId ? null : itemId))}
                                                    className="w-full flex items-center justify-between text-left px-5 py-4 gap-4"
                                                >
                                                    <span className="font-bold text-[#1e3a8a]">{item.q}</span>
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-[#1e3a8a] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
                                                            }`}
                                                    />
                                                </button>

                                                {isOpen && (
                                                    <div className="px-5 pb-5 pt-0">
                                                        <p className="text-slate-600 leading-relaxed">{item.a}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
