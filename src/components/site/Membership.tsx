import { useState, type FormEvent } from "react";
import { Check, QrCode, Building2 } from "lucide-react";

export function Membership() {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    name: "", agency: "", phone: "", email: "", location: "", years: "", message: "",
  });

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.name || !values.agency || !values.email || !values.phone) return;
    // TODO: wire to backend
    setSubmitted(true);
  }

  return (
    <section id="membership" className="relative bg-background text-foreground py-24 md:py-32">
      <div className="container-page">
        <div className="max-w-3xl" data-reveal>
          <span className="eyebrow"><span className="gold-rule" />Membership</span>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-tight text-ink">
            Join a network built on <span className="italic text-gold">trust</span>.
          </h2>
          <p className="mt-5 text-charcoal leading-relaxed">
            Applications are reviewed by the office bearers. Our team confirms your
            membership within 24–48 hours of receiving your application and payment.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-12 gap-10">
          {/* Form */}
          <div className="lg:col-span-7" data-reveal>
            {submitted ? (
              <div className="bg-secondary p-10 border-l-2 border-gold">
                <div className="flex items-center gap-3 text-gold">
                  <Check className="h-6 w-6" />
                  <div className="text-xs uppercase tracking-[0.22em]">Application received</div>
                </div>
                <h3 className="mt-4 font-serif text-3xl text-ink">Thank you, {values.name.split(" ")[0]}.</h3>
                <p className="mt-3 text-charcoal">
                  Your application has been recorded. A member of the GTA team will
                  reach out to <span className="text-ink font-medium">{values.email}</span> within
                  24–48 hours to confirm your membership and share next steps.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setValues({ name: "", agency: "", phone: "", email: "", location: "", years: "", message: "" }); }}
                  className="mt-6 text-sm text-ink underline underline-offset-4 hover:text-gold"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-5">
                <Field label="Full Name" required value={values.name} onChange={(v) => set("name", v)} />
                <Field label="Agency Name" required value={values.agency} onChange={(v) => set("agency", v)} />
                <Field label="Phone" type="tel" required value={values.phone} onChange={(v) => set("phone", v)} />
                <Field label="Email" type="email" required value={values.email} onChange={(v) => set("email", v)} />
                <Field label="City / State" value={values.location} onChange={(v) => set("location", v)} />
                <Field label="Years in Business" type="number" value={values.years} onChange={(v) => set("years", v)} />
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.22em] text-charcoal mb-2">
                    Message / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={values.message}
                    onChange={(e) => set("message", e.target.value)}
                    className="w-full bg-transparent border-b border-ink/20 focus:border-gold outline-none py-3 text-ink resize-none transition-colors"
                  />
                </div>
                <div className="sm:col-span-2 pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-white font-medium hover:bg-charcoal transition-colors rounded-sm"
                  >
                    Submit Membership Application
                  </button>
                </div>
              </form>
            )}
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
                Complete your payment after submitting the form. Our team will confirm
                your membership within 24–48 hours.
              </p>

              <div className="mt-8 grid gap-6">
                <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10">
                  <div className="grid h-24 w-24 shrink-0 place-items-center bg-white text-ink">
                    <QrCode className="h-14 w-14" strokeWidth={1} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.22em] text-gold">Scan to Pay</div>
                    <div className="mt-1 font-serif text-lg">UPI QR Code</div>
                    <p className="mt-1 text-xs text-white/60">
                      [Upload actual UPI QR image here]
                    </p>
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

function Field({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.22em] text-charcoal mb-2">
        {label}{required && <span className="text-gold"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-ink/20 focus:border-gold outline-none py-3 text-ink transition-colors"
      />
    </div>
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
