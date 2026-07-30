export type SocialImage = {
  readonly src: string;
  readonly alt: string;
};

const fallback: SocialImage = {
  src: "/opengraph-image.jpg",
  alt: "Hawaii Pescara, Urban Village sul mare",
};

const imagesByPath: Readonly<Record<string, SocialImage>> = {
  "/": { src: "/media/hawaii/journey-poster.jpg", alt: "Hawaii Pescara vista dal mare" },
  "/villaggio": { src: "/media/hawaii/journey-poster.jpg", alt: "Hawaii Pescara, Urban Village" },
  "/beach": { src: "/media/hawaii/beach-umbrellas.jpg", alt: "Beach club Hawaii sul mare" },
  "/ristorante-mare": { src: "/media/hawaii/photos/ristorante-hero-1.jpg", alt: "Ristorante di mare Hawaii" },
  "/terrazza": { src: "/media/hawaii/photos/terrazza-hero-1.jpg", alt: "Terrazza MUULab Riviera" },
  "/sport": { src: "/media/hawaii/padel-court.jpg", alt: "Sport e vita all'aperto a Hawaii" },
  "/eventi": { src: "/media/hawaii/night-event.jpg", alt: "Evento serale a Hawaii" },
  "/feste-private": { src: "/media/hawaii/terrace-daybed.jpg", alt: "Terrazza Hawaii per feste private" },
  "/menu": { src: "/media/hawaii/photos/estate-crudo.jpg", alt: "Cucina di mare Hawaii" },
  "/prenotazioni": { src: "/media/hawaii/photos/food-gnocchi-mare.jpg", alt: "Prenotazioni Hawaii Pescara" },
  "/prenotazioni/ristorante": { src: "/media/hawaii/photos/ristorante-hero-1.jpg", alt: "Prenota il ristorante Hawaii" },
  "/prenotazioni/muulab": { src: "/media/hawaii/photos/muulab-carpaccio-nero.jpg", alt: "Prenota MUULab Riviera" },
  "/faq": fallback,
  "/contatti": { src: "/media/hawaii/journey-poster.jpg", alt: "Hawaii Pescara sul mare" },
  "/privacy": fallback,
  "/cookie": fallback,
};

export function socialImageForPath(path: string | undefined): SocialImage {
  return imagesByPath[path ?? "/"] ?? fallback;
}
