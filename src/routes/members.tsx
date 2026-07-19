import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Search, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { useReveal, useSmoothScroll } from "@/lib/motion";
import { getPublicMembers, getSiteContent } from "@/lib/api";

export const Route = createFileRoute("/members")({
  loader: async () => {
    const [members, content] = await Promise.all([getPublicMembers(), getSiteContent()]);
    return { members, content };
  },
  head: () => ({
    meta: [
      { title: "Our Members — Global Travel Association (GTA)" },
      {
        name: "description",
        content:
          "The travel agencies and professionals that make up the Global Travel Association — a growing network of trusted members across India.",
      },
      { property: "og:title", content: "Our Members — Global Travel Association (GTA)" },
      {
        property: "og:description",
        content:
          "The travel agencies and professionals that make up the Global Travel Association.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/members" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/members" }],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { members, content } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  useSmoothScroll();
  useReveal();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.firmName.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative bg-ink text-white pt-36 pb-16 md:pt-44 md:pb-20">
          <div className="container-page">
            <div className="max-w-3xl" data-reveal>
              <span className="eyebrow">
                <span className="gold-rule" />
                Our Members
              </span>
              <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">
                The <span className="italic text-gold">agencies</span> behind the association.
              </h1>
              <p className="mt-5 text-white/70 leading-relaxed">
                {members.length > 0
                  ? `${members.length} trusted travel ${members.length === 1 ? "agency" : "agencies"} — and growing across India.`
                  : "A growing network of trusted travel agencies across India."}
              </p>
            </div>
          </div>
        </section>

        <section className="relative bg-background py-14 md:py-20">
          <div className="container-page">
            <div className="max-w-md" data-reveal>
              <label htmlFor="member-search" className="sr-only">
                Search members
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/50" />
                <input
                  id="member-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or agency…"
                  className="w-full bg-white border border-ink/15 focus:border-gold outline-none rounded-sm pl-11 pr-4 py-3 text-ink transition-colors placeholder:text-charcoal/40"
                />
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="mt-14 flex flex-col items-center gap-3 py-16 text-center" data-reveal>
                <Users className="h-8 w-8 text-gold" />
                <p className="text-charcoal">
                  {members.length === 0
                    ? "Member profiles will appear here soon."
                    : "No members match your search."}
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((m, i) => (
                  <div
                    key={m.id}
                    className="group bg-white p-6 border border-ink/5 hover:border-gold transition-colors"
                    data-reveal
                    data-reveal-delay={(i % 3) * 80}
                  >
                    <div className="flex items-center gap-2 text-gold">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      <span className="text-xs uppercase tracking-[0.22em]">Member</span>
                    </div>
                    <div className="mt-3 font-serif text-xl text-ink leading-snug">
                      {m.firmName || m.name}
                    </div>
                    {m.firmName && <div className="mt-1 text-sm text-charcoal">{m.name}</div>}
                    {m.city && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-charcoal/70">
                        <MapPin className="h-3.5 w-3.5 text-gold" />
                        {m.city}
                      </div>
                    )}
                  </div>
                ))}
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
