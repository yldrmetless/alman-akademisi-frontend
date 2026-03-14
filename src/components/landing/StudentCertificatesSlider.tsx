"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const CERTIFICATE_IMAGES = [
    "/sertifika1.webp",
    "/sertifika2.webp",
    "/sertifika3.webp",
    "/sertifika4.webp",
    "/sertifika5.webp",
    "/sertifika6.webp",
    "/sertifika7.webp",
];

export function StudentCertificatesSlider() {
    const [api, setApi] = useState<CarouselApi>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapCount, setSnapCount] = useState(0);

    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            setSelectedIndex(api.selectedScrollSnap());
        };

        setSnapCount(api.scrollSnapList().length);
        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);

        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    useEffect(() => {
        if (!api) return;
        const interval = setInterval(() => {
            api.scrollNext();
        }, 3500);

        return () => clearInterval(interval);
    }, [api]);

    const preventDefault = (event: React.SyntheticEvent) => {
        event.preventDefault();
    };

    return (
        <section className="bg-slate-50 py-14 md:py-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                        Öğrencilerimizin Sertifikaları
                    </h2>
                </div>

                <div className="relative rounded-[28px] bg-white/60 p-4 shadow-sm backdrop-blur-[2px] md:p-6">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: true, align: "start" }}
                        className="w-full select-none"
                    >
                        <CarouselContent>
                            {CERTIFICATE_IMAGES.map((src, index) => (
                                <CarouselItem key={src} className="basis-full md:basis-1/2 lg:basis-1/4">
                                    <div
                                        className="group relative overflow-hidden rounded-[24px] border-2 border-white bg-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
                                        onContextMenu={preventDefault}
                                        onDragStart={preventDefault}
                                    >
                                        <div className="pointer-events-none absolute inset-0 z-10 rounded-[24px] bg-white/0" />
                                        <div className="relative aspect-3/4 select-none">
                                            <Image
                                                src={src}
                                                alt={`Öğrenci sertifikası ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="pointer-events-none select-none object-cover"
                                                draggable={false}
                                                onContextMenu={preventDefault}
                                                onDragStart={preventDefault}
                                            />
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <CarouselPrevious className="left-2 h-10 w-10 border-slate-200 bg-white/90 text-primary shadow-sm hover:bg-white" />
                        <CarouselNext className="right-2 h-10 w-10 border-slate-200 bg-white/90 text-primary shadow-sm hover:bg-white" />
                    </Carousel>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        {Array.from({ length: snapCount }).map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => api?.scrollTo(index)}
                                className={`h-2.5 rounded-full transition-all ${selectedIndex === index ? "w-6 bg-primary" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`}
                                aria-label={`Sertifika slaytı ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
