import { bookingVenues, whatsappContacts } from "@/lib/booking-config";

export function BookingInquiryForm() {
  return (
    <section
      data-testid="booking-inquiry-form"
      aria-labelledby="booking-actions-title"
      className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white p-6 shadow-[0_14px_40px_rgba(23,32,34,0.07)] backdrop-blur-sm sm:p-8"
    >
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
        Richieste dedicate
      </p>
      <h2 id="booking-actions-title" className="mt-4 font-serif text-3xl leading-tight text-[#16292d]">
        Informazioni, eventi e occasioni speciali.
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#4c5453]">
        Per richieste che vanno oltre la singola prenotazione, contattaci direttamente.
      </p>
      <div className="mt-7 flex flex-col gap-3">
        <a
          href={whatsappContacts.events}
          target="_blank"
          rel="noopener noreferrer"
          className="cta justify-center"
        >
          WhatsApp informazioni ed eventi
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
