import Link from "next/link";

import { ContactForm } from "@/components/forms/contact-form";
import { buildMetadata } from "@/lib/seo";
import { siteMeta } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Contatti | Hawaii Pescara",
  description: "Contatti, indirizzo e riferimenti per ristorante, spiaggia e prenotazioni.",
  path: "/contatti",
});

export default function ContactPage() {
  return (
    <main className="bg-[#07111a]">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:gap-10 lg:px-8">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d6b887]">Contatti</p>
          <h1 className="mt-5 max-w-[10ch] font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl">
            Hawaii, in un solo punto.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c5d1d8]">
            Contatti diretti per beach, ristorante, terrazza e richieste generali.
          </p>
          <div className="mt-10 rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6">
            <div className="space-y-3 text-sm leading-7 text-[#d9e2e7]">
              <p>{siteMeta.address}</p>
              <p>Ristorante: {siteMeta.restaurantPhone}</p>
              <p>Spiaggia: {siteMeta.beachPhone}</p>
              <p>{siteMeta.email}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/prenotazioni"
                className="rounded-full bg-[#bf7148] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Vai alle prenotazioni
              </Link>
              <Link
                href={siteMeta.mapUrl}
                className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-[#f4ede4]"
              >
                Apri mappa
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
              Scrivici
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#f4ede4]">
              Ti indirizziamo subito all&apos;area giusta.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#c5d1d8]">
              Seleziona l&apos;area che ti interessa e lasciaci un messaggio.
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
