import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Activities } from "@/components/site/Activities";
import { Membership } from "@/components/site/Membership";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingActions } from "@/components/site/FloatingActions";
import { useReveal, useSmoothScroll } from "@/lib/motion";
import { getEvents, getFoundingMembers, getSiteContent } from "@/lib/api";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Global Travel Association",
  alternateName: "GTA",
  url: "https://www.globaltravelassociation.com",
  email: "globaltravelsassociation@gmail.com",
  foundingDate: "2024",
  slogan: "Integrate — Innovate — Inspire",
  description:
    "Global Travel Association (GTA) is an India-based association of travel agencies established in 2024, headquartered in Chhattisgarh, uniting and empowering travel agencies through collaboration, knowledge sharing and ethical business practices.",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Chhattisgarh",
    addressCountry: "IN",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Global Travel Association?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Global Travel Association (GTA) is an India-based association of travel agencies established in 2024 with a global vision to unite, empower and elevate travel agencies through collaboration, knowledge sharing and ethical business practices.",
      },
    },
    {
      "@type": "Question",
      name: "Where is GTA based?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GTA is headquartered in Chhattisgarh, India, and is expanding across PAN India.",
      },
    },
    {
      "@type": "Question",
      name: "How do I become a GTA member?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Travel agencies can apply for membership by submitting the membership application form on the GTA website and completing payment via UPI or direct bank transfer. The GTA team confirms membership within 24–48 hours.",
      },
    },
  ],
};

export const Route = createFileRoute("/")({
  loader: async () => {
    const [content, events, founders] = await Promise.all([
      getSiteContent(),
      getEvents(),
      getFoundingMembers(),
    ]);
    return { content, events, founders };
  },
  head: () => ({
    meta: [
      { title: "Global Travel Association (GTA) — India's Trusted Alliance of Travel Agencies" },
      {
        name: "description",
        content:
          "Global Travel Association (GTA) is an India-based association of travel agencies founded in 2024 in Chhattisgarh, uniting travel professionals PAN India through collaboration, events and ethical practice.",
      },
      {
        property: "og:title",
        content: "Global Travel Association (GTA) — India's Trusted Alliance of Travel Agencies",
      },
      {
        property: "og:description",
        content:
          "Global Travel Association (GTA) is an India-based association of travel agencies founded in 2024 in Chhattisgarh, uniting travel professionals PAN India through collaboration, events and ethical practice.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(orgJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
    ],
  }),
  component: Home,
});

function Home() {
  const { content, events, founders } = Route.useLoaderData();
  useSmoothScroll();
  useReveal();
  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <About about={content.about} bearers={content.bearers} founders={founders} />
        <Activities events={events} />
        <Membership payment={content.payment} />
        <Contact contact={content.contact} />
      </main>
      <SiteFooter contact={content.contact} />
      <FloatingActions />
    </div>
  );
}
