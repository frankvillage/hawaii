import {
  beachBookingUrl,
  bookingVenues,
  sportBooking,
  type BookingVenueId,
} from "@/lib/booking-config";

export type Action = {
  label: string;
  href: string;
};

export type MediaAsset = {
  src: string;
  alt: string;
};

export type JourneyHotspot = {
  label: string;
  href: string;
  x: number;
  y: number;
  caption?: string;
};

export const routeCaptions: Record<string, string> = {
  "/menu": "Crudi, primi, brace e carta vini",
  "/prenotazioni": "Spiaggia, tavolo mare o terrazza",
  "/beach": "Ombrelloni e palme fronte mare",
  "/sport": "Padel e outdoor training",
  "/eventi": "Sunset, dj set e special date",
  "/terrazza": "MUULab Riviera · sunset e brace",
  "/ristorante-mare": "Pesce, à la carte, cocktail bar",
  "/feste-private": "Cene riservate ed eventi su misura",
  "/villaggio": "Il villaggio in un colpo d'occhio",
};

export type SceneMenuItem = {
  name: string;
  price?: string;
};

export type SceneMenu = {
  anchor: string;
  items: SceneMenuItem[];
};

export type SceneAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type JourneyScene = {
  id: string;
  anchor: string;
  daypart: string;
  soul: "Urban Village" | "Bar" | "Sport" | "Beach Club" | "Ristorante" | "Pizzeria" | "Aperitivo" | "MUULab" | "Eventi" | "Beach" | "Notte" | "Restaurant" | "Nightlife" | "Transition";
  eyebrow: string;
  title: string;
  summary: string;
  start: number;
  end: number;
  hotspots: JourneyHotspot[];
  menu?: SceneMenu;
  action?: SceneAction;
  /* Where the copy block sits, chosen per frame composition. */
  align?: "left" | "center" | "right";
  /* Hold-frame still shown as the backup screen if the video fails. */
  still?: string;
};

export type Chapter = {
  slug: string;
  daypart: string;
  soul: "Urban Village" | "Bar" | "Sport" | "Beach Club" | "Ristorante" | "Pizzeria" | "Aperitivo" | "MUULab" | "Eventi" | "Beach" | "Notte" | "Restaurant" | "Nightlife" | "Transition";
  eyebrow: string;
  title: string;
  summary: string;
  detail: string;
  atmosphere: string[];
  primaryAction: Action;
  secondaryAction?: Action;
  gradient: string;
  media?: MediaAsset;
};

export type PageSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type MenuDish = {
  name: string;
  price?: string;
};

export type MenuCategory = {
  title: string;
  note?: string;
  dishes: MenuDish[];
};

export type VenueMenu = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  categories: MenuCategory[];
  action?: Action;
  photos?: MediaAsset[];
  /* Official venue wordmark, shown above the carte. */
  logo?: MediaAsset;
};

export type EventFormat = {
  title: string;
  timing: string;
  description: string;
  notes: string[];
  action: Action;
};

export type FaqGroup = {
  title: string;
  intro: string;
  items: FaqItem[];
};

export type LegalSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type EntityPage = {
  slug: string;
  bookingVenueId?: BookingVenueId;
  navLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  intro: string;
  primaryAction: Action;
  secondaryAction?: Action;
  gradient: string;
  media?: MediaAsset;
  /* Extra hero photos: with 2+ entries the hero becomes a slow crossfade. */
  heroMedia?: MediaAsset[];
  /* Photo strip rendered between the text sections. */
  gallery?: MediaAsset[];
  /* Official venue wordmark, shown above the hero eyebrow. */
  brandLogo?: MediaAsset;
  sections: PageSection[];
  faqs: FaqItem[];
  schemaType: "LocalBusiness" | "Restaurant" | "SportsActivityLocation" | "EventVenue";
};

export const siteMeta = {
  name: "Hawaii Pescara",
  payoff: "Urban Village",
  description:
    "Beach club, ristorante di mare, terrazza serale, sport ed eventi sul lungomare di Pescara.",
  address: "Viale della Riviera 154, 65123 Pescara PE",
  restaurantPhone: bookingVenues.hawaii.phoneDisplay,
  email: "info@hawaiipescara.it",
  mapUrl: "https://g.page/r/CV_HAWAII_PESCARA",
  instagramUrl: "https://www.instagram.com/hawaii_pescara/",
  facebookUrl: "https://www.facebook.com/hawaiipescara",
};

export const navigation = [
  { label: "Villaggio", href: "/villaggio" },
  { label: "Beach", href: "/beach" },
  { label: "Ristorante Mare", href: "/ristorante-mare" },
  { label: "Terrazza", href: "/terrazza" },
  { label: "Sport", href: "/sport" },
  { label: "Eventi", href: "/eventi" },
];

export const soulNavigation = [
  { label: "Urban Village", href: "#villaggio" },
  { label: "Bar", href: "#bar" },
  { label: "Sport", href: "#sport" },
  { label: "Beach Club", href: "#beach" },
  { label: "Ristorante", href: "#ristorante" },
  { label: "Pizzeria", href: "#pizzeria" },
  { label: "Aperitivo", href: "#aperitivo" },
  { label: "MUULab", href: "#muulab" },
  { label: "Eventi", href: "#eventi" },
] as const;

export const homeHero = {
  eyebrow: "Hawaii Pescara • Urban Village",
  title: "Hawaii.",
  summary:
    "Un fronte mare che cambia con la luce: beach, ristorante, sport, terrazza ed eventi nello stesso paesaggio.",
  primaryAction: { label: "Esplora la giornata", href: "#beach" },
  secondaryAction: { label: "Prenota", href: "/prenotazioni" },
  media: {
    src: "/media/hawaii/journey-poster.jpg",
    alt: "Hawaii Pescara vista dall'alto tra spiaggia e mare",
  },
};

export const homeJourney = {
  media: {
    src: "/media/hawaii/journey-desktop.mp4",
    mobileSrc: "/media/hawaii/journey-mobile.mp4",
    poster: "/media/hawaii/journey-poster.jpg",
    alt: "La giornata di Hawaii Pescara dal mattino alla notte",
    duration: 57.2,
  },
  /* One scene per soul: the rail below mirrors this exact order. */
  scenes: [
    {
      id: "arrivo",
      still: "/media/hawaii/journey-poster.jpg",
      align: "center",
      anchor: "villaggio",
      daypart: "Prima luce",
      soul: "Urban Village",
      eyebrow: "Urban Village",
      title: "Benvenuto nel villaggio sul mare.",
      summary:
        "Uno dei beach resort più suggestivi della riviera adriatica: spiaggia, ristorante, sport e terrazza vivono lo stesso fronte mare.",
      start: 0,
      end: 0.125,
      hotspots: [
        { label: "Ingresso spiaggia", href: "/beach", x: 8, y: 31 },
        {
          label: "Verso il ristorante",
          href: "/ristorante-mare",
          x: 37,
          y: 27,
          caption: "Pesce, pizza e cocktail bar al piano terra",
        },
      ],
      action: { label: "Scopri il villaggio", href: "/villaggio" },
    },
    {
      id: "bar",
      still: "/media/hawaii/morning-bar.jpg",
      align: "left",
      anchor: "bar",
      daypart: "Mattina",
      soul: "Bar",
      eyebrow: "Cocktail bar",
      title: "Al bancone, dal caffè al cocktail.",
      summary:
        "Il bar apre la giornata e non la lascia più: caffè del mattino, mixology e distillati premium, con bartender che ti cuciono addosso il cocktail perfetto.",
      start: 0.125,
      end: 0.2,
      hotspots: [
        {
          label: "Il bancone",
          href: "/ristorante-mare",
          x: 62,
          y: 18,
          caption: "Caffè del mattino, mixology e distillati premium",
        },
        {
          label: "Drink list",
          href: "/menu#ristorante-mare",
          x: 86,
          y: 44,
          caption: "Classic taste, signature e distillati premium",
        },
      ],
      menu: {
        anchor: "ristorante-mare",
        items: [
          { name: "Americano classic taste", price: "€ 10" },
          { name: "Negroni classic taste", price: "€ 10" },
          { name: "Tonic Riviera", price: "€ 10" },
        ],
      },
      action: { label: "Il cocktail bar", href: "/ristorante-mare" },
    },
    {
      id: "sport",
      still: "/media/hawaii/padel-court.jpg",
      align: "right",
      anchor: "sport",
      daypart: "Tarda mattina",
      soul: "Sport",
      eyebrow: "Sport",
      title: "Il padel torna sulla sabbia.",
      summary:
        `Due campi regolamentari GIMPADEL e crossfit in spiaggia. ${sportBooking.registrationNotice}`,
      start: 0.2,
      end: 0.26,
      hotspots: [
        { label: "Campi da padel", href: "/sport", x: 31, y: 40 },
        { label: "Crossfit in spiaggia", href: "/sport", x: 72, y: 42 },
      ],
      action: {
        label: "Prenota padel su Wansport",
        href: sportBooking.portalUrl,
        external: true,
      },
    },
    {
      id: "beach",
      still: "/media/hawaii/beach-umbrellas.jpg",
      align: "center",
      anchor: "beach",
      daypart: "Pieno giorno",
      soul: "Beach Club",
      eyebrow: "Beach Club",
      title: "Una delle spiagge più ampie della costa.",
      summary:
        "Palme distanziate, sabbia fine e un giardino sempre curato: comodità e riservatezza, con il servizio che arriva fin sotto l'ombrellone.",
      start: 0.26,
      end: 0.335,
      hotspots: [
        { label: "Palme e ombrelloni", href: "/beach", x: 22, y: 42 },
        {
          label: "Servizio in spiaggia",
          href: "/menu#ristorante-mare",
          x: 80,
          y: 30,
          caption: "Fritti al cono e sandwich, sotto la palma",
        },
      ],
      menu: {
        anchor: "ristorante-mare",
        items: [
          { name: "Fritto di calamari e gamberi al cono", price: "€ 10" },
          { name: "Fritto di alici", price: "€ 8" },
          { name: "Club sandwich al salmone", price: "€ 13" },
        ],
      },
      action: { label: "Prenota ombrellone", href: beachBookingUrl, external: true },
    },
    {
      id: "ristorante",
      still: "/media/hawaii/lunch-service.jpg",
      align: "right",
      anchor: "ristorante",
      daypart: "Pranzo",
      soul: "Ristorante",
      eyebrow: "Ristorante di mare",
      title: "A pranzo comanda il pescato del giorno.",
      summary:
        "Menù à la carte di mare con l'estro dello chef: il pescato dell'Adriatico passa per la brigata e arriva al tavolo vista mare.",
      start: 0.335,
      end: 0.45,
      hotspots: [
        {
          label: "Il tavolo vista mare",
          href: bookingVenues.hawaii.internalBookingPath,
          x: 30,
          y: 22,
          caption: "Il tuo tavolo vista mare, a pranzo e a cena",
        },
        { label: "Menu di mare", href: "/menu#ristorante-mare", x: 72, y: 34 },
      ],
      menu: {
        anchor: "ristorante-mare",
        items: [
          { name: "Carpaccio di gambero rosa, maracuja e sale nero", price: "€ 16" },
          { name: "Tonnarello alle vongole e pane al prezzemolo", price: "€ 16" },
          { name: "Riso vialone nano, scampi ed erbette", price: "€ 18" },
        ],
      },
      action: {
        label: "Prenota Hawaii su TheFork",
        href: bookingVenues.hawaii.internalBookingPath,
      },
    },
    {
      id: "pizzeria",
      still: "/media/hawaii/kitchen-brace.jpg",
      align: "left",
      anchor: "pizzeria",
      daypart: "Verso sera",
      soul: "Pizzeria",
      eyebrow: "Pizzeria",
      title: "La sera si accende anche il forno.",
      summary:
        "A cena la cucina a vista sforna la pizza: le migliori farine e prodotti a km zero, per una serata più informale senza rinunciare al gusto.",
      start: 0.45,
      end: 0.55,
      hotspots: [
        {
          label: "Cucina a vista",
          href: "/ristorante-mare",
          x: 70,
          y: 34,
          caption: "Il forno e la brigata lavorano a vista",
        },
        {
          label: "Le pizze",
          href: "/menu#ristorante-mare",
          x: 85,
          y: 63,
          caption: "Farine selezionate e prodotti a km zero",
        },
      ],
      menu: {
        anchor: "ristorante-mare",
        items: [
          { name: "La pizza, a cena", price: "da € 8" },
          { name: "Polpo alla griglia", price: "€ 18" },
          { name: "Tonno alla griglia", price: "€ 20" },
        ],
      },
      action: { label: "Menu della cena", href: "/menu#ristorante-mare" },
    },
    {
      id: "aperitivo",
      still: "/media/hawaii/terrace-daybed.jpg",
      align: "center",
      anchor: "aperitivo",
      daypart: "Tramonto",
      soul: "Aperitivo",
      eyebrow: "Aperitivo in terrazza",
      title: "Il tramonto è il momento dell'aperitivo.",
      summary:
        "Daybed e tavoli vista mare per un aperitivo di pesce con la giusta atmosfera; il giovedì champagne, crudi e musica dal vivo.",
      start: 0.55,
      end: 0.74,
      hotspots: [
        {
          label: "Aperitivo vista mare",
          href: "/terrazza",
          x: 62,
          y: 20,
          caption: "Daybed e bollicine alla golden hour",
        },
        {
          label: "Il giovedì in terrazza",
          href: "/eventi",
          x: 71,
          y: 52,
          caption: "Champagne, crudi e musica dal tramonto",
        },
      ],
      menu: {
        anchor: "muulab",
        items: [
          { name: "Tonic Riviera", price: "€ 10" },
          { name: "Moscow Mule", price: "€ 10" },
          { name: "Americano classic taste", price: "€ 10" },
        ],
      },
      action: {
        label: "Prenota MUULab su TheFork",
        href: bookingVenues.muulab.internalBookingPath,
      },
    },
    {
      id: "muulab",
      still: "/media/hawaii/muulab-bar.jpg",
      align: "right",
      anchor: "muulab",
      daypart: "Sera",
      soul: "MUULab",
      eyebrow: "MUULab Riviera",
      title: "La sera prende il profumo della brace.",
      summary:
        "Cucina creativa e carni alla brace in terrazza, dove la cucina a vista e il panorama sul mare fanno da padroni.",
      start: 0.74,
      end: 0.9,
      hotspots: [
        { label: "MUULab Riviera", href: "/terrazza", x: 52, y: 18 },
        { label: "Menu della brace", href: "/menu#muulab", x: 81, y: 28 },
      ],
      menu: {
        anchor: "muulab",
        items: [
          { name: "Picanha di Black Angus USA alla brace", price: "€ 24" },
          { name: "Fiorentina di Gutrei Galicia", price: "€ 12 l'etto" },
          { name: "Carpaccio di Wagyu A5 agli agrumi", price: "€ 25" },
        ],
      },
      action: {
        label: "Prenota MUULab su TheFork",
        href: bookingVenues.muulab.internalBookingPath,
      },
    },
    {
      id: "eventi",
      still: "/media/hawaii/night-event.jpg",
      align: "center",
      anchor: "eventi",
      daypart: "Notte",
      soul: "Eventi",
      eyebrow: "Eventi",
      title: "La tua estate tra musica, food & fun.",
      summary:
        "Dj set, serate evento e feste private: dopo cena il villaggio resta acceso fino a tardi.",
      start: 0.9,
      end: 1,
      hotspots: [
        {
          label: "Feste private",
          href: "/feste-private#form",
          x: 30,
          y: 40,
          caption: "Banqueting e momenti speciali su misura",
        },
        { label: "Le serate", href: "/eventi", x: 66, y: 28 },
      ],
      action: {
        label: "Info eventi su WhatsApp",
        href: bookingVenues.hawaii.whatsappUrl,
        external: true,
      },
    },
  ] satisfies JourneyScene[],
};

export const chapters: Chapter[] = [
  {
    slug: "hero-alba",
    daypart: "Alba",
    soul: "Transition",
    eyebrow: "Intro esterna",
    title: "Il mare apre la giornata.",
    summary: "Il primo sole incontra il fronte mare e la giornata prende forma con un ritmo quieto.",
    detail: "Colazione, passi lenti e tavoli che si preparano alla luce del mattino.",
    atmosphere: ["fronte mare", "luce d'alba", "colazione", "passeggiata"],
    primaryAction: { label: "Prenota", href: "/prenotazioni" },
    secondaryAction: { label: "Contatti", href: "/contatti" },
    gradient:
      "from-[#122a3c] via-[#17384d] to-[#d6b887]",
    media: {
      src: "/media/hawaii/facade-sign.jpg",
      alt: "Insegna Hawaii sulla facciata in legno del locale",
    },
  },
  {
    slug: "beach",
    daypart: "Mattina",
    soul: "Beach",
    eyebrow: "Beach",
    title: "Spiaggia ampia, luce piena, tempo lento.",
    summary: "Palme, ombrelloni, sabbia chiara e tutto il mare davanti.",
    detail: "Una spiaggia da vivere con leggerezza, tra relax, servizi e pause che si allungano fino al tramonto.",
    atmosphere: ["palme", "ombrelloni", "mare", "relax", "giornata lunga"],
    primaryAction: { label: "Prenota spiaggia", href: beachBookingUrl },
    secondaryAction: { label: "Scopri la beach", href: "/beach" },
    gradient:
      "from-[#0f3349] via-[#1b5b75] to-[#b9d7de]",
    media: {
      src: "/media/hawaii/beach-umbrellas.jpg",
      alt: "Spiaggia Hawaii con palme, ombrelloni e vista mare",
    },
  },
  {
    slug: "morning-bar",
    daypart: "Mattino",
    soul: "Restaurant",
    eyebrow: "Morning bar",
    title: "Il mattino passa dal bar e dalla sala.",
    summary: "Caffetteria, servizio e tavoli che si preparano al ritmo del pranzo.",
    detail: "Un gesto dopo l'altro, il locale entra nel pieno della giornata.",
    atmosphere: ["colazione", "bancone", "caffe", "ospitalita"],
    primaryAction: { label: "Scopri il ristorante", href: "/ristorante-mare" },
    secondaryAction: {
      label: "Prenota Hawaii su TheFork",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    gradient:
      "from-[#223949] via-[#3c5f6a] to-[#d7c7ae]",
    media: {
      src: "/media/hawaii/morning-bar.jpg",
      alt: "Colazione al bancone del bar di Hawaii",
    },
  },
  {
    slug: "sport",
    daypart: "Tarda mattina",
    soul: "Sport",
    eyebrow: "Sport",
    title: "Padel e outdoor training entrano nel paesaggio.",
    summary: "Campi da gioco, allenamento all'aperto e aria di mare.",
    detail: "Tra padel e outdoor training, il movimento resta parte naturale dell'esperienza Hawaii.",
    atmosphere: ["padel", "crossfit", "campi", "outdoor gym", "energia"],
    primaryAction: { label: "Scopri sport", href: "/sport" },
    secondaryAction: { label: "Prenota padel su Wansport", href: sportBooking.portalUrl },
    gradient:
      "from-[#142d2c] via-[#315347] to-[#c0c985]",
    media: {
      src: "/media/hawaii/padel-court.jpg",
      alt: "Campo da padel di Hawaii durante una partita",
    },
  },
  {
    slug: "lunch-fish",
    daypart: "Pranzo",
    soul: "Restaurant",
    eyebrow: "Ristorante Mare",
    title: "A pranzo il mare arriva in tavola.",
    summary: "Pesce, cucina espressa, servizio e tavoli aperti alla luce del giorno.",
    detail: "Crudi, primi, cucina espressa e carta vini accompagnano il lato piu conviviale della giornata.",
    atmosphere: ["sala", "cucina", "piatti di mare", "vino"],
    primaryAction: {
      label: "Prenota Hawaii su TheFork",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    secondaryAction: { label: "Scopri il menu", href: "/menu" },
    gradient:
      "from-[#17384d] via-[#39566d] to-[#dbc3a0]",
    media: {
      src: "/media/hawaii/lunch-service.jpg",
      alt: "Servizio del pranzo nella sala del ristorante mare",
    },
  },
  {
    slug: "transition",
    daypart: "Cambio luce",
    soul: "Transition",
    eyebrow: "Verso la terrazza",
    title: "La luce cambia e la terrazza si avvicina.",
    summary: "Le scale accompagnano il passaggio dal giorno al tramonto.",
    detail: "Un momento breve, quasi silenzioso, prima che la sera si apra.",
    atmosphere: ["scale", "riflessi", "ombre lunghe", "tramonto"],
    primaryAction: { label: "Scopri la terrazza", href: "/terrazza" },
    gradient:
      "from-[#233241] via-[#574b46] to-[#dbb277]",
    media: {
      src: "/media/hawaii/terrace-evening.jpg",
      alt: "Zona terrazza al cambio luce",
    },
  },
  {
    slug: "sunset-terrace",
    daypart: "Tramonto",
    soul: "Nightlife",
    eyebrow: "Terrazza",
    title: "Il tramonto si apre in terrazza.",
    summary: "Vista mare, cocktail, musica e un tavolo affacciato sulla sera.",
    detail: "L'aperitivo diventa incontro, luce calda e atmosfera sospesa.",
    atmosphere: ["golden hour", "aperitivo", "cocktail", "vista mare"],
    primaryAction: { label: "Scopri MUULab Riviera", href: "/terrazza" },
    secondaryAction: { label: "Eventi in terrazza", href: "/eventi" },
    gradient:
      "from-[#5c3d3a] via-[#9d673d] to-[#f0c889]",
    media: {
      src: "/media/hawaii/terrace-daybed.jpg",
      alt: "Daybed con bollicine al tramonto in terrazza",
    },
  },
  {
    slug: "dinner-brace",
    daypart: "Sera",
    soul: "Restaurant",
    eyebrow: "Terrazza dinner",
    title: "La sera prende il profumo della brace.",
    summary: "MUULab Riviera porta in tavola carne, fuoco e cucina a vista.",
    detail: "Un capitolo piu raccolto, materico e serale rispetto al ristorante di mare.",
    atmosphere: ["brace", "carne", "cucina a vista", "cena"],
    primaryAction: {
      label: "Prenota MUULab su TheFork",
      href: bookingVenues.muulab.internalBookingPath,
    },
    secondaryAction: { label: "Scopri il menu", href: "/menu" },
    gradient:
      "from-[#281d22] via-[#5d3e34] to-[#f0b16f]",
    media: {
      src: "/media/hawaii/kitchen-brace.jpg",
      alt: "Cucina a vista con piatti in uscita la sera",
    },
  },
  {
    slug: "events-nightlife",
    daypart: "Notte",
    soul: "Nightlife",
    eyebrow: "Eventi",
    title: "Dopo cena la musica cambia passo.",
    summary: "Dj set, format serali, tavoli evento e feste fino a notte.",
    detail: "La notte chiude il ciclo e lascia gia intuire una nuova alba sul mare.",
    atmosphere: ["dj set", "nightlife", "eventi", "after dinner"],
    primaryAction: { label: "Scopri gli eventi", href: "/eventi" },
    secondaryAction: { label: "Feste private", href: "/feste-private" },
    gradient:
      "from-[#0f1117] via-[#1b2531] to-[#6a4a46]",
    media: {
      src: "/media/hawaii/night-event.jpg",
      alt: "Serata evento vista dall'alto con luci sul villaggio",
    },
  },
];

export const pages: Record<string, EntityPage> = {
  "beach": {
    slug: "beach",
    navLabel: "Beach",
    eyebrow: "Beach Club",
    title: "Tra le spiagge più ampie della costa.",
    lead: "Palme distanziate, sabbia fine e un giardino sempre curato: comodità e riservatezza davanti al mare.",
    intro:
      "L'ampiezza della nostra spiaggia permette un vero distanziamento tra le palme; l'attenzione ai servizi e la cura degli ospiti fanno il resto, dal primo caffè fino al tramonto.",
    primaryAction: { label: "Prenota palma o ombrellone", href: beachBookingUrl },
    secondaryAction: { label: "Contattaci", href: "/contatti" },
    gradient: "from-[#0e3147] via-[#1d6079] to-[#cde0df]",
    media: {
      src: "/media/hawaii/beach-umbrellas.jpg",
      alt: "Spiaggia Hawaii con ombrelloni, palme e mare",
    },
    gallery: [
      { src: "/media/hawaii/photos/estate-spaghetti-mare.jpg", alt: "Spaghetti di mare serviti fronte spiaggia" },
      { src: "/media/hawaii/photos/estate-gamberoni.jpg", alt: "Gamberoni alla griglia con salse" },
      { src: "/media/hawaii/photos/estate-crudo.jpg", alt: "Crudo di pesce dell'aperitivo in spiaggia" },
    ],
    sections: [
      {
        title: "La spiaggia",
        body: "Sabbia fine, palme distanziate e un giardino sempre curato donano fascino e riservatezza alla giornata di mare.",
        bullets: [
          "palme e ombrelloni fronte mare",
          "spazi ampi, senza ressa",
          "servizio bar fin sotto l'ombrellone",
          "teli, comfort e cura degli ospiti",
        ],
      },
      {
        title: "Fino al tramonto",
        body: "Dopo una giornata di mare concediti un momento di gusto e relax: sei nel posto ideale per un aperitivo di pesce con la giusta atmosfera.",
      },
    ],
    faqs: [
      {
        question: "Come si prenota la spiaggia?",
        answer: "Palma o ombrellone si prenotano online in pochi passaggi dal widget di prenotazione, oppure chiamando il numero della spiaggia.",
      },
      {
        question: "La spiaggia è collegata al ristorante?",
        answer: "Sì: pranzo, aperitivo e cena sono a pochi passi dall'ombrellone, e il servizio bar arriva direttamente in spiaggia.",
      },
    ],
    schemaType: "LocalBusiness",
  },
  "ristorante-mare": {
    slug: "ristorante-mare",
    bookingVenueId: "hawaii",
    navLabel: "Ristorante Mare",
    eyebrow: "Ristorante di mare",
    title: "Il pescato del giorno, dall'Adriatico alla tavola.",
    lead: "Una location suggestiva ti aspetta a pranzo e a cena, con un menù à la carte di mare e tutto l'estro del nostro chef.",
    intro:
      "Il pescato del giorno arriva dal mare Adriatico, passa per le mani della brigata di cucina e si sposa con le materie prime più fresche del territorio. Chiedi al maître i piatti del giorno.",
    primaryAction: {
      label: "Prenota Hawaii su TheFork",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    secondaryAction: { label: "Guarda il menù", href: "/menu#ristorante-mare" },
    gradient: "from-[#18384e] via-[#405667] to-[#dbc8ad]",
    media: {
      src: "/media/hawaii/photos/ristorante-hero-1.jpg",
      alt: "Tavolo apparecchiato del ristorante di mare con calici e piatto",
    },
    heroMedia: [
      {
        src: "/media/hawaii/photos/ristorante-hero-1.jpg",
        alt: "Tavolo apparecchiato del ristorante di mare con calici e piatto",
      },
      {
        src: "/media/hawaii/photos/ristorante-hero-2.jpg",
        alt: "Tagliolini alle vongole del ristorante di mare",
      },
      {
        src: "/media/hawaii/photos/ristorante-hero-3.jpg",
        alt: "Trancio di tonno alla griglia con salse",
      },
    ],
    gallery: [
      { src: "/media/hawaii/photos/food-insalata-gambero.jpg", alt: "Insalata di gamberi e finocchi" },
      { src: "/media/hawaii/photos/food-risotto-bollicine.jpg", alt: "Risotto servito con bollicine" },
      { src: "/media/hawaii/photos/pizza-forno.jpg", alt: "Pizza appena sfornata" },
    ],
    sections: [
      {
        title: "Pranzo e cena di mare",
        body: "Materie prime sempre fresche, crudi, primi e griglia: piatti che catturano prima l'olfatto, poi la vista, poi il gusto.",
        bullets: [
          "menù à la carte di mare",
          "piatti del giorno dalla brigata",
          "carta vini con servizio Coravin",
          "tavoli interni ed esterni, anche sotto la palma",
        ],
      },
      {
        title: "La pizza, a cena",
        body: "Per un pasto più informale scegli una buona pizza italiana: il giusto mix tra le migliori farine e prodotti a km zero la rende leggera e gustosa.",
      },
      {
        title: "Cocktail bar",
        body: "Dedicato a chi ama la mixology: distillati premium e bartender che capiscono le tue preferenze per proporti il tuo cocktail perfetto.",
      },
    ],
    faqs: [
      {
        question: "Il ristorante mare è diverso dalla terrazza?",
        answer: "Sì: al piano terra vivono il pesce e la pizza, dalla colazione alla cena; in terrazza MUULab Riviera accende il tramonto e la brace.",
      },
      {
        question: "Il menù è disponibile online?",
        answer: "Sì, la carta completa con i prezzi è sulla pagina menù; i piatti del giorno te li racconta il maître al tavolo.",
      },
    ],
    schemaType: "Restaurant",
  },
  "terrazza": {
    slug: "terrazza",
    bookingVenueId: "muulab",
    navLabel: "Terrazza",
    eyebrow: "La sera in terrazza",
    brandLogo: {
      src: "/media/hawaii/brand/muulab-riviera-sand.png",
      alt: "MUULab Riviera",
    },
    title: "Una location esclusiva dalla vista mozzafiato.",
    lead: "La cucina creativa e le carni alla brace ti aspettano in terrazza, dove la cucina a vista e il tramonto fanno da padroni.",
    intro:
      "MUULab Riviera è l'anima serale del villaggio: si sale per l'aperitivo al tramonto e si resta per la cena, tra brace, crudi di carne e una carta vini che attraversa mezza Europa.",
    primaryAction: {
      label: "Prenota MUULab su TheFork",
      href: bookingVenues.muulab.internalBookingPath,
    },
    secondaryAction: { label: "Guarda il menù", href: "/menu#muulab" },
    gradient: "from-[#241b21] via-[#66453a] to-[#f0b16f]",
    media: {
      src: "/media/hawaii/photos/terrazza-hero-1.jpg",
      alt: "Calice versato su una tartare in terrazza da MUULab Riviera",
    },
    heroMedia: [
      {
        src: "/media/hawaii/photos/terrazza-hero-1.jpg",
        alt: "Calice versato su una tartare in terrazza da MUULab Riviera",
      },
      {
        src: "/media/hawaii/photos/terrazza-hero-2.jpg",
        alt: "Crudo di carne e rosé sul tavolo verde della terrazza",
      },
      {
        src: "/media/hawaii/photos/terrazza-hero-3.jpg",
        alt: "Crudo di carne servito tra le sedute in vimini della terrazza",
      },
    ],
    gallery: [
      { src: "/media/hawaii/photos/muulab-tartare.jpg", alt: "Tartare di manzo di MUULab Riviera" },
      { src: "/media/hawaii/photos/brace-fuoco.jpg", alt: "La brace accesa della terrazza" },
      { src: "/media/hawaii/photos/muulab-dolce.jpg", alt: "Dolce al piatto di MUULab Riviera" },
    ],
    sections: [
      {
        title: "Il tramonto in terrazza",
        body: "Daybed, bollicine e tavoli vista mare: la golden hour è il momento più panoramico della giornata, con il giovedì dedicato a champagne, crudi e musica dal vivo.",
        bullets: [
          "vista mare a tutta terrazza",
          "cucina creativa e a vista",
          "carni alla brace e crudi di carne",
          "cantina con servizio Coravin",
        ],
      },
      {
        title: "La cena alla brace",
        body: "Picanha, fiorentina, tagli da un chilo in su: la brace lavora a vista mentre la sera scende sul mare.",
      },
    ],
    faqs: [
      {
        question: "MUULab Riviera è prenotabile separatamente?",
        answer: "Sì, la terrazza ha una prenotazione dedicata, separata dal ristorante di mare al piano terra.",
      },
      {
        question: "La terrazza è pensata per aperitivo o cena?",
        answer: "Per entrambi: si comincia con il tramonto e si prosegue a tavola, tra brace e cucina a vista.",
      },
    ],
    schemaType: "Restaurant",
  },
  "sport": {
    slug: "sport",
    navLabel: "Sport",
    eyebrow: "Sport",
    title: "Il padel torna sulla spiaggia di Hawaii.",
    lead: "Per tutti gli amanti del benessere: padel e crossfit a pochi passi dalla sabbia.",
    intro:
      "Lo sport più praticato del momento e il fitness che ti accompagna per tutta l'estate: campo o lezione si prenotano online con Wansport.",
    primaryAction: { label: "Prenota padel su Wansport", href: sportBooking.portalUrl },
    secondaryAction: {
      label: "Assistenza padel su WhatsApp",
      href: sportBooking.whatsappUrl,
    },
    gradient: "from-[#152c2f] via-[#355247] to-[#bfc57d]",
    media: {
      src: "/media/hawaii/padel-court.jpg",
      alt: "Partita di padel sul campo di Hawaii",
    },
    sections: [
      {
        title: "Padel",
        body: "Due campi da gioco regolamentari GIMPADEL, per divertirsi con gli amici o allenarsi sul serio: il padel sviluppa coordinazione e un sano agonismo che serve anche fuori dal campo.",
        bullets: [
          "due campi regolamentari GIMPADEL",
          "partite libere e lezioni con istruttore",
          sportBooking.registrationNotice,
        ],
      },
      {
        title: "Crossfit",
        body: "La spiaggia offre la possibilità di allenarsi all'aperto per tutta l'estate, con corsi pensati sia per chi inizia sia per chi è già esperto.",
      },
    ],
    faqs: [
      {
        question: "Come si prenotano campo e lezioni?",
        answer: "Su Wansport: registrati o accedi, poi scegli campo o lezione, giorno e orario. Per assistenza usa il contatto WhatsApp dedicato.",
      },
      {
        question: "Sport e spiaggia convivono nella stessa giornata?",
        answer: "Sì: una partita al mattino, il mare dopo. È uno dei tratti che rendono Hawaii un vero urban village.",
      },
    ],
    schemaType: "SportsActivityLocation",
  },
  "eventi": {
    slug: "eventi",
    navLabel: "Eventi",
    eyebrow: "Eventi & Nightlife",
    title: "Vivi con noi la tua estate tra musica, food & fun.",
    lead: "Quando scende la sera il villaggio cambia ritmo: dj set, format fissi e date speciali.",
    intro:
      "La domenica pomeriggio con dj set, il giovedì in terrazza con champagne e crudi, le serate evento annunciate sui social: ogni settimana ha i suoi appuntamenti.",
    primaryAction: {
      label: "Info eventi su WhatsApp",
      href: bookingVenues.hawaii.whatsappUrl,
    },
    secondaryAction: { label: "Feste private", href: "/feste-private" },
    gradient: "from-[#12161f] via-[#283140] to-[#7b5149]",
    media: {
      src: "/media/hawaii/night-event.jpg",
      alt: "Evento serale di Hawaii visto dall'alto",
    },
    heroMedia: [
      {
        src: "/media/hawaii/night-event.jpg",
        alt: "Evento serale di Hawaii visto dall'alto",
      },
      {
        src: "/media/hawaii/photos/eventi-terrazza-ambience.jpg",
        alt: "I tavoli della terrazza pronti per la serata",
      },
      {
        src: "/media/hawaii/terrace-daybed.jpg",
        alt: "Daybed della terrazza al tramonto",
      },
    ],
    gallery: [
      { src: "/media/hawaii/photos/muulab-vino.jpg", alt: "Calice servito in terrazza all'aperitivo" },
      { src: "/media/hawaii/terrace-evening.jpg", alt: "La terrazza che si accende la sera" },
      { src: "/media/hawaii/photos/muulab-dolce.jpg", alt: "Il dolce del dopocena" },
    ],
    sections: [
      {
        title: "I format della settimana",
        body: "Come di Domenica — pranzo à la carte che si allunga nel pomeriggio con dj set — e il giovedì in terrazza, con champagne, crudi e la musica di Mirko Alfonso e Gianluca Fratti.",
      },
      {
        title: "Special date",
        body: "Dj set, ospiti e tappe d'estate come l'Aperol tour: le date speciali arrivano prima di tutto sui nostri canali social.",
      },
    ],
    faqs: [
      {
        question: "Gli eventi sono prenotabili?",
        answer: "Sì: il tavolo per le serate si prenota dalla pagina prenotazioni, e per le date speciali trovi le indicazioni sui social.",
      },
      {
        question: "Eventi e terrazza sono collegati?",
        answer: "Sì: sunset, terrazza, nightlife e feste private fanno parte della stessa sera.",
      },
    ],
    schemaType: "EventVenue",
  },
  "feste-private": {
    slug: "feste-private",
    navLabel: "Feste Private",
    eyebrow: "Feste private & banqueting",
    title: "Vivi con noi i tuoi momenti più speciali.",
    lead: "Rendili indimenticabili: una cornice sul mare per ricorrenze, cene riservate ed eventi dedicati.",
    intro:
      "Offriamo un servizio di banqueting all'interno del beach resort, dal catering alla mise en place, con tutti i comfort di cui hai bisogno.",
    primaryAction: { label: "Richiedi un evento", href: "/feste-private#form" },
    secondaryAction: { label: "Contatti", href: "/contatti" },
    gradient: "from-[#1d2029] via-[#463b40] to-[#c79f72]",
    media: {
      src: "/media/hawaii/terrace-daybed.jpg",
      alt: "Setup serale della terrazza per eventi privati",
    },
    gallery: [
      { src: "/media/hawaii/photos/ristorante-hero-1.jpg", alt: "Tavolo apparecchiato con calici per una cena riservata" },
      { src: "/media/hawaii/photos/food-risotto-bollicine.jpg", alt: "Risotto servito con bollicine" },
      { src: "/media/hawaii/photos/muulab-vino.jpg", alt: "Vino al calice servito in terrazza" },
    ],
    sections: [
      {
        title: "Occasioni private",
        body: "Compleanni, ricorrenze, cene riservate ed eventi aziendali trovano una cornice sul mare da modellare su misura.",
        bullets: [
          "cene private e ricorrenze",
          "feste di compleanno",
          "eventi aziendali",
          "banqueting e catering interni",
        ],
      },
      {
        title: "Su misura",
        body: "Spazi, menù, allestimento e musica si calibrano sull'occasione e sul numero di ospiti: raccontaci l'idea e costruiamo il resto.",
      },
    ],
    faqs: [
      {
        question: "È possibile personalizzare format e menù?",
        answer: "Sì, ogni richiesta viene costruita su misura tra menù, spazi, allestimento e orari. Compila il form e ti ricontattiamo.",
      },
    ],
    schemaType: "LocalBusiness",
  },
};

export const quickBooking = {
  eyebrow: "Prenotazioni",
  options: [
    {
      label: "Prenota spiaggia",
      detail: "Palma o ombrellone",
      href: beachBookingUrl,
      external: true,
    },
    {
      label: "Prenota Hawaii su TheFork",
      detail: "Pranzo e cena di mare",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    {
      label: "Prenota MUULab su TheFork",
      detail: "Sunset e cena alla brace",
      href: bookingVenues.muulab.internalBookingPath,
    },
    {
      label: "Prenota padel su Wansport",
      detail: sportBooking.registrationNotice,
      href: sportBooking.portalUrl,
      external: true,
    },
    {
      label: "Info eventi su WhatsApp",
      detail: "Informazioni e serate Hawaii",
      href: bookingVenues.hawaii.whatsappUrl,
      external: true,
    },
  ],
  phones: [
    {
      label: "Hawaii",
      number: bookingVenues.hawaii.phoneDisplay,
      tel: bookingVenues.hawaii.phoneHref.replace("tel:", ""),
    },
    {
      label: "MUULab",
      number: bookingVenues.muulab.phoneDisplay,
      tel: bookingVenues.muulab.phoneHref.replace("tel:", ""),
    },
  ],
};

export const bookingOptions = [
  {
    title: "Prenota spiaggia",
    description: "Palma, ombrellone e una giornata piena di mare.",
    href: beachBookingUrl,
    external: true,
  },
  {
    title: "Prenota Hawaii su TheFork",
    description: "Pranzo o cena di pesce al piano terra.",
    href: bookingVenues.hawaii.internalBookingPath,
  },
  {
    title: "Prenota MUULab su TheFork",
    description: "MUULab Riviera, sunset e dinner con vista mare.",
    href: bookingVenues.muulab.internalBookingPath,
  },
  {
    title: "Prenota padel su Wansport",
    description: sportBooking.registrationNotice,
    href: sportBooking.portalUrl,
    external: true,
  },
  {
    title: "Info eventi su WhatsApp",
    description: "Informazioni, serate e date speciali Hawaii.",
    href: bookingVenues.hawaii.whatsappUrl,
    external: true,
  },
];

export const menuHighlights = [
  {
    title: "Ristorante Mare",
    detail: "Pranzo e cena di pesce, à la carte, cocktail bar.",
  },
  {
    title: "MUULab Riviera",
    detail: "La braceria della terrazza: brace, cucina a vista e tramonto sul mare.",
  },
  {
    title: "Cocktail",
    detail: "Bar, aperitivo e ritmi che cambiano tra giorno e sera.",
  },
  {
    title: "Carta vini",
    detail: "Abbinamenti e supporto al racconto food.",
  },
];

export const venueMenus: VenueMenu[] = [
  {
    id: "ristorante-mare",
    eyebrow: "Hawaii — piano terra",
    title: "Ristorante Mare",
    description:
      "Crudi, primi e griglia di pesce a pranzo e a cena, con i fritti al cono per la spiaggia e la pizza la sera.",
    action: {
      label: "Prenota Hawaii su TheFork",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    photos: [
      { src: "/media/hawaii/photos/food-gnocchi-mare.jpg", alt: "Piatto di pesce con pomodoro e basilico del ristorante Hawaii" },
      { src: "/media/hawaii/photos/brace-fuoco.jpg", alt: "Il pesce sulla griglia viva del ristorante Hawaii" },
      { src: "/media/hawaii/photos/food-stecco.jpg", alt: "Stecco cocco e cioccolato, il dessert di Hawaii" },
    ],
    categories: [
      {
        title: "Antipasti",
        dishes: [
          { name: "Carpaccio di gambero rosa, maracuja e sale nero", price: "€ 16" },
          { name: "Ostriche alla brace, aglio, olio e peperoncino (al pezzo)", price: "€ 4" },
          { name: "Tagliatella di seppia, pimento e scalogno", price: "€ 16" },
          { name: "Spigola laccata alla soia di mele e zenzero, zucchine e basilico", price: "€ 14" },
          { name: "Baccalà in olio cottura alla pizzaiola", price: "€ 15" },
          { name: "Insalata di mare e giardiniera di verdure", price: "€ 15" },
          { name: "Guazzetto di cozze e crostini", price: "€ 12" },
          { name: "Salmone marinato, lampone e cipolla rossa in agrodolce", price: "€ 13" },
        ],
      },
      {
        title: "I primi",
        dishes: [
          { name: "Tonnarello alle vongole e pane aromatico al prezzemolo", price: "€ 16" },
          { name: "Riso vialone nano, scampi ed erbette", price: "€ 18" },
          { name: "Ravioli di melanzane, provola, datterini e bottarga", price: "€ 18" },
          { name: "Gnocchi di patate, seppia e panocchia", price: "€ 16" },
        ],
      },
      {
        title: "Secondi e griglia",
        dishes: [
          { name: "Frittura di calamari e gamberi", price: "€ 16" },
          { name: "Polpo alla griglia", price: "€ 18" },
          { name: "Ombrina alla griglia", price: "€ 18" },
          { name: "Tonno alla griglia", price: "€ 20" },
          { name: "Pescatrice alla griglia", price: "€ 20" },
        ],
      },
      {
        title: "Fritti al cono",
        dishes: [
          { name: "Fritto di calamari e gamberi", price: "€ 10" },
          { name: "Fritto di alici", price: "€ 8" },
          { name: "Fritto di baccalà in pastella", price: "€ 8" },
        ],
      },
      {
        title: "Special panini",
        dishes: [
          { name: "Club sandwich al salmone, uova e lattuga", price: "€ 13" },
          { name: "Hot dog di tonno, porro stufato e salsa ponzu", price: "€ 16" },
          { name: "Bao alla ceviche di gamberi e chimichurri", price: "€ 14" },
        ],
      },
      {
        title: "Contorni",
        dishes: [
          { name: "Verdura ripassata", price: "€ 6" },
          { name: "Insalata mista", price: "€ 6" },
          { name: "Chips fritte", price: "€ 4" },
        ],
      },
      {
        title: "Gli sfizi, prima della pizza",
        note: "La pizza si accende la sera.",
        dishes: [
          { name: "Arancino al ragù di ventricina di manzo", price: "€ 6" },
          { name: "Arancino al ragù di polpo e provola", price: "€ 6" },
          { name: "Primo sale croccante", price: "€ 5" },
          { name: "Baccalà in pastella", price: "€ 8" },
          { name: "Montanarina alla cosacca", price: "€ 3,50" },
          { name: "Tagliere di salumi e formaggi", price: "€ 12" },
          { name: "Pallottine cacio e uova", price: "€ 8" },
          { name: "Crocchetta speck e tartufo", price: "€ 6" },
        ],
      },
      {
        title: "La pizza, a cena",
        dishes: [
          { name: "Margherita", price: "€ 9" },
          { name: "Bufala", price: "€ 11" },
          { name: "Diversamente diavola", price: "€ 14" },
          { name: "Marinara", price: "€ 8" },
          { name: "Capricciosa", price: "€ 14" },
          { name: "Nell'orto", price: "€ 13" },
          { name: "Patate e salsiccia", price: "€ 14" },
          { name: "5 formaggi", price: "€ 14" },
          { name: "Saluti da Parma", price: "€ 15" },
          { name: "Caprese", price: "€ 13" },
          { name: "Ombre nere", price: "€ 16" },
          { name: "Highlands", price: "€ 15" },
          { name: "Nerano", price: "€ 13" },
          { name: "Americana (per bambini)", price: "€ 8" },
        ],
      },
      {
        title: "I dessert",
        dishes: [
          { name: "Stecco cocco e cioccolato", price: "€ 6" },
          { name: "Tiramisù marmorizzato", price: "€ 6" },
        ],
      },
      {
        title: "Bevande, birre e cantina",
        note: "Acque, bibite, birre alla spina e in bottiglia, cantina regionale e bollicine: la carta completa è al tavolo.",
        dishes: [],
      },
    ],
  },
  {
    id: "muulab",
    eyebrow: "Terrazza — MUULab Riviera",
    logo: {
      src: "/media/hawaii/brand/muulab-riviera-dark.png",
      alt: "MUULab Riviera",
    },
    title: "La braceria della terrazza",
    description:
      "Crudi di carne, tagli alla brace e cocktail: MUULab Riviera vive la sera della terrazza, dal tramonto alla cena.",
    action: {
      label: "Prenota MUULab su TheFork",
      href: bookingVenues.muulab.internalBookingPath,
    },
    photos: [
      { src: "/media/hawaii/photos/muulab-vino.jpg", alt: "Vino al calice servito in terrazza da MUULab Riviera" },
      { src: "/media/hawaii/photos/muulab-tartare.jpg", alt: "Tartare di manzo di MUULab Riviera" },
      { src: "/media/hawaii/photos/muulab-carpaccio-nero.jpg", alt: "Carpaccio di manzo servito in terrazza" },
    ],
    categories: [
      {
        title: "Per cominciare",
        dishes: [
          { name: "Pata Negra Cinco Jotas 50 g", price: "€ 18" },
          { name: "Mini bun foie gras al tartufo", price: "€ 15" },
          { name: "Angus affumicato e giardiniera di zucchine", price: "€ 18" },
          { name: "Salame di maialino nero brado e castelmagno", price: "€ 12" },
        ],
      },
      {
        title: "Crudi di carne",
        dishes: [
          { name: "Battuta di Black Angus al naturale con sale Maldon", price: "€ 15" },
          { name: "Tartare di manzo, mirtillo, ostrica grattugiata, nocciole e pino mugo", price: "€ 18" },
          { name: "Battuta di manzo, cipolla di Tropea, coriandolo, friggitelli e lime", price: "€ 16" },
          { name: "Tartare di manzo, anguria e tahina", price: "€ 15" },
          { name: "Carpaccio di picanha cbt, pomodoro arrostito, arancia e ricotta salata", price: "€ 17" },
          { name: "Controfiletto, pesca grigliata, pinoli e basilico", price: "€ 19" },
          { name: "Carpaccio di controfiletto, beurre blanc e soia", price: "€ 19" },
          { name: "Carpaccio di Wagyu A5 BMS 12 marinato agli agrumi", price: "€ 25" },
          { name: "Magatello al punto rosa, spuma di capperi e limone, caffè e tonno", price: "€ 18" },
          { name: "Tataki di manzo, cacao e caffè, salsa ponzu e tartufo", price: "€ 20" },
          { name: "Melanzana infornata, colatura di alici, pomodoro a pera e bufala", price: "€ 15" },
          { name: "Bresaola di peperone, rucola e grana", price: "€ 14" },
        ],
      },
      {
        title: "I secondi alla brace",
        dishes: [
          { name: "Picanha di Black Angus USA alla brace", price: "€ 24" },
          { name: "Cuberoll di Oceanic Beef Nuova Zelanda (min. 300 g)", price: "€ 11 l'etto" },
          { name: "Controfiletto Black Angus americano premium (min. 300 g)", price: "€ 11 l'etto" },
          { name: "Filetto di Angus irlandese alla brace (220 g ca.)", price: "€ 25" },
          { name: "Wagyu A5 BMS 12", price: "€ 38 l'etto" },
        ],
      },
      {
        title: "Tagli alla brace",
        note: "Taglio minimo 1 kg.",
        dishes: [
          { name: "Picanha di Black Angus USA intera (1 kg, scaloppata)", price: "€ 80" },
          { name: "Costata di Gutrei Galicia", price: "€ 11 l'etto" },
          { name: "Fiorentina di Gutrei Galicia", price: "€ 12 l'etto" },
          { name: "Costata di Mazura premium", price: "€ 11 l'etto" },
          { name: "Fiorentina di Mazura premium", price: "€ 12 l'etto" },
          { name: "Costata di Hereford pura", price: "€ 11 l'etto" },
          { name: "Fiorentina di Hereford pura", price: "€ 12 l'etto" },
          { name: "Costata danese selezione premium", price: "€ 10 l'etto" },
        ],
      },
      {
        title: "Contorni",
        dishes: [
          { name: "Insalata russa", price: "€ 8" },
          { name: "Peperoni arrostiti", price: "€ 8" },
          { name: "Giardiniera di zucchine in agrodolce", price: "€ 8" },
          { name: "Caponata di melanzane", price: "€ 8" },
        ],
      },
      {
        title: "Dolci",
        dishes: [
          { name: "Crostata di visciole, yogurt, dulce de leche e mais", price: "€ 9" },
          { name: "Il limone", price: "€ 8" },
          { name: "Il cocco", price: "€ 8" },
          { name: "Tiramicoux", price: "€ 8" },
        ],
      },
      {
        title: "Cocktail e aperitivo",
        dishes: [
          { name: "Americano classic taste", price: "€ 10" },
          { name: "Negroni classic taste", price: "€ 10" },
          { name: "Tonic Riviera", price: "€ 10" },
          { name: "Moscow Mule", price: "€ 10" },
          { name: "Whiskey Sour", price: "€ 10" },
          { name: "Vodka Red Bull", price: "€ 10" },
        ],
      },
      {
        title: "Cantina e Coravin",
        note: "Vini al calice con sistema Coravin, birre artigianali, bollicine e una cantina che attraversa Abruzzo, Piemonte, Borgogna e Champagne: la carta completa è al tavolo.",
        dishes: [],
      },
    ],
  },
];

/* Formats recycled from the events page of the current WordPress site. */
export const eventFormats: EventFormat[] = [
  {
    title: "Come di Domenica",
    timing: "Domenica · 16:00 – 22:00",
    description:
      "Il format della domenica: pranzo à la carte che si allunga nel pomeriggio, dj set e il mare davanti fino al tramonto.",
    notes: ["pranzo à la carte", "dj set", "pomeriggio sul mare"],
    action: { label: "Info eventi su WhatsApp", href: bookingVenues.hawaii.whatsappUrl },
  },
  {
    title: "Il Giovedì in terrazza",
    timing: "Giovedì · 18:00 – 01:00",
    description:
      "Aperitivo al tramonto in terrazza con champagne e crudi di mare, accompagnato dalla musica di Mirko Alfonso e Gianluca Fratti.",
    notes: ["sunset aperitivo", "champagne e crudi", "musica dal vivo"],
    action: { label: "Prenota la terrazza", href: "/terrazza" },
  },
  {
    title: "Special Date",
    timing: "Date selezionate",
    description:
      "Serate speciali e tappe d'estate — come l'Aperol tour — con dj set, ospiti e tavoli evento annunciati sui canali social.",
    notes: ["dj set", "special guest", "tavoli evento"],
    action: { label: "Info eventi su WhatsApp", href: bookingVenues.hawaii.whatsappUrl },
  },
];

export const faqGroups: FaqGroup[] = [
  {
    title: "Beach",
    intro: "Informazioni utili per organizzare la spiaggia e vivere il mare con calma.",
    items: pages["beach"].faqs,
  },
  {
    title: "Food & Terrace",
    intro: "Una guida semplice per orientarsi tra cucina di mare, terrazza e menu.",
    items: [...pages["ristorante-mare"].faqs, ...pages["terrazza"].faqs],
  },
  {
    title: "Sport & Nightlife",
    intro: "Risposte rapide su attivita sportive, serate e richieste dedicate.",
    items: [...pages["sport"].faqs, ...pages["eventi"].faqs],
  },
];

export const faqIndex: FaqItem[] = [
  ...pages["beach"].faqs,
  ...pages["ristorante-mare"].faqs,
  ...pages["terrazza"].faqs,
  ...pages["sport"].faqs,
  ...pages["eventi"].faqs,
];

/* Aligned with the informativa published on www.hawaiipescara.it/privacy-policy
   (titolare: Kona S.R.L.). Keep in sync with the WordPress site. */
export const legalSections: Record<"privacy" | "cookie", LegalSection[]> = {
  privacy: [
    {
      title: "Titolare del trattamento",
      body: `Il titolare del trattamento è Kona S.R.L., Viale della Riviera 154, 65123 Pescara (PE). Per ogni richiesta relativa ai dati personali: info@hawaiipescara.it · WhatsApp ${bookingVenues.hawaii.whatsappUrl}.`,
    },
    {
      title: "Navigazione sul sito",
      body: "Durante la navigazione vengono raccolti dati tecnici quali indirizzi IP, indirizzi URI delle risorse richieste e orari di connessione, oltre ai cookie descritti nell'informativa dedicata.",
      bullets: [
        "finalità: funzionamento del sito, sicurezza e analisi statistica",
        "base giuridica: art. 6.1.b GDPR per gli strumenti tecnici; consenso per gli strumenti di profilazione",
        "conservazione: dati di navigazione fino a 1 mese; cookie fino a 12 mesi",
      ],
    },
    {
      title: "Form di contatto e prenotazioni",
      body: "I dati inviati tramite i form (nome, cognome, email, telefono) sono trattati per rispondere a richieste informative e commerciali e per gestire prenotazioni ed eventi.",
      bullets: [
        "base giuridica: esecuzione di misure precontrattuali richieste dall'interessato",
        "conservazione: massimo 12 mesi dalla richiesta",
      ],
    },
    {
      title: "Prenotazioni tramite TheFork",
      body: "Il modulo di TheFork e protetto da un consenso specifico. Solo dopo l'attivazione il browser avvia una connessione di rete verso widget.thefork.com, servizio di terza parte gestito da TheFork, prima che l'utente inserisca eventuali dati di prenotazione.",
    },
    {
      title: "Clienti e fornitori",
      body: "Per clienti e fornitori sono trattati dati identificativi, di contatto e riferimenti di pagamento, per l'esecuzione del contratto, gli adempimenti legali e fiscali e la difesa dei diritti del titolare.",
      bullets: [
        "base giuridica: necessità contrattuale, obblighi di legge, legittimo interesse",
        "conservazione: durata del contratto e successivi 10 anni",
      ],
    },
    {
      title: "Diritti dell'interessato",
      body: "In qualsiasi momento è possibile richiedere accesso, rettifica, cancellazione, portabilità, limitazione del trattamento e revoca del consenso scrivendo a info@hawaiipescara.it.",
    },
  ],
  cookie: [
    {
      title: "Cosa sono e come li usiamo",
      body: "Il sito utilizza cookie tecnici necessari al funzionamento e, previo consenso, strumenti di misurazione. I dati di navigazione sono conservati fino a 1 mese; i cookie fino a 12 mesi.",
    },
    {
      title: "Categorie di cookie",
      body: "Le categorie in uso rispecchiano quelle dichiarate nell'informativa privacy del titolare Kona S.R.L.",
      bullets: [
        "cookie tecnici necessari (base giuridica: art. 6.1.b GDPR)",
        "cookie analitici e statistici, attivati solo dopo il consenso",
        "eventuali cookie di profilazione di terze parti, solo previo consenso esplicito",
      ],
    },
    {
      title: "Gestione del consenso",
      body: "Al primo accesso il banner consente di accettare o rifiutare i cookie non necessari; la scelta è modificabile in qualsiasi momento da questa pagina o dalle impostazioni del browser, dove i cookie possono anche essere eliminati.",
    },
    {
      title: "Consenso specifico per TheFork",
      body: "Il widget di TheFork resta disattivato finche non viene espresso un consenso specifico. L'attivazione avvia una connessione di rete verso widget.thefork.com, servizio di terza parte gestito da TheFork, prima di inserire i dati di prenotazione.",
    },
    {
      title: "Titolare e contatti",
      body: "Titolare del trattamento: Kona S.R.L., Viale della Riviera 154, 65123 Pescara (PE) · info@hawaiipescara.it. Per il quadro completo si rimanda all'informativa privacy.",
    },
  ],
};
