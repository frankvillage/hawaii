import { TheForkBooking } from "@/components/booking/thefork-booking";
import { bookingVenues } from "@/lib/booking-config";
import { buildMetadata } from "@/lib/seo";

const venue = bookingVenues.hawaii;

export const metadata = buildMetadata({
  title: "Prenota Hawaii",
  description: "Prenota il tuo tavolo da Hawaii Pescara tramite TheFork o con assistenza diretta.",
  path: venue.internalBookingPath,
});

export default function HawaiiBookingPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">
          Prenotazione ristorante
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
          Hawaii
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5453]">
          Prenota il ristorante sul mare in modo sicuro: scegli l’assistenza diretta
          oppure attiva il modulo TheFork.
        </p>
        <div className="mt-10">
          <TheForkBooking venue={venue} />
        </div>
      </section>
    </main>
  );
}
