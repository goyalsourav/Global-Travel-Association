export function SiteFooter() {
  return (
    <footer className="bg-ink text-white border-t border-white/5">
      <div className="container-page py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Global Travel Association"
              className="h-14 w-auto object-contain"
            />
          </div>
          <p className="mt-4 italic text-gold font-serif">Integrate — Innovate — Inspire</p>
          <p className="mt-4 max-w-md text-sm text-white/60 leading-relaxed">
            An India-based association of travel agencies established in 2026,
            headquartered in Raipur, Chhattisgarh — expanding PAN India.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-gold mb-4">Explore</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#about" className="text-white/70 hover:text-gold">About</a></li>
            <li><a href="#activities" className="text-white/70 hover:text-gold">Activities</a></li>
            <li><a href="#membership" className="text-white/70 hover:text-gold">Membership</a></li>
            <li><a href="#contact" className="text-white/70 hover:text-gold">Contact</a></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-gold mb-4">Contact</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Raipur, Chhattisgarh, India</li>
            <li><a href="mailto:globaltravelsassociation@gmail.com" className="hover:text-gold break-all">globaltravelsassociation@gmail.com</a></li>
            <li>www.globaltravelassociation.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-page py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <div>© 2026 Global Travel Association. All rights reserved.</div>
          <div>Designed with intent · Made in India</div>
        </div>
      </div>
    </footer>
  );
}
