import { bookingVenues, whatsappContacts } from "@/lib/booking-config";

export function PrivateEventForm() {
  return (
    <section
      id="form"
      aria-labelledby="private-event-actions-title"
      className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white p-6 shadow-[0_14px_40px_rgba(23,32,34,0.07)] backdrop-blur-sm sm:p-8"
    >
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
        Feste private
      </p>
      <h2 id="private-event-actions-title" className="mt-4 font-serif text-3xl leading-tight text-[#16292d]">
        Raccontaci la tua occasione.
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#4c5453]">
        Compleanni, cene, eventi aziendali e momenti costruiti intorno ai tuoi ospiti.
      </p>
      <div className="mt-7 flex flex-col gap-3">
        <a
          href={whatsappContacts.privateEvents}
          target="_blank"
          rel="noopener noreferrer"
          className="cta justify-center"
        >
          WhatsApp feste private
        </a>
        <a href={bookingVenues.hawaii.phoneHref} className="cta-ghost justify-center">
          Chiama Hawaii {bookingVenues.hawaii.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
