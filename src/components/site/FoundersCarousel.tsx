import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FoundingMember } from "@/data/siteContent";

// How long each card stays before the row rotates to the next one.
const AUTO_ADVANCE_MS = 3500;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Looping row of small founder cards: rotates by itself, arrows step it
// manually, and on touch screens the cards can also be swiped in from the side.
export function FoundersCarousel({ founders }: { founders: FoundingMember[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [emblaApi, paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {founders.map((f) => (
            <div
              key={f.id}
              className="min-w-0 shrink-0 grow-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 pl-4"
            >
              <div className="h-full bg-white border border-ink/10 rounded-sm p-5 text-center hover:border-gold transition-colors">
                {f.imageUrl ? (
                  <img
                    src={f.imageUrl}
                    alt={f.name}
                    className="mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-gold/50"
                    loading="lazy"
                  />
                ) : (
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink text-gold font-serif text-xl ring-2 ring-gold/50">
                    {initials(f.name)}
                  </span>
                )}
                <div className="mt-4 text-sm font-medium text-ink leading-snug">{f.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gold">
                  Founder
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-center md:justify-end gap-3">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous founding members"
          className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink hover:border-gold hover:text-gold transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next founding members"
          className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink hover:border-gold hover:text-gold transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
