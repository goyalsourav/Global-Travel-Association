import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, QrCode, Building2 } from "lucide-react";

const checklist = [
  "Aadhar card & profile picture",
  "MSME / Trade License / Gomasta (PDF)",
  "GST certificate & visiting card",
  "Two references from existing GTA members",
];

export function Membership() {
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
            <div className="bg-ink text-white p-8 md:p-10 h-full">
              <span className="eyebrow" style={{ color: "var(--gold)" }}>
                <span className="gold-rule" />
                Membership Payment
              </span>
              <h3 className="mt-3 font-serif text-2xl">Pay via UPI or bank transfer.</h3>
              <p className="mt-2 text-sm text-white/70">
                Complete your payment after submitting the form. Our team will confirm your
                membership within 24–48 hours.
              </p>

              <div className="mt-8 grid gap-6">
                <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10">
                  <div className="grid h-24 w-24 shrink-0 place-items-center bg-white text-ink">
                    <QrCode className="h-14 w-14" strokeWidth={1} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.22em] text-gold">Scan to Pay</div>
                    <div className="mt-1 font-serif text-lg">UPI QR Code</div>
                    <p className="mt-1 text-xs text-white/60">[Upload actual UPI QR image here]</p>
                  </div>
                </div>

                <div className="p-5 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-[0.22em]">
                    <Building2 className="h-4 w-4" /> Bank Transfer
                  </div>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    <BankRow label="Account Name" value="[Account Name]" />
                    <BankRow label="Account Number" value="[Account Number]" />
                    <BankRow label="IFSC Code" value="[IFSC Code]" />
                    <BankRow label="Bank Name" value="[Bank Name]" />
                    <BankRow label="Branch" value="[Branch]" />
                  </dl>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 border-b border-white/10 pb-2 last:border-0">
      <dt className="text-white/60 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="text-white font-mono text-sm text-right">{value}</dd>
    </div>
  );
}
