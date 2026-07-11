import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2400&q=80"
          alt="Delegates and travel professionals gathered at an industry conference"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/70 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--ink)_85%)]" />
      </div>

      <div className="relative z-10 container-page text-center pt-24">
        <div className="flex justify-center mb-8" data-reveal>
          <div className="flex items-center gap-3 px-4 py-2 border border-gold/40 rounded-full text-gold text-xs uppercase tracking-[0.28em]">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Est. 2026 · Raipur, India
          </div>
        </div>

        <h1
          className="font-serif text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.02] max-w-5xl mx-auto"
          data-reveal
          data-reveal-delay="120"
        >
          Global Travel <span className="italic text-gold">Association</span>
        </h1>

        <div className="mt-8 flex flex-col items-center gap-6" data-reveal data-reveal-delay="240">
          <div className="flex items-center gap-4 text-white/90 font-serif text-xl md:text-2xl italic">
            <span className="h-px w-8 bg-gold" />
            Integrate — Innovate — Inspire
            <span className="h-px w-8 bg-gold" />
          </div>
          <p className="max-w-2xl text-white/70 text-base md:text-lg leading-relaxed">
            India's growing network of trusted travel agencies — connecting,
            empowering, and elevating the travel industry together.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4" data-reveal data-reveal-delay="360">
          <a
            href="#membership"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors"
          >
            Become a Member
          </a>
          <a
            href="#about"
            className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-sm hover:bg-white/10 transition-colors"
          >
            Our Story
          </a>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/60 hover:text-gold transition-colors"
        aria-label="Scroll to About"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  );
}
