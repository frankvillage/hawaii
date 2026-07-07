import Image from "next/image";
import Link from "next/link";

import { HeroSlider } from "@/components/pages/hero-slider";
import type { EntityPage } from "@/lib/site-content";
import { entitySchema } from "@/lib/seo";

type EntityPageProps = {
  page: EntityPage;
};

function ActionLink({
  href,
  label,
  ghost,
}: {
  href: string;
  label: string;
  ghost?: boolean;
}) {
  const className = ghost ? "cta-ghost" : "cta";

  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function EntityPageView({ page }: EntityPageProps) {
  const slides = page.heroMedia?.length
    ? page.heroMedia
    : page.media
      ? [page.media]
      : [];

  return (
    <main className="theme-light bg-[#f8f5ee] text-[#1c2b2e]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entitySchema(page)) }}
      />

      {/* Full-bleed photo hero: the page photos ARE the band (slow crossfade
          when more than one), the copy sits on a feathered scrim. */}
      <section className="theme-dark relative overflow-hidden bg-[#0b0c0d]">
        {slides.length ? <HeroSlider slides={slides} testId="entity-hero-media" /> : null}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.44),rgba(8,9,10,0.1)_38%,rgba(8,9,10,0.24)_62%,rgba(8,9,10,0.8))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_0%_100%,rgba(6,6,7,0.62),rgba(6,6,7,0.26)_44%,transparent_70%)]" />

        <div className="relative z-10 mx-auto flex min-h-[84svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-36 sm:px-6 lg:px-8 lg:pb-16">
          <div className="max-w-3xl">
            {page.brandLogo ? (
              <Image
                src={page.brandLogo.src}
                alt={page.brandLogo.alt}
                width={1600}
                height={607}
                className="mb-6 h-12 w-auto sm:h-16"
              />
            ) : null}
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
              <ActionLink href={page.primaryAction.href} label={page.primaryAction.label} />
              {page.secondaryAction ? (
                <ActionLink
                  href={page.secondaryAction.href}
                  label={page.secondaryAction.label}
                  ghost
                />
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

        <div className="mt-16 grid gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            {page.sections.map((section, index) => (
              <article
                key={section.title}
                className={index > 0 ? "mt-14 border-t border-[#1c2b2e]/10 pt-14" : ""}
              >
                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-[#96703d]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#16292d] sm:text-4xl">
                  {section.title}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[#4c5453]">
                  {section.body}
                </p>
                {section.bullets?.length ? (
                  <ul className="mt-5 grid gap-2 text-[0.95rem] leading-7 text-[#3c4a4e] sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-baseline gap-2.5">
                        <span aria-hidden className="h-px w-4 flex-none translate-y-[-3px] bg-[#96703d]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}

            {page.gallery?.length ? (
              <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                {page.gallery.map((photo) => (
                  <div
                    key={photo.src}
                    className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] shadow-[0_16px_40px_rgba(23,32,34,0.12)] sm:aspect-[4/5]"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 1024px) 33vw, 320px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 lg:pl-6">
            <div className="rounded-[1.4rem] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,34,0.08)]">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-[#96703d]">
                Prenota
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <ActionLink href={page.primaryAction.href} label={page.primaryAction.label} />
                {page.secondaryAction ? (
                  <ActionLink
                    href={page.secondaryAction.href}
                    label={page.secondaryAction.label}
                    ghost
                  />
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,34,0.08)]">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-[#96703d]">
                Domande frequenti
              </p>
              <div className="mt-4 space-y-5">
                {page.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="border-t border-[#1c2b2e]/10 pt-4 first:border-t-0 first:pt-0"
                  >
                    <h3 className="font-serif text-lg leading-snug text-[#16292d]">
                      {faq.question}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#4c5453]">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
