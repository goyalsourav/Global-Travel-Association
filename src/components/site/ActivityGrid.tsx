import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Activity } from "@/data/activities";

const arrowCls =
  "absolute top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-ink/60 text-white hover:bg-gold hover:text-ink transition-colors";

export function ActivityGrid({ items }: { items: Activity[] }) {
  // Which image each tile is showing, keyed by tile position.
  const [tileIndex, setTileIndex] = useState<Record<number, number>>({});
  const [active, setActive] = useState<{ item: Activity; index: number } | null>(null);

  function stepTile(i: number, item: Activity, delta: number) {
    setTileIndex((s) => {
      const n = item.images.length;
      return { ...s, [i]: ((s[i] ?? 0) + delta + n) % n };
    });
  }

  function stepLightbox(delta: number) {
    setActive((a) => {
      if (!a) return a;
      const n = a.item.images.length;
      return { item: a.item, index: (a.index + delta + n) % n };
    });
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, i) => {
          const count = item.images.length;
          const idx = Math.min(tileIndex[i] ?? 0, Math.max(count - 1, 0));
          const multi = count > 1;
          return (
            <div
              key={`${item.title}-${i}`}
              className={`group relative overflow-hidden ${i % 5 === 0 ? "sm:col-span-2 lg:col-span-2 aspect-[16/10]" : "aspect-[4/5]"}`}
              data-reveal
              data-reveal-delay={(i % 3) * 100}
            >
              <img
                src={item.images[idx]}
                alt={item.alt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <button
                onClick={() => setActive({ item, index: idx })}
                aria-label={`View ${item.title}`}
                className="absolute inset-0 z-10 cursor-pointer"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6 text-left">
                <div className="text-xs uppercase tracking-[0.22em] text-gold mb-2">GTA Event</div>
                <div className="font-serif text-xl md:text-2xl leading-snug">{item.title}</div>
                <p className="mt-2 text-sm text-white/70 line-clamp-2">{item.caption}</p>
              </div>
              {multi && (
                <>
                  <button
                    onClick={() => stepTile(i, item, -1)}
                    aria-label="Previous image"
                    className={`${arrowCls} left-3`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => stepTile(i, item, 1)}
                    aria-label="Next image"
                    className={`${arrowCls} right-3`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute right-3 top-3 z-10 rounded-full bg-ink/60 px-2.5 py-1 text-xs text-white">
                    {idx + 1} / {count}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-gold"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <figure className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={active.item.images[active.index]}
                alt={active.item.alt}
                className="w-full max-h-[75vh] object-contain"
              />
              {active.item.images.length > 1 && (
                <>
                  <button
                    onClick={() => stepLightbox(-1)}
                    aria-label="Previous image"
                    className={`${arrowCls} left-2 md:-left-14`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => stepLightbox(1)}
                    aria-label="Next image"
                    className={`${arrowCls} right-2 md:-right-14`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            <figcaption className="mt-4 text-center">
              <div className="font-serif text-2xl text-white">{active.item.title}</div>
              <p className="mt-1 text-white/70 text-sm">{active.item.caption}</p>
              {active.item.images.length > 1 && (
                <p className="mt-1.5 text-xs text-white/50">
                  {active.index + 1} / {active.item.images.length}
                </p>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
