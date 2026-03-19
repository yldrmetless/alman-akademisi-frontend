import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, PhoneCall } from "lucide-react";

type FooterProps = {
    logoSrc?: string;
};

const branchOfficeAddress =
    "Atakent, 3131. Sk. 10/B, 55000 Atakum, Samsun, Türkiye.";
const researchDeptAddress =
    "Aksu Mah. Yurt Sk. OMÜ Yerleşkesi, Samsun Teknopark NO: 165 Atakum, Samsun, Türkiye.";
const footerGridConfig =
    "grid gap-8 text-left border-b pb-12 mb-8 md:grid-cols-5";
const argeDeptFooterLink = { label: "Ar-Ge Departmanı", href: "/arge-departmani" } as const;
const corporateLinks = [
    { label: "Hakkımızda", href: "#" },
    { label: "Gizlilik Politikası", href: "#" },
    { label: "Kullanım Şartları", href: "#" },
    argeDeptFooterLink,
] as const;
const footerNavList = "space-y-2 text-sm text-slate-600";

export function Footer({ logoSrc = "/logo.webp" }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const developerLinkProps = {
        href: "https://vizimagency.com",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-[#1e3a8a]",
    } as const;

    const renderDeveloperCredit = () => (
        <Link {...developerLinkProps} aria-label="Vizim Digital Agency">
            <span className="font-medium">Developed by Vizim.</span>
            <Image
                src="/vizim.png"
                alt="Vizim Digital Agency"
                width={96}
                height={24}
                className="h-6 w-auto object-contain"
            />
        </Link>
    );

    return (
        <footer className="bg-slate-50 border-t pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6 text-center">

                <div className={footerGridConfig}>
                    <div className="md:col-span-1">
                        <div className="mb-4">
                            <Link href="/">
                                {logoSrc.startsWith("http://") || logoSrc.startsWith("https://") ? (
                                    <img
                                        src={logoSrc}
                                        alt="Alman Akademisi Logo"
                                        className="h-16 w-auto object-contain"
                                    />
                                ) : (
                                    <Image
                                        src={logoSrc}
                                        alt="Alman Akademisi Logo"
                                        width={200}
                                        height={100}
                                        className="h-16 w-auto object-contain"
                                    />
                                )}
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Kurumsal</h4>
                        <ul className={footerNavList}>
                            {corporateLinks.map((linkItem) => (
                                <li key={linkItem.label}>
                                    <Link href={linkItem.href}>{linkItem.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Hızlı Linkler</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="#">Online Kurslar</Link></li>
                            <li><Link href="/kurslar/ozel-ders">Birebir Eğitim</Link></li>
                            <li><Link href="/sikca-sorulan-sorular">Sıkça Sorulan Sorular</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Adreslerimiz</h4>
                        <div className="grid gap-3 text-sm text-slate-600">
                            <div className="py-3">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                                    <p className="font-semibold text-slate-700">Samsun Şubesi</p>
                                </div>
                                <p className="leading-relaxed text-slate-600">
                                    {branchOfficeAddress}
                                </p>
                            </div>
                            <div className=" py-3">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                                    <p className="font-semibold text-slate-700">ARGE Departmanı</p>
                                </div>
                                <p className="leading-relaxed text-slate-600">
                                    {researchDeptAddress}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">İletişim</h4>
                        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-1">
                            <div className="py-2.5">
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

                            <div className=" py-2.5">
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
                        </div>
                    </div>
                </div>

                <div className="mt-2 border-t border-slate-200 bg-slate-100/60 rounded-xl px-4 py-3">
                    <div className="flex flex-col items-center justify-between gap-3 text-slate-500 text-xs sm:flex-row">
                        <p>{currentYear} Alman Akademisi. Tüm Hakları Saklıdır.</p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {renderDeveloperCredit()}
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
            </div>
        </footer>
    );
}
