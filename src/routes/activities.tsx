import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { ActivityGrid } from "@/components/site/ActivityGrid";
import { activities } from "@/data/activities";
import { useReveal, useSmoothScroll } from "@/lib/motion";

export const Route = createFileRoute("/activities")({
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
  useSmoothScroll();
  useReveal();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative bg-ink text-white pt-40 pb-24 md:pt-48 md:pb-32">
          <div className="container-page">
            <div className="max-w-3xl" data-reveal>
              <span className="eyebrow"><span className="gold-rule" />Activities & Events</span>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
                The <span className="italic text-gold">work</span> we do together.
              </h1>
              <p className="mt-5 text-white/70 leading-relaxed">
                FAM trips, educational sessions, sport, service — every activity that
                makes GTA a living association, not a directory.
              </p>
            </div>

            <div className="mt-14">
              <ActivityGrid items={activities} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingActions />
    </div>
  );
}
