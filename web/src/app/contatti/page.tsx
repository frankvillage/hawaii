import Link from "next/link";

import { ContactForm } from "@/components/forms/contact-form";
import {
  bookingVenues,
  sportBooking,
  whatsappContacts,
} from "@/lib/booking-config";
import { buildMetadata } from "@/lib/seo";
import { siteMeta } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Contatti | Hawaii Pescara",
  description: "Contatti, indirizzo e riferimenti per ristorante, spiaggia e prenotazioni.",
  path: "/contatti",
});

export default function ContactPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-6xl px-4 pt-32 pb-16 sm:px-6 lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:px-8">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">Contatti</p>
          <h1 className="mt-5 max-w-[10ch] font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
            Hawaii, in un solo punto.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5453]">
            Contatti diretti per beach, ristorante, terrazza e richieste generali.
          </p>
          <div className="mt-10 rounded-[1.6rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6">
            <div className="space-y-3 text-sm leading-7 text-[#3c4a4e]">
              <p>{siteMeta.address}</p>
              <p>
                Hawaii ristorante: {" "}
                <a href={bookingVenues.hawaii.phoneHref} className="text-[#96703d]">
                  {bookingVenues.hawaii.phoneDisplay}
                </a>
              </p>
              <p>
                MUULab Riviera: {" "}
                <a href={bookingVenues.muulab.phoneHref} className="text-[#96703d]">
                  {bookingVenues.muulab.phoneDisplay}
                </a>
              </p>
              <p>
                <a
                  href={whatsappContacts.general}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#96703d]"
                >
                  WhatsApp Hawaii, informazioni ed eventi
                </a>
              </p>
              <p>
                <a
                  href={bookingVenues.muulab.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#96703d]"
                >
                  WhatsApp MUULab Riviera
                </a>
              </p>
              <p>
                <a
                  href={sportBooking.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#96703d]"
                >
                  Assistenza padel su WhatsApp
                </a>
              </p>
              <p>{siteMeta.email}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/prenotazioni"
                className="cta"
              >
                Vai alle prenotazioni
              </Link>
              <Link
                href={siteMeta.mapUrl}
                className="cta-ghost"
              >
                Apri mappa
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
              Scrivici
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#16292d]">
              Ti indirizziamo subito all&apos;area giusta.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#4c5453]">
              Scegli il canale piu comodo per raggiungere l&apos;area che ti interessa.
            </p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0 lg:pt-10">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
