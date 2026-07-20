import Image from "next/image";
import Link from "next/link";

import { bookingVenues, sportBooking } from "@/lib/booking-config";
import { bookingOptions, navigation, siteMeta } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0c0d0e]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <Image
            src="/media/hawaii/brand/logo-lockup-white.png"
            alt={`${siteMeta.name} — ${siteMeta.payoff}`}
            width={1309}
            height={721}
            className="h-16 w-auto"
          />
          <h2 className="max-w-md font-serif text-3xl text-[#f4ede4]">
            Urban Village sul mare, dalla mattina alla notte.
          </h2>
          <p className="max-w-lg text-sm leading-7 text-[#bcbcb6]">
            Spiaggia, ristorante di mare, terrazza, sport, eventi e format privati
            in un solo luogo sul lungomare di Pescara.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d6b887]">
            Navigazione
          </p>
          <div className="flex flex-col gap-2 text-sm text-[#dbdbd6]">
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
          <div className="space-y-2 text-sm leading-7 text-[#bcbcb6]">
            <p>{siteMeta.address}</p>
            <p>
              Hawaii ristorante: {" "}
              <a href={bookingVenues.hawaii.phoneHref} className="hover:text-white">
                {bookingVenues.hawaii.phoneDisplay}
              </a>
            </p>
            <p>
              MUULab Riviera: {" "}
              <a href={bookingVenues.muulab.phoneHref} className="hover:text-white">
                {bookingVenues.muulab.phoneDisplay}
              </a>
            </p>
            <p>
              <a
                href={bookingVenues.hawaii.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp Hawaii, informazioni ed eventi
              </a>
            </p>
            <p>
              <a
                href={bookingVenues.muulab.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp MUULab Riviera
              </a>
            </p>
            <p>
              <a
                href={sportBooking.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Assistenza padel su WhatsApp
              </a>
            </p>
            <p>{siteMeta.email}</p>
          </div>
          <div className="pt-3 text-sm text-[#dbdbd6]">
            {bookingOptions.slice(0, 3).map((item) => {
              const className = "transition hover:text-white";

              return (
                <div key={item.href}>
                  {"external" in item ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      {item.title}
                    </a>
                  ) : (
                    <Link href={item.href} className={className}>
                      {item.title}
                    </Link>
                  )}
                </div>
              );
            })}
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
