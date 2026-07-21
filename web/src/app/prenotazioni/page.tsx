import Image from "next/image";
import Link from "next/link";

import { BookingInquiryForm } from "@/components/forms/booking-inquiry-form";
import { beachBookingUrl, bookingVenues } from "@/lib/booking-config";
import { buildMetadata } from "@/lib/seo";

const bookingGroups = [
  {
    id: "food",
    title: "Food",
    description: "Due cucine, due atmosfere, lo stesso mare.",
    destinations: [
      {
        label: "Prenota Hawaii",
        description: "Pesce, pizza e cocktail bar al piano terra.",
        href: bookingVenues.hawaii.internalBookingPath,
        image: {
          src: "/media/hawaii/photos/food-gnocchi-mare.jpg",
          alt: "Piatto di pesce del ristorante Hawaii",
        },
      },
      {
        label: "Prenota MUULab",
        description: "Brace, cucina a vista e tramonto sulla terrazza.",
        href: bookingVenues.muulab.internalBookingPath,
        image: {
          src: "/media/hawaii/photos/muulab-carpaccio-nero.jpg",
          alt: "Carpaccio di manzo di MUULab Riviera",
        },
      },
    ],
  },
  {
    id: "beach-sport",
    title: "Beach & Sport",
    description: "Dal lettino al campo, scegli il tuo ritmo.",
    destinations: [
      {
        label: "Prenota spiaggia",
        description: "Palma, ombrellone e servizi beach sul portale Spiagge.it.",
        href: beachBookingUrl,
        external: true,
      },
      {
        label: "Prenota sport",
        description: "Padel, outdoor gym e attività sul mare.",
        href: "/sport",
      },
    ],
  },
  {
    id: "private-events",
    title: "Eventi privati",
    description: "Occasioni da costruire intorno ai tuoi ospiti.",
    destinations: [
      {
        label: "Richiedi una serata o un evento",
        description: "Raccontaci il format, la data e il numero di ospiti.",
        href: "/eventi",
      },
      {
        label: "Richiedi una festa privata",
        description: "Costruiamo insieme spazi, menu e allestimento.",
        href: "/feste-private",
      },
    ],
  },
] as const;

export const metadata = buildMetadata({
  title: "Prenotazioni | Hawaii Pescara",
  description: "Scegli cosa prenotare tra spiaggia, tavolo, terrazza, sport ed eventi privati.",
  path: "/prenotazioni",
});

export default function BookingPage() {
  return (
    <main className="theme-light bg-[#f8f5ee]">
      <section className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#96703d]">
              Prenotazioni
            </p>
            <h1 className="mt-5 max-w-[10ch] font-serif text-5xl leading-[0.9] text-[#16292d] sm:text-6xl">
              Scegli come entrare in Hawaii.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c5453]">
              Spiaggia, tavolo mare, terrazza, sport o una richiesta piu ampia.
              Ogni percorso ha il suo accesso.
            </p>
            <div className="mt-12 grid gap-10">
              {bookingGroups.map((group, groupIndex) => (
                <section key={group.id} data-booking-group={group.id}>
                  <div className="flex items-end gap-4 border-b border-[#16292d]/15 pb-4">
                    <span className="pb-1 text-[0.62rem] tracking-[0.2em] text-[#96703d]">
                      0{groupIndex + 1}
                    </span>
                    <div>
                      <h2 className="font-serif text-3xl text-[#16292d]">{group.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#68706e]">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {group.destinations.map((option) => (
                      <Link
                        key={option.href}
                        href={option.href}
                        target={"external" in option ? "_blank" : undefined}
                        rel={"external" in option ? "noopener noreferrer" : undefined}
                        className={`group min-h-40 rounded-[1.4rem] border border-[#1c2b2e]/10 bg-white shadow-[0_12px_34px_rgba(23,32,34,0.06)] transition hover:-translate-y-0.5 hover:border-[#96703d]/35 hover:shadow-[0_16px_42px_rgba(23,32,34,0.1)] ${
                          "image" in option ? "overflow-hidden" : "p-5"
                        }`}
                      >
                        {"image" in option ? (
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              data-booking-image
                              src={option.image.src}
                              alt={option.image.alt}
                              fill
                              sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
                              className="object-cover transition duration-700 group-hover:scale-[1.025]"
                            />
                          </div>
                        ) : null}
                        <div className={"image" in option ? "p-5" : ""}>
                          <strong
                            data-booking-label
                            className="block font-serif text-2xl leading-tight text-[#16292d] transition group-hover:text-[#0b555c]"
                          >
                            {option.label}
                          </strong>
                          <p className="mt-3 text-sm leading-6 text-[#4c5453]">
                            {option.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="lg:pt-10">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#96703d]">
              Richiesta rapida
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[#16292d]">
              Lascia i tuoi riferimenti.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#4c5453]">
              Ti ricontattiamo con il canale piu adatto in base alla tua richiesta.
            </p>
            <div className="mt-8">
              <BookingInquiryForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
