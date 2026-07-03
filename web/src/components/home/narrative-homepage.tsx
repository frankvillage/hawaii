import Image from "next/image";
import Link from "next/link";

import { SoulRail } from "@/components/home/soul-rail";
import { ScrollVideoStage } from "@/components/home/scroll-video-stage";

type GalleryItem = {
  label: string;
  title: string;
  href: string;
  image: string;
  alt: string;
};

const soulGallery: GalleryItem[] = [
  {
    label: "Beach",
    title: "Mattine lunghe tra sabbia, ombra e mare aperto.",
    href: "/beach",
    image: "/media/hawaii/village-aerial.jpg",
    alt: "Veduta aerea di Hawaii tra spiaggia e terrazza sul mare",
  },
  {
    label: "Restaurant",
    title: "Pesce, sala e un ritmo che cambia con la luce.",
    href: "/ristorante-mare",
    image: "/media/hawaii/dinner-table.jpg",
    alt: "Tavolo del ristorante mare",
  },
  {
    label: "Sport",
    title: "Padel e outdoor training dentro il villaggio.",
    href: "/sport",
    image: "/media/hawaii/padel-court.jpg",
    alt: "Partita di padel sui campi di Hawaii",
  },
  {
    label: "Nightlife",
    title: "Terrazza, tramonto, dj set e dopocena.",
    href: "/eventi",
    image: "/media/hawaii/night-event.jpg",
    alt: "Serata evento di Hawaii con luci sul villaggio",
  },
];

export function NarrativeHomepage() {
  return (
    <main className="bg-[#050b10] text-white">
      <SoulRail />
      <ScrollVideoStage />

      <section className="border-t border-white/10 border-b border-white/10 bg-[#07111a]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#e8c89e]">
              Le quattro anime
            </p>
            <h2 className="mt-4 max-w-[14ch] font-serif text-4xl leading-[0.95] text-[#f6efe6] sm:text-5xl">
              Beach, restaurant, sport, nightlife.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#dfe6e9]">
              Tutto convive nello stesso fronte mare e resta raggiungibile in pochi gesti.
            </p>
          </div>

          <div className="mt-8 grid gap-[1px] overflow-hidden rounded-[2rem] bg-white/10 lg:grid-cols-2">
            {soulGallery.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                data-testid="soul-gallery-item"
                className="group relative isolate min-h-[15rem] overflow-hidden bg-[#09131c] sm:min-h-[18rem] lg:min-h-[21rem]"
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,12,0.06),rgba(3,8,12,0.72))]" />
                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-6 lg:p-7">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#e8c89e]">
                    {item.label}
                  </p>
                  <h3 className="mt-3 max-w-[15ch] font-serif text-3xl leading-[0.96] text-[#f6efe6] sm:text-4xl">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <Image
          src="/media/hawaii/seafront-aerial.jpg"
          alt="Il fronte mare di Hawaii visto dall'alto"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,12,0.76),rgba(3,8,12,0.48)_28%,rgba(3,8,12,0.86))]" />

        <div className="relative z-10 mx-auto flex min-h-[48svh] max-w-7xl flex-col justify-end px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#e8c89e]">
              Prenotazioni
            </p>
            <h2 className="mt-4 max-w-[12ch] font-serif text-4xl leading-[0.95] text-[#f6efe6] sm:text-5xl">
              Spiaggia, tavolo, terrazza, eventi privati.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#e3eaee]">
              Ogni momento di Hawaii resta prenotabile con un passaggio breve e diretto.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/prenotazioni"
              className="rounded-full bg-[#bf7148] px-5 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#cc7d54]"
            >
              Vai alle prenotazioni
            </Link>
            <Link
              href="/menu"
              className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-[#f6efe6] transition hover:border-white/40"
            >
              Scopri i menu
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
