import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { JoinWizard } from "@/components/join/JoinWizard";
import { useReveal, useSmoothScroll } from "@/lib/motion";
import { getSiteContent } from "@/lib/api";

export const Route = createFileRoute("/join")({
  loader: async () => ({ content: await getSiteContent() }),
  head: () => ({
    meta: [
      { title: "Become a Member — Global Travel Association (GTA)" },
      {
        name: "description",
        content:
          "Apply for GTA membership — join India's growing network of trusted travel agencies. Complete the application in a few minutes; your progress is saved automatically.",
      },
      { property: "og:title", content: "Become a Member — Global Travel Association (GTA)" },
      {
        property: "og:description",
        content:
          "Apply for GTA membership — join India's growing network of trusted travel agencies.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/join" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/join" }],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { content } = Route.useLoaderData();
  useSmoothScroll();
  useReveal();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative bg-ink text-white pt-36 pb-16 md:pt-44 md:pb-20">
          <div className="container-page">
            <div className="max-w-3xl" data-reveal>
              <span className="eyebrow">
                <span className="gold-rule" />
                Membership Application
              </span>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
                Join a network built on <span className="italic text-gold">trust</span>.
              </h1>
              <p className="mt-5 text-white/70 leading-relaxed">
                A few minutes is all it takes. Your progress is saved on this device automatically —
                you can leave and pick up right where you stopped.
              </p>
            </div>
          </div>
        </section>

        <section className="relative bg-background py-14 md:py-20">
          <div className="container-page">
            <JoinWizard payment={content.payment} />
          </div>
        </section>
      </main>
      <SiteFooter contact={content.contact} />
      <FloatingActions />
    </div>
  );
}
