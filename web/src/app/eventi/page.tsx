import Image from "next/image";
import Link from "next/link";

import { HeroSlider } from "@/components/pages/hero-slider";
import { buildMetadata, entitySchema } from "@/lib/seo";
import { eventFormats, pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Eventi & Nightlife | Hawaii Pescara",
  description: "Dj set, sunset, tavoli evento e nightlife sul mare di Pescara.",
  path: "/eventi",
});

export default function EventsPage() {
  const page = pages["eventi"];
  const slides = page.heroMedia?.length ? page.heroMedia : page.media ? [page.media] : [];

  return (
    <main className="theme-light bg-[#f8f5ee] text-[#1c2b2e]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entitySchema(page)) }}
      />

      {/* Photo hero with the same slow crossfade as the other entity pages. */}
      <section className="theme-dark relative overflow-hidden bg-[#0b0c0d]">
        {slides.length ? <HeroSlider slides={slides} testId="entity-hero-media" /> : null}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.44),rgba(8,9,10,0.12)_38%,rgba(8,9,10,0.26)_62%,rgba(8,9,10,0.8))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_0%_100%,rgba(6,6,7,0.62),rgba(6,6,7,0.26)_44%,transparent_70%)]" />

        <div className="relative z-10 mx-auto flex min-h-[82svh] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-16">
          <div className="max-w-3xl">
            <p
              className="text-[0.72rem] uppercase tracking-[0.24em] text-[#f0c889]"
              style={{ textShadow: "0 1px 12px rgba(6,6,7,0.6)" }}
            >
              {page.eyebrow}
            </p>
            <h1
              className="mt-5 max-w-[15ch] font-serif text-5xl leading-[0.96] text-[#faf6ee] sm:text-6xl lg:text-7xl"
              style={{ textShadow: "0 2px 30px rgba(8,9,10,0.65)" }}
            >
              {page.title}
            </h1>
            <p
              className="mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#f3ecdf] sm:text-2xl sm:leading-9"
              style={{ textShadow: "0 1px 18px rgba(8,9,10,0.6)" }}
            >
              {page.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={page.primaryAction.href} className="cta">
                {page.primaryAction.label}
              </Link>
              {page.secondaryAction ? (
                <Link href={page.secondaryAction.href} className="cta-ghost">
                  {page.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <p className="mx-auto max-w-3xl text-center font-serif text-2xl leading-9 text-[#2c3b3e] sm:text-[1.7rem]">
          {page.intro}
        </p>
        <span aria-hidden className="mx-auto mt-8 block h-px w-16 bg-[#96703d]/60" />

        <div className="mt-14 max-w-2xl">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#96703d]">
            Format ricorrenti
          </p>
          <h2 className="mt-4 font-serif text-4xl text-[#16292d] sm:text-5xl">
            Serate, tavoli e special date.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {eventFormats.map((format) => (
            <article
              key={format.title}
              data-testid="event-format-card"
              className="flex flex-col rounded-[1.6rem] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,34,0.08)]"
            >
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
                {format.timing}
              </p>
              <h3 className="mt-4 font-serif text-3xl text-[#16292d]">{format.title}</h3>
              <p className="mt-4 flex-1 text-base leading-8 text-[#4c5453]">
                {format.description}
              </p>
              <ul className="mt-5 space-y-2 text-sm leading-7 text-[#3c4a4e]">
                {format.notes.map((note) => (
                  <li key={note} className="flex items-baseline gap-2.5">
                    <span
                      aria-hidden
                      className="h-px w-4 flex-none translate-y-[-3px] bg-[#96703d]"
                    />
                    {note}
                  </li>
                ))}
              </ul>
              <Link href={format.action.href} className="cta-ghost mt-6 self-start">
                {format.action.label}
              </Link>
            </article>
          ))}
        </div>

        {page.gallery?.length ? (
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
            {page.gallery.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] shadow-[0_16px_40px_rgba(23,32,34,0.12)] sm:aspect-[4/3]"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 33vw, 420px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-14 flex flex-col gap-4 rounded-[1.6rem] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,34,0.08)] sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
              Feste private
            </p>
            <p className="mt-3 text-base leading-8 text-[#4c5453]">
              Feste private, ricorrenze e format su misura trovano qui una naturale
              estensione tra terrazza, dinner e dopocena.
            </p>
          </div>
          <Link href="/feste-private" className="cta">
            Richiedi un evento
          </Link>
        </div>
      </section>
    </main>
  );
}
