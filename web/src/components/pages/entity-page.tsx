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
      <section className={`bg-gradient-to-br ${page.gradient}`}>
        <div className="mx-auto grid min-h-[calc(100svh-4.6rem)] max-w-7xl items-end gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#f0c889]">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[11ch] font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#e9e9e4]">{page.lead}</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82">{page.intro}</p>
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

          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(18,19,20,0.28)] p-5 backdrop-blur-sm">
            {page.media ? (
              <Image
                data-testid="entity-hero-media"
                src={page.media.src}
                alt={page.media.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="absolute inset-0 object-cover"
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,10,0.1),rgba(8,9,10,0.62))]" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#f0c889]">
                In evidenza
              </p>
              <div className="mt-4 grid gap-3">
                {page.sections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-[1.2rem] border border-white/10 bg-[rgba(18,19,20,0.34)] p-4 backdrop-blur-sm"
                  >
                    <strong className="block font-serif text-xl text-[#f4ede4]">
                      {section.title}
                    </strong>
                    <p className="mt-2 text-sm leading-7 text-[#dce4ea]">{section.body}</p>
                  </div>
                ))}
              </div>
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
              <Link
                href={page.primaryAction.href}
                className="cta"
              >
                {page.primaryAction.label}
              </Link>
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
