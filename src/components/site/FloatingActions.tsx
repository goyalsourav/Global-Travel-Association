import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919999999999"; // TODO: replace with real GTA WhatsApp number

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with GTA on WhatsApp"
        className="fixed z-40 bottom-5 right-5 md:bottom-8 md:right-8 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={0} />
        <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/40 -z-10" />
      </a>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed z-40 bottom-5 left-5 md:bottom-8 md:left-8 grid h-11 w-11 place-items-center rounded-full bg-ink text-gold border border-gold/40 hover:bg-charcoal transition-colors"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
