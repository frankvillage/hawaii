import { buildMetadata } from "@/lib/seo";
import { menuHighlights, venueMenus } from "@/lib/site-content";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Menu | Hawaii Pescara",
  description: "Esplora menu mare, terrazza, cocktail e carta vini di Hawaii.",
  path: "/menu",
});

export default function MenuPage() {
  return (
    <main className="bg-[#07111a]">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d6b887]">Menu</p>
        <h1 className="mt-5 max-w-[10ch] font-serif text-5xl leading-[0.9] text-[#f4ede4] sm:text-6xl">
          Tutta l&apos;offerta, in un solo sguardo.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#c5d1d8]">
          Ristorante mare, terrazza, cocktail e carta vini: ogni proposta resta
          leggibile e subito collegata alla prenotazione.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {menuHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5"
            >
              <strong className="block font-serif text-2xl text-[#f4ede4]">{item.title}</strong>
              <p className="mt-2 text-sm leading-7 text-[#c5d1d8]">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-12">
          {venueMenus.map((menu) => (
            <section key={menu.id} id={menu.id} className="scroll-mt-24">
              <div className="max-w-2xl">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
                  {menu.eyebrow}
                </p>
                <h2 className="mt-4 font-serif text-4xl text-[#f4ede4] sm:text-5xl">
                  {menu.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-[#c5d1d8]">{menu.description}</p>
                {menu.action ? (
                  <Link
                    href={menu.action.href}
                    className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#f4ede4] transition hover:border-white/35"
                  >
                    {menu.action.label}
                  </Link>
                ) : null}
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {menu.categories.map((category) => (
                  <article
                    key={`${menu.id}-${category.title}`}
                    data-testid="menu-section"
                    className="rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6"
                  >
                    <h3 className="font-serif text-2xl text-[#f4ede4] sm:text-3xl">
                      {category.title}
                    </h3>
                    {category.note ? (
                      <p className="mt-2 text-sm leading-7 text-[#c5d1d8]">{category.note}</p>
                    ) : null}
                    {category.dishes.length ? (
                      <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#d9e2e7]">
                        {category.dishes.map((dish) => (
                          <li
                            key={dish.name}
                            className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2 last:border-b-0 last:pb-0"
                          >
                            <span>{dish.name}</span>
                            {dish.price ? (
                              <span className="whitespace-nowrap text-[#d6b887]">{dish.price}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
              Tra mare e terrazza
            </p>
            <p className="mt-3 text-base leading-8 text-[#c5d1d8]">
              Dalla cucina di mare alla brace, ogni proposta accompagna un momento
              diverso della giornata, dal pranzo al dopocena.
            </p>
          </div>
          <Link
            href="/prenotazioni"
            className="inline-flex rounded-full bg-[#bf7148] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Prenota ora
          </Link>
        </div>
      </section>
    </main>
  );
}
