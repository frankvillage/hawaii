import { buildMetadata } from "@/lib/seo";
import { eventFormats, pages } from "@/lib/site-content";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Eventi & Nightlife | Hawaii Pescara",
  description: "Dj set, sunset, tavoli evento e nightlife sul mare di Pescara.",
  path: "/eventi",
});

export default function EventsPage() {
  const page = pages["eventi"];

  return (
    <main className="bg-[#0b0c0d] text-white">
      <section className={`bg-gradient-to-br ${page.gradient}`}>
        <div className="mx-auto grid min-h-[calc(100svh-4.6rem)] max-w-7xl items-end gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#f0c889]">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[12ch] font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#e9e9e4]">{page.lead}</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82">{page.intro}</p>
          </div>

          <div className="grid gap-3">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.4rem] border border-white/10 bg-[rgba(255,255,255,0.05)] p-5"
              >
                <h2 className="font-serif text-2xl text-[#f4ede4]">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#dadad5]">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Format ricorrenti
          </p>
          <h2 className="mt-4 font-serif text-4xl text-[#f4ede4] sm:text-5xl">
            Serate, tavoli e special date.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {eventFormats.map((format) => (
            <article
              key={format.title}
              data-testid="event-format-card"
              className="rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6"
            >
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
                {format.timing}
              </p>
              <h3 className="mt-4 font-serif text-3xl text-[#f4ede4]">{format.title}</h3>
              <p className="mt-4 text-base leading-8 text-[#cfcfca]">{format.description}</p>
              <ul className="mt-5 space-y-2 text-sm leading-7 text-[#dbdbd6]">
                {format.notes.map((note) => (
                  <li
                    key={note}
                    className="rounded-[1rem] border border-white/10 bg-[rgba(18,19,20,0.28)] px-3 py-2"
                  >
                    {note}
                  </li>
                ))}
              </ul>
              <Link
                href={format.action.href}
                className="cta-ghost mt-6"
              >
                {format.action.label}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
              Private events
            </p>
            <p className="mt-3 text-base leading-8 text-[#cfcfca]">
              Feste private, ricorrenze e format su misura trovano qui una naturale
              estensione tra terrazza, dinner e dopocena.
            </p>
          </div>
          <Link
            href="/feste-private"
            className="cta"
          >
            Richiedi un evento
          </Link>
        </div>
      </section>
    </main>
  );
}
