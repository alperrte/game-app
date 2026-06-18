import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../../../utils/cn";
import type { SpotlightBanner } from "../../types/spotlight.types";

interface SpotlightCarouselProps {
    banners: SpotlightBanner[];
}

export function SpotlightCarousel({ banners }: SpotlightCarouselProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (banners.length <= 1) return;

        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % banners.length);
        }, 7000);

        return () => window.clearInterval(timer);
    }, [banners.length]);

    if (banners.length === 0) return null;

    const banner = banners[index];

    function goPrev() {
        setIndex((current) =>
            current === 0 ? banners.length - 1 : current - 1,
        );
    }

    function goNext() {
        setIndex((current) => (current + 1) % banners.length);
    }

    return (
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-violet-400/25 shadow-[0_0_60px_rgba(124,58,237,0.15)]">
            <a
                href={banner.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-[21/7] min-h-[180px] sm:min-h-[220px]"
            >
                <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                    <span className="mb-3 inline-flex w-fit rounded-full border border-fuchsia-400/35 bg-fuchsia-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-100">
                        Spotlight
                    </span>
                    <h2 className="max-w-2xl text-2xl font-black text-white sm:text-3xl">
                        {banner.title}
                    </h2>
                    {banner.subtitle ? (
                        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                            {banner.subtitle}
                        </p>
                    ) : null}
                </div>
            </a>

            {banners.length > 1 ? (
                <>
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Önceki banner"
                        className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-violet-400/40"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Sonraki banner"
                        className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-violet-400/40"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <div className="absolute bottom-4 right-6 flex gap-2">
                        {banners.map((item, dotIndex) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={`Banner ${dotIndex + 1}`}
                                onClick={() => setIndex(dotIndex)}
                                className={cn(
                                    "h-2 rounded-full transition-all",
                                    dotIndex === index
                                        ? "w-6 bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                                        : "w-2 bg-white/30 hover:bg-white/50",
                                )}
                            />
                        ))}
                    </div>
                </>
            ) : null}
        </section>
    );
}
