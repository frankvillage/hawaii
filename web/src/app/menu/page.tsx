import { buildMetadata } from "@/lib/seo";
import { menuHighlights, venueMenus } from "@/lib/site-content";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Menu | Hawaii Pescara",
  description: "Esplora menu mare, terrazza, cocktail e carta vini di Hawaii.",
  path: "/menu",
});

export default function MenuPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">Il Menu</p>
        <h1 className="mt-5 max-w-[12ch] font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
          Menù d&apos;estate.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4c5453]">
          La cura per la materia prima, la semplicità e la bontà di piatti
          studiati per sapere di mare.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {menuHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.6rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-5"
            >
              <strong className="block font-serif text-2xl text-[#16292d]">{item.title}</strong>
              <p className="mt-2 text-sm leading-7 text-[#4c5453]">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-12">
          {venueMenus.map((menu) => (
            <section key={menu.id} id={menu.id} className="scroll-mt-24">
              <div className="max-w-2xl">
                {menu.logo ? (
                  <Image
                    src={menu.logo.src}
                    alt={menu.logo.alt}
                    width={1600}
                    height={607}
                    className="mb-5 h-12 w-auto sm:h-14"
                  />
                ) : null}
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
                  {menu.eyebrow}
                </p>
                <h2 className="mt-4 font-serif text-4xl text-[#16292d] sm:text-5xl">
                  {menu.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-[#4c5453]">{menu.description}</p>
                {menu.action ? (
                  <Link
                    href={menu.action.href}
                    className="cta-ghost mt-6"
                  >
                    {menu.action.label}
                  </Link>
                ) : null}
              </div>

              {menu.photos?.length ? (
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {menu.photos.map((photo) => (
                    <div
                      key={photo.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] border border-[#1c2b2e]/10"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 1024px) 33vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {menu.categories.map((category) => (
                  <article
                    key={`${menu.id}-${category.title}`}
                    data-testid="menu-section"
                    className="rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6"
                  >
                    <h3 className="font-serif text-2xl text-[#16292d] sm:text-3xl">
                      {category.title}
                    </h3>
                    {category.note ? (
                      <p className="mt-2 text-sm leading-7 text-[#4c5453]">{category.note}</p>
                    ) : null}
                    {category.dishes.length ? (
                      <ul className="mt-4 grid gap-3 text-sm leading-7 text-[#3c4a4e]">
                        {category.dishes.map((dish) => (
                          <li
                            key={dish.name}
                            className="flex items-baseline justify-between gap-4 border-b border-[#1c2b2e]/10 pb-2 last:border-b-0 last:pb-0"
                          >
                            <span>{dish.name}</span>
                            {dish.price ? (
                              <span className="whitespace-nowrap text-[#96703d]">{dish.price}</span>
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

        <div className="mt-14 flex flex-col gap-4 rounded-[2rem] border border-[#1c2b2e]/10 bg-white shadow-[0_14px_40px_rgba(23,32,34,0.07)] p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
              Tra mare e terrazza
            </p>
            <p className="mt-3 text-base leading-8 text-[#4c5453]">
              Dalla cucina di mare alla brace, ogni proposta accompagna un momento
              diverso della giornata, dal pranzo al dopocena.
            </p>
          </div>
          <Link
            href="/prenotazioni"
            className="cta"
          >
            Prenota ora
          </Link>
        </div>
      </section>
    </main>
  );
}
