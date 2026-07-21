import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  defaultAbout,
  defaultBearers,
  type AboutContent,
  type Bearer,
  type FoundingMember,
} from "@/data/siteContent";
import { FoundersCarousel } from "./FoundersCarousel";

// Shown until founding members are added from the admin panel.
const defaultFounderNames = [
  "Shubham Agrawal",
  "Manish Jain",
  "Rahul Waswani",
  "Rahul Khoobchandani",
  "Akash Dudani",
  "Satish Kumar",
  "Shailesh Agrawal",
];

const fallbackFounders: FoundingMember[] = defaultFounderNames.map((name, i) => ({
  id: -(i + 1),
  name,
  imageUrl: "",
  createdAt: "",
}));

const roadmap = [
  {
    year: "2024",
    title: "Founded in Chhattisgarh",
    detail: "Established as a professional association for travel agencies in Chhattisgarh.",
  },
  {
    year: "Next",
    title: "Chhattisgarh Chapter",
    detail: "Onboarding agencies across the state and formalising regional chapters.",
  },
  {
    year: "Soon",
    title: "PAN India Network",
    detail: "Expanding into a nationwide alliance of trusted travel professionals.",
  },
  {
    year: "Beyond",
    title: "Global Partnerships",
    detail: "Building alliances with international travel organisations and tourism boards.",
  },
];

export function About({
  about = defaultAbout,
  bearers = defaultBearers,
  founders = [],
}: {
  about?: AboutContent;
  bearers?: Bearer[];
  founders?: FoundingMember[];
}) {
  const founderCards = founders.length > 0 ? founders : fallbackFounders;
  return (
    <section id="about" className="relative bg-background text-foreground py-24 md:py-32">
      <div className="container-page">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5" data-reveal>
            <img
              src={about.image}
              alt="GTA leadership and members convened at a professional gathering"
              className="w-full aspect-[4/5] object-cover rounded-sm"
              loading="lazy"
            />
            <div className="mt-4 bg-gold text-ink p-6">
              <div className="text-4xl font-serif">2024</div>
              <div className="mt-2 text-xs uppercase tracking-[0.24em] text-ink/70">
                Founded in Chhattisgarh
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <div data-reveal>
              <span className="eyebrow">
                <span className="gold-rule" />
                About the Association
              </span>
              <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-tight text-ink">
                A trusted alliance for India's travel industry.
              </h2>
              <p className="mt-6 text-lg text-charcoal leading-relaxed">{about.intro}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8" data-reveal data-reveal-delay="120">
              <article className="border-t border-ink/10 pt-6">
                <h3 className="font-serif text-2xl text-ink">Our Vision</h3>
                <p className="mt-3 text-charcoal leading-relaxed">{about.vision}</p>
              </article>
              <article className="border-t border-gold pt-6">
                <h3 className="font-serif text-2xl text-ink">Our Mission</h3>
                <p className="mt-3 text-charcoal leading-relaxed">{about.mission}</p>
              </article>
            </div>
          </div>
        </div>

        {/* Leadership */}
        <div className="mt-28">
          <div className="flex items-end justify-between flex-wrap gap-4" data-reveal>
            <div>
              <span className="eyebrow">
                <span className="gold-rule" />
                Leadership
              </span>
              <h3 className="mt-3 font-serif text-3xl md:text-4xl text-ink">Our Office Bearers</h3>
            </div>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {bearers.map((l, i) => (
              <div
                key={`${l.role}-${i}`}
                className="group relative bg-ink text-white overflow-hidden"
                data-reveal
                data-reveal-delay={i * 100}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={l.image}
                    alt={`${l.name}, ${l.role} of Global Travel Association`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 border-t border-gold/40">
                  <div className="text-xs uppercase tracking-[0.24em] text-gold">{l.role}</div>
                  <div className="mt-1 font-serif text-2xl">{l.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founders */}
        <div className="mt-24 bg-secondary p-8 md:p-12" data-reveal>
          <span className="eyebrow">
            <span className="gold-rule" />
            Founding Members
          </span>
          <h3 className="mt-3 font-serif text-2xl md:text-3xl text-ink">
            The people who started it.
          </h3>
          <div className="mt-8">
            <FoundersCarousel founders={founderCards} />
          </div>
          <div className="mt-8">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-medium rounded-full hover:bg-gold-soft transition-colors"
            >
              Meet All Our Members <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mt-24">
          <div data-reveal>
            <span className="eyebrow">
              <span className="gold-rule" />
              Roadmap
            </span>
            <h3 className="mt-3 font-serif text-3xl md:text-4xl text-ink">
              From Chhattisgarh to the world.
            </h3>
          </div>
          <ol className="mt-12 relative grid md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute left-0 right-0 top-6 h-px bg-ink/10" />
            {roadmap.map((r, i) => (
              <li key={r.title} className="relative" data-reveal data-reveal-delay={i * 120}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-ink text-gold font-serif border border-gold/50">
                    {i + 1}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-gold">{r.year}</span>
                </div>
                <h4 className="font-serif text-xl text-ink">{r.title}</h4>
                <p className="mt-2 text-sm text-charcoal leading-relaxed">{r.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
