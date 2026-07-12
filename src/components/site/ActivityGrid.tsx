import { useState } from "react";
import { X } from "lucide-react";
import type { Activity } from "@/data/activities";

export function ActivityGrid({ items }: { items: Activity[] }) {
  const [active, setActive] = useState<Activity | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, i) => (
          <button
            key={`${item.title}-${i}`}
            onClick={() => setActive(item)}
            className={`group relative overflow-hidden text-left ${i % 5 === 0 ? "sm:col-span-2 lg:col-span-2 aspect-[16/10]" : "aspect-[4/5]"}`}
            data-reveal
            data-reveal-delay={(i % 3) * 100}
          >
            <img
              src={item.src}
              alt={item.alt}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-gold mb-2">GTA Event</div>
              <div className="font-serif text-xl md:text-2xl leading-snug">{item.title}</div>
              <p className="mt-2 text-sm text-white/70 line-clamp-2">{item.caption}</p>
            </div>
          </button>
        ))}
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
            <img src={active.src} alt={active.alt} className="w-full max-h-[75vh] object-contain" />
            <figcaption className="mt-4 text-center">
              <div className="font-serif text-2xl text-white">{active.title}</div>
              <p className="mt-1 text-white/70 text-sm">{active.caption}</p>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
