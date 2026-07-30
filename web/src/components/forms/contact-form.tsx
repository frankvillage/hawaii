import { bookingVenues, whatsappContacts } from "@/lib/booking-config";
import { siteMeta } from "@/lib/site-content";

export function ContactForm() {
  return (
    <section
      data-testid="contact-form"
      aria-labelledby="contact-actions-title"
      className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white p-6 shadow-[0_14px_40px_rgba(23,32,34,0.07)] backdrop-blur-sm sm:p-8"
    >
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
        Contatto diretto
      </p>
      <h2 id="contact-actions-title" className="mt-4 font-serif text-3xl leading-tight text-[#16292d]">
        Il punto giusto da cui iniziare.
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#4c5453]">
        Per informazioni, eventi e richieste dedicate scegli il canale piu comodo per te.
      </p>
      <div className="mt-7 flex flex-col gap-3">
        <a
          href={whatsappContacts.general}
          target="_blank"
          rel="noopener noreferrer"
          className="cta justify-center"
        >
          Scrivi su WhatsApp
        </a>
        <a href={`mailto:${siteMeta.email}`} className="cta-ghost justify-center">
          Scrivi via email
        </a>
        <a href={bookingVenues.hawaii.phoneHref} className="cta-ghost justify-center">
          Chiama Hawaii {bookingVenues.hawaii.phoneDisplay}
        </a>
        <a href={bookingVenues.muulab.phoneHref} className="cta-ghost justify-center">
          Chiama MUULab {bookingVenues.muulab.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
