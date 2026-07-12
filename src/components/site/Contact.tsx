import { Mail, Globe, Phone, MapPin, Instagram } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="relative bg-secondary py-24 md:py-32">
      <div className="container-page">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5" data-reveal>
            <span className="eyebrow"><span className="gold-rule" />Contact</span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl leading-tight text-ink">
              Get in touch with the association.
            </h2>
            <p className="mt-5 text-charcoal leading-relaxed">
              For membership, partnerships, media enquiries, or to invite GTA to your
              event, reach out to us directly.
            </p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5" data-reveal data-reveal-delay="150">
            <ContactCard icon={<Mail />} label="Email" value="globaltravelsassociation@gmail.com" href="mailto:globaltravelsassociation@gmail.com" />
            <ContactCard icon={<Globe />} label="Website" value="www.globaltravelassociation.com" href="https://www.globaltravelassociation.com" />
            <ContactCard icon={<Phone />} label="Phone" value="+91 9009661010" href="tel:+919009661010" />
            <ContactCard icon={<MapPin />} label="Address" value="Raipur, Chhattisgarh, India" />

            <div className="sm:col-span-2 bg-white p-6 border border-ink/5">
              <div className="text-xs uppercase tracking-[0.22em] text-gold mb-4">Follow the Association</div>
              <div className="flex gap-3">
                <SocialButton
                  icon={<Instagram className="h-5 w-5" />}
                  label="Instagram"
                  href="https://www.instagram.com/global_travel_aassociation?igsh=YTRveHdtNmJpN3Vp&utm_source=qr"
                />
              </div>
            </div>

            <div className="sm:col-span-2 aspect-[16/7] bg-ink/5 overflow-hidden">
              <iframe
                title="GTA location — Raipur, Chhattisgarh"
                src="https://www.google.com/maps?q=Raipur%2C+Chhattisgarh&output=embed"
                className="w-full h-full grayscale contrast-125"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const Wrapper: any = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href, target: href.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" } : {})}
      className="group block bg-white p-6 border border-ink/5 hover:border-gold transition-colors"
    >
      <div className="flex items-center gap-2 text-gold">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
      </div>
      <div className="mt-3 font-serif text-lg text-ink break-words">{value}</div>
    </Wrapper>
  );
}

function SocialButton({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        className="grid h-11 w-11 place-items-center border border-ink/15 text-ink hover:bg-ink hover:text-gold transition-colors rounded-sm"
      >
        {icon}
      </a>
    );
  }
  return (
    <button
      aria-label={label}
      className="grid h-11 w-11 place-items-center border border-ink/15 text-ink hover:bg-ink hover:text-gold transition-colors rounded-sm"
    >
      {icon}
    </button>
  );
}
