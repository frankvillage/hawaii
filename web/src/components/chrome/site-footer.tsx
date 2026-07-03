import Link from "next/link";

import { bookingOptions, navigation, siteMeta } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#09111a]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d6b887]">
            {siteMeta.name}
          </p>
          <h2 className="max-w-md font-serif text-3xl text-[#f4ede4]">
            Urban Village sul mare, dalla mattina alla notte.
          </h2>
          <p className="max-w-lg text-sm leading-7 text-[#b3c1ca]">
            Spiaggia, ristorante di mare, terrazza, sport, eventi e format privati
            in un solo luogo sul lungomare di Pescara.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Navigazione
          </p>
          <div className="flex flex-col gap-2 text-sm text-[#d9e2e7]">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link href="/menu" className="transition hover:text-white">
              Menu
            </Link>
            <Link href="/prenotazioni" className="transition hover:text-white">
              Prenotazioni
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Contatti
          </p>
          <div className="space-y-2 text-sm leading-7 text-[#b3c1ca]">
            <p>{siteMeta.address}</p>
            <p>Ristorante: {siteMeta.restaurantPhone}</p>
            <p>Spiaggia: {siteMeta.beachPhone}</p>
            <p>{siteMeta.email}</p>
          </div>
          <div className="pt-3 text-sm text-[#d9e2e7]">
            {bookingOptions.slice(0, 3).map((item) => (
              <div key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.title}
                </Link>
              </div>
            ))}
          </div>
          <div className="pt-3 text-xs text-[#7f919c]">
            <Link href="/privacy" className="mr-4 hover:text-white">
              Privacy
            </Link>
            <Link href="/cookie" className="hover:text-white">
              Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
