import Image from "next/image";
import Link from "next/link";

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
    action: { label: "Prenota ombrellone", href: siteMeta.beachBookingUrl, external: true },
  },
  {
    label: "Restaurant",
    title: "Il ristorante di mare",
    body: "Crudi, primi e griglia di pesce a pranzo e a cena, al piano terra sul lungomare.",
    href: "/ristorante-mare",
    image: { src: "/media/hawaii/photos/food-risotto-bollicine.jpg", alt: "Risotto agli scampi con bollicine" },
    action: { label: "Scopri il menu", href: "/menu#ristorante-mare" },
  },
  {
    label: "Sport",
    title: "Padel e outdoor",
    body: "Due campi da padel regolamentari e outdoor training a pochi passi dalla sabbia.",
    href: "/sport",
    image: { src: "/media/hawaii/padel-court.jpg", alt: "Partita di padel sui campi di Hawaii" },
    action: { label: "Prenota attività", href: "/sport" },
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
      { label: "Prenota tavolo", href: "/prenotazioni" },
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
      { label: "Prenota in terrazza", href: "/prenotazioni" },
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
    <main className="bg-[#07111a] text-white">
      <section
        data-testid="classic-section"
        className="relative isolate overflow-hidden border-b border-white/10"
      >
        <Image
          src="/media/hawaii/seafront-aerial.jpg"
          alt="Il fronte mare di Hawaii Pescara visto dall'alto"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,12,0.72),rgba(3,8,12,0.42)_40%,rgba(3,8,12,0.88))]" />
        <div className="relative z-10 mx-auto flex min-h-[62svh] max-w-7xl flex-col items-start justify-end px-4 py-14 sm:px-6 lg:px-8">
          <Image
            src="/media/hawaii/brand/logo-hawaii-white.png"
            alt=""
            aria-hidden
            width={800}
            height={377}
            className="h-16 w-auto sm:h-20"
          />
          <h1 className="mt-6 max-w-[16ch] font-serif text-4xl leading-[0.95] text-[#f6efe6] sm:text-6xl">
            Il villaggio sul mare di Pescara.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#e3eaee]">
            Spiaggia, ristorante di mare, pizza, braceria in terrazza, sport ed
            eventi: tutto nello stesso fronte mare, dal primo sole alla notte.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/prenotazioni"
              className="rounded-full bg-[#bf7148] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#cc7d54]"
            >
              Prenota
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#f6efe6] transition hover:border-white/40"
            >
              Vivi il viaggio
            </Link>
          </div>
        </div>
      </section>

      <section data-testid="classic-section" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d6b887]">
          Le quattro anime
        </p>
        <h2 className="mt-4 max-w-[18ch] font-serif text-3xl text-[#f4ede4] sm:text-4xl">
          Un solo posto, quattro modi di viverlo.
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {anime.map((item) => (
            <article
              key={item.label}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.03)]"
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
                <p className="text-[0.66rem] uppercase tracking-[0.22em] text-[#d6b887]">
                  {item.label}
                </p>
                <h3 className="mt-3 font-serif text-2xl text-[#f4ede4]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#c5d1d8]">{item.body}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                  {item.action.external ? (
                    <a
                      href={item.action.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#bf7148] px-4 py-2.5 text-white transition hover:bg-[#cc7d54]"
                    >
                      {item.action.label}
                    </a>
                  ) : (
                    <Link
                      href={item.action.href}
                      className="rounded-full bg-[#bf7148] px-4 py-2.5 text-white transition hover:bg-[#cc7d54]"
                    >
                      {item.action.label}
                    </Link>
                  )}
                  <Link
                    href={item.href}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-[#f4ede4] transition hover:border-white/35"
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
        className="border-t border-white/10 bg-[#060e16]"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d6b887]">
            Le cucine
          </p>
          <h2 className="mt-4 max-w-[20ch] font-serif text-3xl text-[#f4ede4] sm:text-4xl">
            Mare a pranzo, brace e pizza la sera.
          </h2>
          <div className="mt-10 grid gap-12">
            {cucine.map((cucina) => (
              <article key={cucina.title}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-[0.66rem] uppercase tracking-[0.22em] text-[#d6b887]">
                      {cucina.eyebrow}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl text-[#f4ede4] sm:text-3xl">
                      {cucina.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#c5d1d8]">{cucina.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    {cucina.actions.map((action) => (
                      <Link
                        key={action.href + action.label}
                        href={action.href}
                        className="rounded-full border border-white/15 px-4 py-2.5 text-[#f4ede4] transition hover:border-white/35"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div
                  className={`mt-6 grid gap-3 ${
                    cucina.photos.length === 1 ? "grid-cols-1" : "grid-cols-3"
                  }`}
                >
                  {cucina.photos.map((photo) => (
                    <div
                      key={photo.src}
                      className={`relative overflow-hidden rounded-[1.4rem] border border-white/10 ${
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
        className="border-t border-white/10"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d6b887]">
              {quickBooking.eyebrow}
            </p>
            <h2 className="mt-4 max-w-[16ch] font-serif text-3xl text-[#f4ede4] sm:text-4xl">
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
                      className="flex items-baseline justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-sm text-[#f0f4f6] transition hover:border-white/30"
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-right text-xs text-[#b9c6cd]">{option.detail}</span>
                    </a>
                  </li>
                ) : (
                  <li key={option.label}>
                    <Link
                      href={option.href}
                      className="flex items-baseline justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-sm text-[#f0f4f6] transition hover:border-white/30"
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-right text-xs text-[#b9c6cd]">{option.detail}</span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d6b887]">
              Dove siamo
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#f4ede4] sm:text-4xl">
              Sul lungomare di Pescara.
            </h2>
            <div className="mt-7 space-y-2 text-sm leading-7 text-[#c5d1d8]">
              <p>{siteMeta.address}</p>
              <p>
                Ristorante{" "}
                <a href="tel:+390859396664" className="text-[#e8c89e] hover:text-[#f6ecd9]">
                  {siteMeta.restaurantPhone}
                </a>{" "}
                · Spiaggia{" "}
                <a href="tel:+393755175508" className="text-[#e8c89e] hover:text-[#f6ecd9]">
                  {siteMeta.beachPhone}
                </a>
              </p>
              <p>{siteMeta.email}</p>
            </div>
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-[1.6rem] border border-white/10">
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
