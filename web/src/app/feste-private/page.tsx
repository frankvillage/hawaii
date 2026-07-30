import { PrivateEventForm } from "@/components/forms/private-event-form";
import { whatsappContacts } from "@/lib/booking-config";
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
    <main className="theme-light bg-[#f8f5ee] text-[#1c2b2e]">
      <section>
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 pt-32 pb-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-16">
          <div className="max-w-3xl lg:pt-8">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[13ch] font-serif text-5xl leading-[0.96] text-[#16292d] sm:text-6xl lg:text-7xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#3c4a4e] sm:text-2xl sm:leading-9">
              {page.lead}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#4c5453]">{page.intro}</p>
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
              className="border-t border-[#1c2b2e]/10 pt-6 first:border-t-0 first:pt-0"
            >
              <h2 className="font-serif text-3xl text-[#16292d]">{section.title}</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-[#4c5453]">
                {section.body}
              </p>
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
            </article>
          ))}
        </div>

        <aside className="rounded-[1.8rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
            Occasioni
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[#4c5453]">
            <p>Cene private, compleanni, tavoli speciali ed eventi aziendali sul mare.</p>
            <p>Terrazza al tramonto, dinner serale o configurazioni dedicate in base al format.</p>
            <p>Ogni richiesta parte da poche informazioni chiare e continua con un contatto diretto.</p>
          </div>
          <a
            href={whatsappContacts.privateEvents}
            target="_blank"
            rel="noopener noreferrer"
            className="cta mt-6 justify-center"
          >
            WhatsApp feste private
          </a>
        </aside>
      </section>
    </main>
  );
}
