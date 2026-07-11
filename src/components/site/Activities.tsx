import { useState } from "react";
import { X } from "lucide-react";

type Item = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

const items: Item[] = [
  {
    src: "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80",
    alt: "Members on FAM trip through the forests of Kanha National Park",
    title: "Tathastu Kanha FAM",
    caption: "A familiarisation trip through the wilderness of Kanha with partner resorts.",
  },
  {
    src: "https://images.unsplash.com/photo-1585484173186-14b13c0a3d6b?auto=format&fit=crop&w=1400&q=80",
    alt: "Educational session on Char Dham and Kailash Mansarovar pilgrimages",
    title: "Char Dham & Kailash Mansarovar",
    caption: "An educational session for members on pilgrimage circuit planning.",
  },
  {
    src: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1400&q=80",
    alt: "GTA cricket team playing at TAFI industry tournament",
    title: "GTA Cricket Team — TAFI Tournament",
    caption: "Representing GTA on the field at the TAFI inter-association tournament.",
  },
  {
    src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=80",
    alt: "Charity event at Lions Club Vriddhashram donating a water purifier",
    title: "Charity at Lions Club Vriddhashram",
    caption: "Donating a water purifier to support residents at the community home.",
  },
  {
    src: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80",
    alt: "GTA members at cricket practice sessions",
    title: "Cricket Practices",
    caption: "Weekly practice sessions building camaraderie among member agencies.",
  },
  {
    src: "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?auto=format&fit=crop&w=1400&q=80",
    alt: "Members visiting Narayani Farms and Resort during FAM trip",
    title: "FAM at Narayani Farms & Resort",
    caption: "Exploring the property, hospitality and experiences at Narayani Farms.",
  },
];

export function Activities() {
  const [active, setActive] = useState<Item | null>(null);

  return (
    <section id="activities" className="relative bg-ink text-white py-24 md:py-32">
      <div className="container-page">
        <div className="max-w-3xl" data-reveal>
          <span className="eyebrow"><span className="gold-rule" />Activities & Events</span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
            The <span className="italic text-gold">work</span> we do together.
          </h2>
          <p className="mt-5 text-white/70 leading-relaxed">
            FAM trips, educational sessions, sport, service — the activities that make
            GTA a living association, not a directory.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <button
              key={item.title}
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
          <figure
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={active.src} alt={active.alt} className="w-full max-h-[75vh] object-contain" />
            <figcaption className="mt-4 text-center">
              <div className="font-serif text-2xl text-white">{active.title}</div>
              <p className="mt-1 text-white/70 text-sm">{active.caption}</p>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
