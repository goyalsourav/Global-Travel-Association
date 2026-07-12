import { Link } from "@tanstack/react-router";
import { activities } from "@/data/activities";
import { ActivityGrid } from "./ActivityGrid";

// Homepage overview is capped so it stays compact even as more activities
// are added to the data source — the full list lives on the /activities page.
const FEATURED_COUNT = 6;

export function Activities() {
  const featured = activities.slice(0, FEATURED_COUNT);

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

        <div className="mt-14">
          <ActivityGrid items={featured} />
        </div>

        <div className="mt-12 flex justify-center" data-reveal>
          <Link
            to="/activities"
            className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-sm hover:bg-white/10 transition-colors"
          >
            View More Activities
          </Link>
        </div>
      </div>
    </section>
  );
}
