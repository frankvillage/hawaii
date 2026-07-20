import Image from "next/image";
import Link from "next/link";

import { beachBookingUrl, bookingVenues, sportBooking } from "@/lib/booking-config";
import { buildMetadata } from "@/lib/seo";
import { quickBooking, siteMeta } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Il Villaggio | Hawaii Pescara",
  description:
    "Hawaii Pescara in un colpo d'occhio: spiaggia, ristorante di mare, pizza, braceria MUULab Riviera, sport, eventi e prenotazioni.",
  path: "/villaggio",
});

const anime = [
  {
    label: "Beach",
    title: "La spiaggia",
    body: "Palme, ombrelloni ampi e mare aperto: la giornata comincia sulla sabbia e finisce col tramonto.",
    href: "/beach",
    image: { src: "/media/hawaii/beach-umbrellas.jpg", alt: "La spiaggia di Hawaii con ombrelloni e palme" },
    action: { label: "Prenota ombrellone", href: beachBookingUrl, external: true },
  },
  {
    label: "Restaurant",
    title: "Il ristorante di mare",
    body: "Crudi, primi e griglia di pesce a pranzo e a cena, al piano terra sul lungomare.",
    href: "/ristorante-mare",
    image: { src: "/media/hawaii/photos/food-risotto-bollicine.jpg", alt: "Risotto agli scampi con bollicine" },
    action: {
      label: "Prenota Hawaii su TheFork",
      href: bookingVenues.hawaii.internalBookingPath,
    },
  },
  {
    label: "Sport",
    title: "Padel e outdoor",
    body: "Due campi da padel regolamentari e outdoor training a pochi passi dalla sabbia.",
    href: "/sport",
    image: { src: "/media/hawaii/padel-court.jpg", alt: "Partita di padel sui campi di Hawaii" },
    action: {
      label: "Prenota padel su Wansport",
      href: sportBooking.portalUrl,
      external: true,
    },
  },
  {
    label: "Nightlife",
    title: "Eventi e notti sul mare",
    body: "Sunset, dj set, tavoli evento e feste private fino a notte fonda.",
    href: "/eventi",
    image: { src: "/media/hawaii/night-event.jpg", alt: "Serata evento di Hawaii vista dall'alto" },
    action: { label: "Gli eventi", href: "/eventi" },
  },
];

const cucine = [
  {
    eyebrow: "Piano terra",
    title: "Ristorante Mare",
    body: "Il pesce raccontato con cura: crudi, tonnarelli alle vongole, riso agli scampi, griglia e fritti al cono da passeggio.",
    photos: [
      { src: "/media/hawaii/photos/food-insalata-gambero.jpg", alt: "Insalata di mare con gambero del ristorante Hawaii" },
      { src: "/media/hawaii/photos/estate-gamberoni.jpg", alt: "Gamberoni alla griglia serviti al vassoio" },
      { src: "/media/hawaii/photos/food-ravioli.jpg", alt: "Ravioli con datterini del ristorante mare" },
    ],
    actions: [
      { label: "Menu del mare", href: "/menu#ristorante-mare" },
      {
        label: "Prenota Hawaii su TheFork",
        href: bookingVenues.hawaii.internalBookingPath,
      },
    ],
  },
  {
    eyebrow: "In terrazza",
    title: "MUULab Riviera, la braceria",
    body: "Crudi di carne, tagli alla brace e cucina a vista: la sera della terrazza vive tra fuoco, tramonto e vista mare.",
    photos: [
      { src: "/media/hawaii/kitchen-brace.jpg", alt: "La cucina a vista di MUULab Riviera la sera" },
      { src: "/media/hawaii/photos/muulab-tartare.jpg", alt: "Tartare di manzo in terrazza" },
      { src: "/media/hawaii/photos/muulab-carpaccio.jpg", alt: "Carpaccio di manzo di MUULab Riviera" },
    ],
    actions: [
      { label: "Menu della braceria", href: "/menu#muulab" },
      {
        label: "Prenota MUULab su TheFork",
        href: bookingVenues.muulab.internalBookingPath,
      },
    ],
  },
  {
    eyebrow: "La sera",
    title: "La pizza",
    body: "Dal forno a cena: gli sfizi, le classiche e le firme della casa, da Margherita a Ombre Nere.",
    photos: [
      { src: "/media/hawaii/photos/pizza-forno.jpg", alt: "L'impasto della pizza lavorato a vista" },
    ],
    actions: [{ label: "La pizza, a cena", href: "/menu#ristorante-mare" }],
  },
];

export default function VillaggioPage() {
  return (
    <main className="theme-light bg-[#f8f5ee] text-[#1c2b2e]">
      <section
        data-testid="classic-section"
        className="theme-dark relative isolate overflow-hidden border-b border-[#1c2b2e]/10"
      >
        <Image
          src="/media/hawaii/seafront-aerial.jpg"
          alt="Il fronte mare di Hawaii Pescara visto dall'alto"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.72),rgba(8,9,10,0.42)_40%,rgba(8,9,10,0.88))]" />
        <div className="relative z-10 mx-auto flex min-h-[68svh] max-w-7xl flex-col items-start justify-end px-4 pb-16 pt-36 sm:px-6 lg:px-8">
          <h1 className="max-w-[16ch] font-serif text-4xl leading-[1.02] text-[#f6efe6] sm:text-6xl">
            Il villaggio sul mare di Pescara.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#e5e5e0]">
            Spiaggia, ristorante di mare, pizza, braceria in terrazza, sport ed
            eventi: tutto nello stesso fronte mare, dal primo sole alla notte.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/prenotazioni"
              className="cta"
            >
              Prenota
            </Link>
            <Link
              href="/"
              className="cta-ghost"
            >
              Vivi il viaggio
            </Link>
          </div>
        </div>
      </section>

      <section data-testid="classic-section" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#96703d]">
          Le quattro anime
        </p>
        <h2 className="mt-4 max-w-[18ch] font-serif text-3xl text-[#16292d] sm:text-4xl">
          Un solo posto, quattro modi di viverlo.
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {anime.map((item) => (
            <article
              key={item.label}
              className="group overflow-hidden rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)]"
            >
              <Link href={item.href} className="relative block aspect-[16/9] overflow-hidden">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </Link>
              <div className="p-6">
                <p className="text-[0.66rem] uppercase tracking-[0.22em] text-[#96703d]">
                  {item.label}
                </p>
                <h3 className="mt-3 font-serif text-2xl text-[#16292d]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#4c5453]">{item.body}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  {item.action.external ? (
                    <a
                      href={item.action.href}
                      target="_blank"
                      rel="noreferrer"
                      className="cta cta-sm"
                    >
                      {item.action.label}
                    </a>
                  ) : (
                    <Link
                      href={item.action.href}
                      className="cta cta-sm"
                    >
                      {item.action.label}
                    </Link>
                  )}
                  <Link
                    href={item.href}
                    className="cta-ghost cta-sm"
                  >
                    Scopri
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        data-testid="classic-section"
        className="border-t border-[#1c2b2e]/10 bg-[#f1ebdf]"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#96703d]">
            Le cucine
          </p>
          <h2 className="mt-4 max-w-[20ch] font-serif text-3xl text-[#16292d] sm:text-4xl">
            Mare a pranzo, brace e pizza la sera.
          </h2>
          <div className="mt-10 grid gap-12">
            {cucine.map((cucina) => (
              <article key={cucina.title}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[0.66rem] uppercase tracking-[0.22em] text-[#96703d]">
                      {cucina.eyebrow}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl text-[#16292d] sm:text-3xl">
                      {cucina.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#4c5453]">{cucina.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    {cucina.actions.map((action) => (
                      <Link
                        key={action.href + action.label}
                        href={action.href}
                        className="cta-ghost cta-sm"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div
                  className={`mt-8 grid gap-4 sm:gap-3 ${
                    cucina.photos.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"
                  }`}
                >
                  {cucina.photos.map((photo) => (
                    <div
                      key={photo.src}
                      className={`relative overflow-hidden rounded-[1.4rem] border border-[#1c2b2e]/10 ${
                        cucina.photos.length === 1 ? "aspect-[21/9]" : "aspect-[4/3]"
                      }`}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes={
                          cucina.photos.length === 1
                            ? "(max-width: 1024px) 100vw, 1200px"
                            : "(max-width: 1024px) 33vw, 420px"
                        }
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        data-testid="classic-section"
        className="border-t border-[#1c2b2e]/10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#96703d]">
              {quickBooking.eyebrow}
            </p>
            <h2 className="mt-4 max-w-[16ch] font-serif text-3xl text-[#16292d] sm:text-4xl">
              Ogni momento si prenota in un gesto.
            </h2>
            <ul className="mt-7 grid gap-2.5">
              {quickBooking.options.map((option) =>
                option.external ? (
                  <li key={option.label}>
                    <a
                      href={option.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-baseline justify-between gap-4 rounded-[1.2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] px-4 py-3.5 text-sm text-[#1c2b2e] transition hover:border-[#96703d]"
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-right text-xs text-[#5d6a68]">{option.detail}</span>
                    </a>
                  </li>
                ) : (
                  <li key={option.label}>
                    <Link
                      href={option.href}
                      className="flex items-baseline justify-between gap-4 rounded-[1.2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] px-4 py-3.5 text-sm text-[#1c2b2e] transition hover:border-[#96703d]"
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-right text-xs text-[#5d6a68]">{option.detail}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#96703d]">
              Dove siamo
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#16292d] sm:text-4xl">
              Sul lungomare di Pescara.
            </h2>
            <div className="mt-7 space-y-2 text-sm leading-7 text-[#4c5453]">
              <p>{siteMeta.address}</p>
              <p>
                Hawaii{" "}
                <a href={bookingVenues.hawaii.phoneHref} className="text-[#96703d] hover:text-[#6f5027]">
                  {bookingVenues.hawaii.phoneDisplay}
                </a>{" "}
                · MUULab{" "}
                <a href={bookingVenues.muulab.phoneHref} className="text-[#96703d] hover:text-[#6f5027]">
                  {bookingVenues.muulab.phoneDisplay}
                </a>
              </p>
              <p>{siteMeta.email}</p>
            </div>
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-[1.6rem] border border-[#1c2b2e]/10">
              <Image
                src="/media/hawaii/village-aerial.jpg"
                alt="Hawaii Pescara vista dall'alto tra spiaggia e lungomare"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
