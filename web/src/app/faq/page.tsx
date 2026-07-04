import { buildMetadata, faqPageSchema } from "@/lib/seo";
import { faqGroups, faqIndex } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "FAQ | Hawaii Pescara",
  description: "Domande frequenti su beach, ristorante, terrazza, sport ed eventi.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <main className="bg-[#0b0c0d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faqIndex)) }}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d6b887]">FAQ</p>
        <h1 className="mt-5 font-serif text-5xl leading-[0.92] text-[#f4ede4] sm:text-6xl">
          Risposte rapide, in chiaro.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#cfcfca]">
          Le informazioni piu utili per organizzare spiaggia, tavolo, sport, terrazza
          ed eventi.
        </p>
        <div className="mt-10 space-y-10">
          {faqGroups.map((group) => (
            <section key={group.title}>
              <div className="max-w-2xl">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
                  {group.title}
                </p>
                <p className="mt-3 text-base leading-8 text-[#cfcfca]">{group.intro}</p>
              </div>
              <div className="mt-5 space-y-5">
                {group.items.map((faq) => (
                  <article
                    key={faq.question}
                    className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5"
                  >
                    <h2 className="text-xl font-semibold text-[#f4ede4]">{faq.question}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#cfcfca]">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
