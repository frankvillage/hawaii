import Image from "next/image";
import Link from "next/link";

import type { EntityPage } from "@/lib/site-content";
import { entitySchema } from "@/lib/seo";

type EntityPageProps = {
  page: EntityPage;
};

export function EntityPageView({ page }: EntityPageProps) {
  return (
    <main className="bg-[#0b0c0d] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(entitySchema(page)) }}
      />
      {/* Full-bleed photo hero: the page image IS the band, the copy sits on
          a feathered scrim — same language as the homepage journey. */}
      <section className="relative overflow-hidden">
        {page.media ? (
          <Image
            data-testid="entity-hero-media"
            src={page.media.src}
            alt={page.media.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.42),rgba(8,9,10,0.08)_38%,rgba(8,9,10,0.22)_62%,rgba(8,9,10,0.78))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_0%_100%,rgba(6,6,7,0.6),rgba(6,6,7,0.24)_44%,transparent_70%)]" />

        <div className="relative z-10 mx-auto flex min-h-[86svh] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-16">
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
              className="mt-5 max-w-[13ch] font-serif text-5xl leading-[0.94] text-[#f4ede4] sm:text-6xl lg:text-7xl"
              style={{ textShadow: "0 2px 30px rgba(8,9,10,0.65)" }}
            >
              {page.title}
            </h1>
            <p
              className="mt-5 max-w-2xl text-lg leading-8 text-[#efefe9]"
              style={{ textShadow: "0 1px 18px rgba(8,9,10,0.6)" }}
            >
              {page.lead}
            </p>
            <p
              className="mt-3 max-w-2xl text-base leading-8 text-white/85"
              style={{ textShadow: "0 1px 18px rgba(8,9,10,0.6)" }}
            >
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {page.primaryAction.href.startsWith("http") ? (
                <a
                  href={page.primaryAction.href}
                  target="_blank"
                  rel="noreferrer"
                  className="cta"
                >
                  {page.primaryAction.label}
                </a>
              ) : (
                <Link href={page.primaryAction.href} className="cta">
                  {page.primaryAction.label}
                </Link>
              )}
              {page.secondaryAction ? (
                <Link href={page.secondaryAction.href} className="cta-ghost">
                  {page.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <div className="space-y-6">
          {page.sections.map((section) => (
            <article
              key={section.title}
              className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0"
            >
              <h2 className="font-serif text-3xl text-[#f4ede4]">{section.title}</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-[#cfcfca]">
                {section.body}
              </p>
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#dbdbd6]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="pl-4 text-[#dbdbd6] before:mr-2 before:ml-[-1rem] before:text-[#d6b887] before:content-['-']">
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
              Prenota
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {page.primaryAction.href.startsWith("http") ? (
                <a
                  href={page.primaryAction.href}
                  target="_blank"
                  rel="noreferrer"
                  className="cta"
                >
                  {page.primaryAction.label}
                </a>
              ) : (
                <Link href={page.primaryAction.href} className="cta">
                  {page.primaryAction.label}
                </Link>
              )}
              {page.secondaryAction ? (
                <Link
                  href={page.secondaryAction.href}
                  className="cta-ghost"
                >
                  {page.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
              FAQ
            </p>
            <div className="mt-4 space-y-4">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold text-[#f4ede4]">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#cfcfca]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
