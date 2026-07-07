import Link from "next/link";

import { BookingInquiryForm } from "@/components/forms/booking-inquiry-form";
import { buildMetadata } from "@/lib/seo";
import { bookingOptions } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Prenotazioni | Hawaii Pescara",
  description: "Scegli cosa prenotare tra spiaggia, tavolo, terrazza, sport ed eventi privati.",
  path: "/prenotazioni",
});

export default function BookingPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">
              Prenotazioni
            </p>
            <h1 className="mt-5 max-w-[10ch] font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
              Scegli come entrare in Hawaii.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5453]">
              Spiaggia, tavolo mare, terrazza, sport o una richiesta piu ampia.
              Ogni percorso ha il suo accesso.
            </p>
            <div className="mt-10 grid gap-4">
              {bookingOptions.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  className="rounded-[1.6rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-5 transition hover:border-white/25 hover:bg-[rgba(255,255,255,0.06)]"
                >
                  <strong className="block font-serif text-2xl text-[#16292d]">
                    {option.title}
                  </strong>
                  <p className="mt-2 text-sm leading-7 text-[#4c5453]">
                    {option.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:pt-10">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
              Richiesta rapida
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[#16292d]">
              Lascia i tuoi riferimenti.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#4c5453]">
              Ti ricontattiamo con il canale piu adatto in base alla tua richiesta.
            </p>
            <div className="mt-8">
              <BookingInquiryForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
