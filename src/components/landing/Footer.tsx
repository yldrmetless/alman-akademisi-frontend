import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, PhoneCall } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-slate-50 border-t pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6 text-center">

                <div className="grid gap-8 md:grid-cols-4 text-left border-b pb-12 mb-8">
                    <div className="md:col-span-1">
                        <div className="mb-4">
                            <Link href="/">
                                <Image
                                    src="/logo.webp"
                                    alt="Alman Akademisi Logo"
                                    width={200}
                                    height={100}
                                    className="h-24 w-auto object-contain"
                                />
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                            Türkiye'nin lider dijital dil akademisi. Almanca'yı modern metotlarla, uzmandan online dilde öğrenin.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Kurumsal</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="#">Hakkımızda</Link></li>
                            <li><Link href="#">Gizlilik Politikası</Link></li>
                            <li><Link href="#">Kullanım Şartları</Link></li>
                            <li><Link href="#">Eğitmen Başvurusu</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Hızlı Linkler</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="#">Online Kurslar</Link></li>
                            <li><Link href="#">Whatsapp Kulübü</Link></li>
                            <li><Link href="#">Birebir Eğitim</Link></li>
                            <li><Link href="#">Sıkça Sorulan Sorular</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">İletişim</h4>
                        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-1">
                            <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">E-posta</p>
                                    <a
                                        href="mailto:merhaba@almanakademisi.com"
                                        className="font-medium text-slate-700 transition-colors hover:text-[#1e3a8a] hover:underline"
                                    >
                                        merhaba@almanakademisi.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5">
                                <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hemen Ara</p>
                                    <a
                                        href="tel:08508408303"
                                        className="font-medium text-slate-700 transition-colors hover:text-[#1e3a8a] hover:underline"
                                    >
                                        0 850 840 8303
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2.5">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Adres</p>
                                    <p className="leading-relaxed text-slate-700">
                                        TEKNOPARK SAMSUN Aksu Mah. Yurt Sk. OMÜ Yerleşkesi, Samsun Teknopark No: 165 Atakum/Samsun
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2 border-t border-slate-200 bg-slate-100/60 rounded-xl px-4 py-3">
                    <div className="flex flex-col items-center justify-between gap-3 text-slate-500 text-xs sm:flex-row">
                        <p>© {new Date().getFullYear()} Alman Akademisi. Tüm hakları korunmaktadır.</p>
                        <div className="flex items-center gap-3">
                            <span className="font-medium">Bağlantı kurun</span>
                            <Link
                                href="https://instagram.com/almanakademisi"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="transition-colors hover:text-pink-600"
                            >
                                <Instagram className="h-4 w-4" />
                            </Link>
                            <Link
                                href="https://www.linkedin.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="transition-colors hover:text-blue-700"
                            >
                                <Linkedin className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
