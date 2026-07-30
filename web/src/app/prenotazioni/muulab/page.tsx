import { TheForkBooking } from "@/components/booking/thefork-booking";
import { bookingVenues } from "@/lib/booking-config";
import { buildMetadata } from "@/lib/seo";

const venue = bookingVenues.muulab;

export const metadata = buildMetadata({
  title: "Prenota MUULab Riviera",
  description: "Prenota MUULab Riviera tramite TheFork o con assistenza diretta.",
  path: venue.internalBookingPath,
});

export default function MuulabBookingPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">
          Prenotazione terrazza
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
          MUULab Riviera
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5453]">
          Scegli data, orario e numero di ospiti dal calendario oppure usa
          l’assistenza diretta.
        </p>
        <div className="mt-10">
          <TheForkBooking venue={venue} />
        </div>
      </section>
    </main>
  );
}
