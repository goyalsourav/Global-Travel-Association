import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { ActivityGrid } from "@/components/site/ActivityGrid";
import { eventsToActivities } from "@/data/activities";
import { useReveal, useSmoothScroll } from "@/lib/motion";
import { getEvents, getSiteContent } from "@/lib/api";

// How many grid tiles are shown before the "Show More" button appears.
const INITIAL_COUNT = 9;

export const Route = createFileRoute("/activities")({
  loader: async () => {
    const [events, content] = await Promise.all([getEvents(), getSiteContent()]);
    return { events, content };
  },
  head: () => ({
    meta: [
      { title: "Activities & Events — Global Travel Association (GTA)" },
      {
        name: "description",
        content:
          "FAM trips, educational sessions, sport, service — explore every activity and event that makes GTA a living association of India's travel agencies.",
      },
      { property: "og:title", content: "Activities & Events — Global Travel Association (GTA)" },
      {
        property: "og:description",
        content:
          "FAM trips, educational sessions, sport, service — explore every activity and event that makes GTA a living association of India's travel agencies.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/activities" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/activities" }],
  }),
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const { events, content } = Route.useLoaderData();
  const [showAll, setShowAll] = useState(false);
  useSmoothScroll();
  useReveal();

  const all = eventsToActivities(events);
  const visible = showAll ? all : all.slice(0, INITIAL_COUNT);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative bg-ink text-white pt-40 pb-24 md:pt-48 md:pb-32">
          <div className="container-page">
            <div className="max-w-3xl" data-reveal>
              <span className="eyebrow">
                <span className="gold-rule" />
                Activities & Events
              </span>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
                The <span className="italic text-gold">work</span> we do together.
              </h1>
              <p className="mt-5 text-white/70 leading-relaxed">
                FAM trips, educational sessions, sport, service — every activity that makes GTA a
                living association, not a directory.
              </p>
            </div>

            <div className="mt-14">
              <ActivityGrid items={visible} />
            </div>

            {!showAll && all.length > INITIAL_COUNT && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-medium rounded-sm hover:bg-white/10 transition-colors"
                >
                  Show More <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter contact={content.contact} />
      <FloatingActions />
    </div>
  );
}
