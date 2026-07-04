import { PrivateEventForm } from "@/components/forms/private-event-form";
import { buildMetadata } from "@/lib/seo";
import { pages } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Feste Private | Hawaii Pescara",
  description: "Richiedi eventi privati, cene e format personalizzati negli spazi di Hawaii.",
  path: "/feste-private",
});

export default function PrivateEventsPage() {
  const page = pages["feste-private"];

  return (
    <main className="bg-[#0b0c0d] text-white">
      <section className={`bg-gradient-to-br ${page.gradient}`}>
        <div className="mx-auto grid min-h-[calc(100svh-4.6rem)] max-w-7xl items-end gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#f0c889]">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[11ch] font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#e9e9e4]">{page.lead}</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/82">{page.intro}</p>
          </div>

          <div className="lg:pb-4">
            <PrivateEventForm />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
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

        <aside className="rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Occasioni
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[#cfcfca]">
            <p>Cene private, compleanni, tavoli speciali ed eventi aziendali sul mare.</p>
            <p>Terrazza al tramonto, dinner serale o configurazioni dedicate in base al format.</p>
            <p>Ogni richiesta parte da poche informazioni chiare e continua con un contatto diretto.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
