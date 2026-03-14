import Image from "next/image";

const PARTNER_LOGOS = [
    "/m1.webp",
    "/m2.webp",
    "/m3.webp",
    "/m4.webp",
    "/m5.webp",
    "/m6.webp",
    "/m7.webp",
    "/m8.webp",
    "/m9.webp",
    "/m10.webp",
    "/m11.webp",
];

export function ModernPartnerLogosSection() {
    const loopLogos = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

    return (
        <section className="bg-white py-12 md:py-14">
            <div className="container mx-auto px-4 md:px-6">
                <h3 className="mb-8 text-center text-lg font-bold tracking-[0.16em] text-slate-500 md:text-base">
                    BİRLİKTE DAHA GÜÇLÜ ÇALIŞIYORUZ
                </h3>

                <div className="partner-logo-mask overflow-hidden">
                    <div className="partner-logo-track flex w-max items-center gap-8 md:gap-10">
                        {loopLogos.map((logoSrc, index) => (
                            <div
                                key={`${logoSrc}-${index}`}
                                className="relative h-10 w-[110px] shrink-0 md:h-12 md:w-[130px] lg:h-14 lg:w-[140px]"
                            >
                                <Image
                                    src={logoSrc}
                                    alt={`Partner logo ${index + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 140px"
                                    className="object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
