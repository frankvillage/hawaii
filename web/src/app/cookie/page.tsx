import { ConsentPreferencesButton } from "@/components/legal/consent-preferences-button";
import { buildMetadata } from "@/lib/seo";
import { legalSections } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Cookie | Hawaii Pescara",
  description: "Informativa cookie e preferenze di consenso del sito Hawaii Pescara.",
  path: "/cookie",
});

export default function CookiePage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-4xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">Cookie</p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
          Informativa cookie.
        </h1>
        <p className="mt-6 text-base leading-8 text-[#4c5453]">
          Informazioni sulle preferenze locali e sui servizi esterni utilizzati
          dal sito.
        </p>
        <ConsentPreferencesButton />

        <div className="mt-10 space-y-5">
          {legalSections.cookie.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.6rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-5"
            >
              <h2 className="font-serif text-2xl text-[#16292d]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4c5453]">{section.body}</p>
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#3c4a4e]">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="pl-4 before:mr-2 before:ml-[-1rem] before:text-[#96703d] before:content-['-']"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.references?.length ? (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6">
                  {section.references.map((reference) => (
                    <li key={reference.href}>
                      <a
                        href={reference.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#725124] underline decoration-[#d8bb8b] underline-offset-4 transition-colors hover:text-[#16292d]"
                      >
                        {reference.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
