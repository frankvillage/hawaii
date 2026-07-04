import { buildMetadata } from "@/lib/seo";
import { legalSections } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Cookie | Hawaii Pescara",
  description: "Informativa cookie e preferenze di consenso del sito Hawaii Pescara.",
  path: "/cookie",
});

export default function CookiePage() {
  return (
    <main className="bg-[#0b0c0d]">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d6b887]">Cookie</p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl">
          Informativa cookie.
        </h1>
        <p className="mt-6 text-base leading-8 text-[#cfcfca]">
          Informazioni su cookie tecnici, analytics e preferenze di consenso
          utilizzate all&apos;interno del sito.
        </p>

        <div className="mt-10 space-y-5">
          {legalSections.cookie.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5"
            >
              <h2 className="font-serif text-2xl text-[#f4ede4]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#cfcfca]">{section.body}</p>
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#dbdbd6]">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="pl-4 before:mr-2 before:ml-[-1rem] before:text-[#d6b887] before:content-['-']"
                    >
                      {bullet}
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
