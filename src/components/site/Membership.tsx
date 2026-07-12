import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { defaultPayment, type PaymentContent } from "@/data/siteContent";
import { PaymentPanel } from "./PaymentPanel";

const checklist = [
  "Aadhar card & profile picture",
  "MSME / Trade License / Gomasta (PDF)",
  "GST certificate & visiting card",
  "Two references from existing GTA members",
];

export function Membership({ payment = defaultPayment }: { payment?: PaymentContent }) {
  return (
    <section id="membership" className="relative bg-background text-foreground py-24 md:py-32">
      <div className="container-page">
        <div className="max-w-3xl" data-reveal>
          <span className="eyebrow">
            <span className="gold-rule" />
            Membership
          </span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-tight text-ink">
            Join a network built on <span className="italic text-gold">trust</span>.
          </h2>
          <p className="mt-5 text-charcoal leading-relaxed">
            Applications are reviewed by the office bearers. Our team confirms your membership
            within 24–48 hours of receiving your application and payment.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-12 gap-10">
          {/* Application CTA */}
          <div className="lg:col-span-7" data-reveal>
            <div className="bg-secondary p-8 md:p-10 h-full border-l-2 border-gold flex flex-col">
              <span className="text-xs uppercase tracking-[0.22em] text-gold">Apply Online</span>
              <h3 className="mt-3 font-serif text-2xl md:text-3xl text-ink">
                Complete your application in a few minutes.
              </h3>
              <p className="mt-3 text-charcoal leading-relaxed">
                A short step-by-step form — your progress saves automatically, so you can pause and
                pick up right where you left off. Keep these handy:
              </p>
              <ul className="mt-6 space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-charcoal">
                    <Check className="h-5 w-5 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-8 mt-auto">
                <Link
                  to="/join"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-white font-medium hover:bg-charcoal transition-colors rounded-sm"
                >
                  Start Your Application <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Payment panel */}
          <aside className="lg:col-span-5" data-reveal data-reveal-delay="150">
            <PaymentPanel payment={payment} />
          </aside>
        </div>
      </div>
    </section>
  );
}
