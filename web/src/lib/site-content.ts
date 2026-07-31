import {
  beachBookingUrl,
  bookingVenues,
  sportBooking,
  whatsappContacts,
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
  note?: string;
  /* Codes declared in the venue's official menu. Omit only when not yet verified. */
  allergens?: readonly number[];
};

export const allergenLegend = [
  { id: 1, label: "Cereali contenenti glutine" },
  { id: 2, label: "Crostacei" },
  { id: 3, label: "Uova" },
  { id: 4, label: "Pesce" },
  { id: 5, label: "Arachidi" },
  { id: 6, label: "Soia" },
  { id: 7, label: "Latte" },
  { id: 8, label: "Frutta a guscio" },
  { id: 9, label: "Sedano" },
  { id: 10, label: "Senape" },
  { id: 11, label: "Semi di sesamo" },
  { id: 12, label: "Anidride solforosa e solfiti" },
  { id: 13, label: "Lupini" },
  { id: 14, label: "Molluschi" },
] as const;

export type MenuCategory = {
  title: string;
  note?: string;
  dishes: MenuDish[];
  anchor?: string;
  action?: Action;
};

export type WineSection = {
  title: string;
  wines: { name: string; price?: string }[];
};

export type VenueMenu = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  categories: MenuCategory[];
  wineSections?: WineSection[];
  action?: Action;
  documentAction?: Action;
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
  references?: Action[];
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
          caption: "Servizio al tavolo e sotto l'ombrellone",
        },
      ],
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
        label: "Prenota Hawaii",
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
        "Daybed e tavoli vista mare, cocktail e bollicine accompagnano la golden hour sul mare.",
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
          label: "Cocktail & bollicine",
          href: "/menu#cocktail",
          x: 71,
          y: 52,
          caption: "Mixology e bollicine alla golden hour",
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
        label: "Prenota MUULab",
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
        label: "Prenota MUULab",
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
        {
          label: "Giovedì Posh",
          href: "/eventi",
          x: 66,
          y: 28,
          caption: "Dj set e tavoli sotto le stelle",
        },
      ],
      action: {
        label: "Info eventi su WhatsApp",
        href: whatsappContacts.events,
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
      label: "Prenota Hawaii",
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
      label: "Prenota Hawaii",
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
      label: "Prenota MUULab",
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
      label: "Prenota Hawaii",
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
      label: "Prenota MUULab",
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
        body: "Daybed, bollicine e tavoli vista mare: la golden hour è il momento più panoramico della giornata; il Giovedì Posh anima invece il piano terra.",
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
      "La domenica pomeriggio con dj set, il Giovedì Posh al piano terra e le serate evento annunciate sui social: ogni settimana ha i suoi appuntamenti.",
    primaryAction: {
      label: "Info eventi su WhatsApp",
      href: whatsappContacts.events,
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
        body: "Come di Domenica — pranzo à la carte che si allunga nel pomeriggio con dj set — e il Giovedì Posh all'esterno, al piano terra, con la veranda pronta in caso di pioggia.",
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
      label: "Prenota Hawaii",
      detail: "Pranzo e cena di mare",
      href: bookingVenues.hawaii.internalBookingPath,
    },
    {
      label: "Prenota MUULab",
      detail: "Sunset e cena alla brace",
      href: bookingVenues.muulab.internalBookingPath,
    },
    {
      label: "Prenota padel",
      detail: "Campi, assistenza e accesso a Wansport",
      href: "/sport",
    },
    {
      label: "Info eventi su WhatsApp",
      detail: "Informazioni e serate Hawaii",
      href: whatsappContacts.events,
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
    title: "Prenota Hawaii",
    description: "Pranzo o cena di pesce al piano terra.",
    href: bookingVenues.hawaii.internalBookingPath,
  },
  {
    title: "Prenota MUULab",
    description: "MUULab Riviera, sunset e dinner con vista mare.",
    href: bookingVenues.muulab.internalBookingPath,
  },
  {
    title: "Prenota padel",
    description: "Campi, assistenza e accesso a Wansport.",
    href: "/sport",
  },
  {
    title: "Info eventi su WhatsApp",
    description: "Informazioni, serate e date speciali Hawaii.",
    href: whatsappContacts.events,
    external: true,
  },
];

export const menuHighlights = [
  {
    title: "Ristorante Mare",
    detail: "Pranzo e cena di pesce, à la carte, cocktail bar.",
    href: "#ristorante-mare",
  },
  {
    title: "MUULab Riviera",
    detail: "La braceria della terrazza: brace, cucina a vista e tramonto sul mare.",
    href: "#muulab",
  },
  {
    title: "Cocktail",
    detail: "Bar, aperitivo e ritmi che cambiano tra giorno e sera.",
    href: "#cocktail",
  },
  {
    title: "Carta vini",
    detail: "Etichette abruzzesi, vini italiani, bollicine e Champagne.",
    href: "#carta-vini",
  },
];

export const cocktailMenuItems: MenuDish[] = [
  { name: "Americano classic taste", price: "€ 10" },
  { name: "Negroni classic taste", price: "€ 10" },
  { name: "Tonic Riviera", price: "€ 10" },
  { name: "Moscow Mule", price: "€ 10" },
  { name: "Whiskey Sour", price: "€ 10" },
  { name: "Vodka Red Bull", price: "€ 10" },
];

export const hawaiiWineSections: MenuCategory[] = [
  {
    title: "Vini",
    dishes: [
      { name: "Masciarelli - Castello di Semivicoli Trebbiano", price: "€ 33" },
      { name: "Masciarelli - Castello di Semivicoli Pecorino", price: "€ 26" },
      { name: "Masciarelli - Marina Cvetic Trebbiano", price: "€ 60" },
      { name: "Valori - Octava Dies Pecorino Anfora", price: "€ 30" },
      { name: "Valori - Cerasuolo d'Abruzzo", price: "€ 22" },
      { name: "Valori - Rosato", price: "€ 23" },
      { name: "Valori - Pecorino", price: "€ 23" },
      { name: "Tiberio - Trebbiano", price: "€ 26" },
      { name: "Tiberio - Pecorino", price: "€ 26" },
      { name: "Tiberio - Cerasuolo", price: "€ 26" },
      { name: "Valle Reale - Trebbiano DOC", price: "€ 27" },
      { name: "Valle Reale - Vigneto di Popoli Trebbiano DOC", price: "€ 55" },
      { name: "Valle Reale - Cerasuolo", price: "€ 27" },
      { name: "Valle Reale - Montepulciano DOC", price: "€ 28" },
      { name: "Ciavolich - Pecorino", price: "€ 26" },
      { name: "Ciavolich - Cococciola", price: "€ 25" },
      { name: "Ciavolich - Cerasuolo", price: "€ 25" },
      { name: "Famiglia Febo - Pecorino", price: "€ 24" },
      { name: "Famiglia Febo - Trebbiano 2019", price: "€ 25" },
      { name: "D'Alesio - Montonico", price: "€ 24" },
      { name: "Pasetti - Cerasuolo Superiore", price: "€ 30" },
      { name: "Praesidium - Cerasuolo Superiore", price: "€ 31" },
      { name: "Faraone - Cerasuolo", price: "€ 23" },
      { name: "Marotti Campi - Luzano Verdicchio dei Castelli di Jesi", price: "€ 23" },
      { name: "Alois Lageder - Misto Mare Bianco", price: "€ 23" },
      { name: "Alois Lageder - Gewurztraminer", price: "€ 26" },
      { name: "Alois Lageder - Lagrein Rose", price: "€ 25" },
      { name: "Alois Lageder - Mimuet Pinot Nero", price: "€ 35" },
      { name: "Vigna Astoni - Falanghina Campi Flegrei", price: "€ 40" },
      { name: "Ferlat - Pinot Grigio Ramato", price: "€ 25" },
      { name: "Ferlat - Friulano", price: "€ 25" },
      { name: "Massolino - Chardonnay", price: "€ 26" },
      { name: "Massolino - Riesling", price: "€ 30" },
      { name: "Casina Bric - Mesdi Bianco Arneis", price: "€ 25" },
      { name: "Muri Gries - Schiava", price: "€ 24" },
      { name: "Patrice Colin - Chenin Blanc Vieilles Vignes", price: "€ 30" },
      { name: "Albert de Conti - Odette Rose", price: "€ 25" },
      { name: "Albert de Conti - Blanc Cuvee des Conti", price: "€ 25" },
      { name: "Domaine d'Elise - Chablis", price: "€ 40" },
      { name: "Domaine Philippe Girard - Bourgogne Aligote", price: "€ 32" },
      { name: "Les Amoureuses - Promenade Sauvignon", price: "€ 25" },
      { name: "Mirabeau - Forever Summer", price: "€ 27" },
      { name: "Domaine de la Begude - Mediterranee Rose", price: "€ 25" },
      { name: "Jeremy Quastana - Engluti", price: "€ 28" },
      { name: "St. Urbans-Hof - Riesling Trocken", price: "€ 28" },
      { name: "Schneider-Baden - Rose Pinot Nero", price: "€ 30" },
    ],
  },
  {
    title: "Bollicine",
    dishes: [
      { name: "Cherubini - Sui Generis", price: "€ 45" },
      { name: "Cherubini - Levis Rose", price: "€ 50" },
      { name: "Cherubini - Subsidium 60 mesi", price: "€ 60" },
      { name: "Tenuta Volpare - Trento DOC Rose", price: "€ 40" },
      { name: "Tenuta Volpare - Trento DOC", price: "€ 35" },
      { name: "Ca' del Bosco - Cuvee Prestige Rose", price: "€ 63" },
      { name: "Ca' del Bosco - Cuvee Prestige", price: "€ 50" },
      { name: "Nicola Gatta - Cuvee Nature 30 lune", price: "€ 45" },
      { name: "Nicola Gatta - 400", price: "€ 55" },
      { name: "Tenuta Rocca - Alta Langa DOCG", price: "€ 35" },
      { name: "Rossetti & Scrivani - Rose de Noirs Oltrepo Pavese", price: "€ 33" },
      { name: "Pierremarie Chermette - Cremant Extra Brut", price: "€ 35" },
      { name: "Croix St. Jacques - Cremant de Bourgogne Blanc de Blancs Nature", price: "€ 40" },
      { name: "Laurent-Perrier - La Cuvee", price: "€ 60" },
      { name: "Laurent-Perrier - Rose", price: "€ 95" },
      { name: "Laurent-Perrier - Heritage", price: "€ 95" },
      { name: "Assailly - Cuvee Reservee", price: "€ 65" },
      { name: "Assailly - Cuvee Rose", price: "€ 70" },
      { name: "Miniere - Influence Rose", price: "€ 95" },
      { name: "Miniere - Influence", price: "€ 85" },
      { name: "Thierry Fournier - Reservee", price: "€ 55" },
      { name: "Thierry Fournier - Rose", price: "€ 58" },
      { name: "Caze-Thibaut - Naturellement", price: "€ 90" },
      { name: "R. Pouillon & Fils - Rose de Maceration", price: "€ 110" },
      { name: "Vauversin - Rossignol Or 2019 Nature", price: "€ 105" },
      { name: "Dom Perignon - Vintage 2017", price: "€ 290" },
      { name: "Krug - Grande Cuvee 173eme Edition", price: "€ 330" },
    ],
  },
];

export const venueMenus: VenueMenu[] = [
  {
    id: "ristorante-mare",
    eyebrow: "Hawaii — piano terra",
    title: "Ristorante Mare",
    description:
      "Crudi, primi e griglia di pesce a pranzo e a cena, con la pizza la sera.",
    action: {
      label: "Prenota Hawaii",
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
          { name: "Carpaccio di gambero rosa, maracuja e sale nero", price: "€ 16", allergens: [2] },
          { name: "Ostriche alla brace, aglio, olio e peperoncino (al pezzo)", price: "€ 4", allergens: [14] },
          { name: "Tagliatella di seppia, pimento e scalogno", price: "€ 16", allergens: [14] },
          { name: "Spigola laccata alla soia di mele e zenzero, zucchine e basilico", price: "€ 14", allergens: [4, 6] },
          { name: "Baccalà in olio cottura alla pizzaiola", price: "€ 15", allergens: [4, 7] },
          { name: "Insalata di mare e giardiniera di verdure", price: "€ 15", allergens: [2, 9, 12, 14] },
          { name: "Guazzetto di cozze e crostini", price: "€ 12", allergens: [1, 12, 14] },
          { name: "Salmone marinato, lampone e cipolla rossa in agrodolce", price: "€ 13", allergens: [4, 12] },
        ],
      },
      {
        title: "I primi",
        dishes: [
          { name: "Tonnarello alle vongole e pane aromatico al prezzemolo", price: "€ 16", allergens: [1, 3, 12, 14] },
          { name: "Riso vialone nano, scampi ed erbette", price: "€ 18", allergens: [2, 7, 8] },
          { name: "Gnocchi di patate, seppia e panocchia", price: "€ 16", allergens: [1, 2, 3, 4, 9, 12] },
        ],
      },
      {
        title: "Secondi e griglia",
        dishes: [
          { name: "Frittura di calamari e gamberi", price: "€ 16", allergens: [1, 2, 14] },
          { name: "Polpo alla griglia", price: "€ 18", allergens: [14] },
          { name: "Ombrina alla griglia", price: "€ 18", allergens: [4] },
          { name: "Tonno alla griglia", price: "€ 20", allergens: [4] },
          { name: "Pescatrice alla griglia", price: "€ 20", allergens: [4] },
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
        title: "La pizza, a cena",
        dishes: [
          {
            name: "Margherita",
            note: "Polpa di San Marzano, mozzarella fior di latte, basilico e olio EVO.",
            price: "€ 9",
            allergens: [1, 7],
          },
          {
            name: "Bufala",
            note: "Polpa di San Marzano, mozzarella fior di latte, bufala campana, basilico e olio EVO.",
            price: "€ 11",
            allergens: [1, 7],
          },
          {
            name: "Diversamente diavola",
            note: "Polpa di San Marzano, mozzarella fior di latte, ventricina Vastese, ventricina spalmabile Teramana, filamenti di peperoncino piccante, basilico e olio EVO.",
            price: "€ 14",
            allergens: [1, 7],
          },
          {
            name: "Marinara",
            note: "Pomodoro, olio all'aglio, origano, basilico e pomodori confit.",
            price: "€ 8",
            allergens: [1],
          },
          {
            name: "Capricciosa",
            note: "Polpa di San Marzano, mozzarella fior di latte, prosciutto cotto alta qualità, carciofi, funghi champignon freschi e olive nere.",
            price: "€ 14",
            allergens: [1, 7],
          },
          {
            name: "Nell'orto",
            note: "Crema di zucchine, melanzane grigliate, zucchine grigliate, basilico e olio EVO.",
            price: "€ 13",
            allergens: [1, 7],
          },
          {
            name: "Patate e salsiccia",
            note: "Mozzarella fior di latte, salsiccia, patate di Avezzano al forno con la buccia, rosmarino e olio EVO.",
            price: "€ 14",
            allergens: [1, 7],
          },
          {
            name: "5 formaggi",
            note: "Mozzarella fior di latte, gorgonzola piccante, provola di Agerola, crumble di parmigiano, crema di parmigiano e olio EVO.",
            price: "€ 14",
            allergens: [1, 7],
          },
          {
            name: "Saluti da Parma",
            note: "Base focaccia, prosciutto crudo di Parma, pomodoro Pachino IGP, rucola, parmigiano e olio EVO.",
            price: "€ 15",
            allergens: [1, 7],
          },
          {
            name: "Caprese",
            note: "Base focaccia, mozzarella fior di latte, pomodoro cuore di bue, basilico, olio EVO e origano.",
            price: "€ 13",
            allergens: [1, 7],
          },
          {
            name: "Ombre nere",
            note: "Base focaccia, carpaccio di Angus, pesto di pistacchio, stracciata e pepe rosa.",
            price: "€ 16",
            allergens: [1, 7, 8],
          },
          {
            name: "Highlands",
            note: "Base focaccia, salmone affumicato, crema di formaggio infusa al gin, valeriana, pomodorini confit e olio EVO.",
            price: "€ 15",
            allergens: [1, 4, 7],
          },
          {
            name: "Nerano",
            note: "Crema di zucchine, chips di zucchine, crema di parmigiano, mozzarella fior di latte, provola di Agerola e olio alla menta.",
            price: "€ 13",
            allergens: [1, 7],
          },
          {
            name: "Americana (per bambini)",
            note: "Mozzarella fior di latte, wurstel di puro suino e patatine fritte.",
            price: "€ 8",
            allergens: [1, 7],
          },
        ],
      },
      {
        title: "I dessert",
        dishes: [
          { name: "Stecco cocco e cioccolato", price: "€ 6", allergens: [7] },
          { name: "Tiramisù marmorizzato", price: "€ 6", allergens: [1, 3, 7] },
        ],
      },
      {
        title: "Bevande, birre e cantina",
        note: "Acque, bibite e birre accompagnano una selezione di etichette regionali, italiane e internazionali.",
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
      label: "Prenota MUULab",
      href: bookingVenues.muulab.internalBookingPath,
    },
    documentAction: {
      label: "Menu MUULab completo",
      href: "https://www.muulab.it/wp-content/uploads/easy-pdf-restaurant-menu/menu-files/muulab.-menu-general.pdf",
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
          { name: "Mini bun foie gras al tartufo", price: "€ 15", allergens: [1, 3, 7] },
          { name: "Angus affumicato e giardiniera di zucchine", price: "€ 18", allergens: [12] },
          { name: "Salame di maialino nero brado e castelmagno", price: "€ 12", allergens: [7] },
        ],
      },
      {
        title: "Crudi di carne",
        dishes: [
          { name: "Battuta di Black Angus al naturale con sale Maldon", price: "€ 15" },
          { name: "Tartare di manzo, mirtillo, ostrica grattugiata, nocciole e pino mugo", price: "€ 18", allergens: [4, 8] },
          { name: "Battuta di manzo, cipolla di Tropea, coriandolo, friggitelli e lime", price: "€ 16", allergens: [12] },
          { name: "Tartare di manzo, anguria e tahina", price: "€ 15", allergens: [11] },
          { name: "Carpaccio di picanha cbt, pomodoro arrostito, arancia e ricotta salata", price: "€ 17", allergens: [9, 12] },
          { name: "Controfiletto, pesca grigliata, pinoli e basilico", price: "€ 19", allergens: [8] },
          { name: "Carpaccio di controfiletto, beurre blanc e soia", price: "€ 19", allergens: [1, 6, 7, 12] },
          { name: "Carpaccio di Wagyu A5 BMS 12 marinato agli agrumi", price: "€ 25" },
          { name: "Magatello al punto rosa, spuma di capperi e limone, caffè e tonno", price: "€ 18", allergens: [4] },
          { name: "Tataki di manzo, cacao e caffè, salsa ponzu e tartufo", price: "€ 20", allergens: [1, 3, 6, 12] },
          { name: "Melanzana infornata, colatura di alici, pomodoro a pera e bufala", price: "€ 15", allergens: [4, 7] },
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
          { name: "Caponata di melanzane", price: "€ 8", allergens: [12] },
        ],
      },
      {
        title: "Dolci",
        dishes: [
          { name: "Crostata di visciole, yogurt, dulce de leche e mais", price: "€ 9", allergens: [1, 3, 7] },
          { name: "Il limone", price: "€ 8", allergens: [7] },
          { name: "Il cocco", price: "€ 8", allergens: [7] },
          { name: "Tiramicoux", price: "€ 8", allergens: [1, 3, 7] },
        ],
      },
      {
        title: "Cocktail e aperitivo",
        anchor: "cocktail",
        dishes: cocktailMenuItems,
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
    action: { label: "Info eventi su WhatsApp", href: whatsappContacts.events },
  },
  {
    title: "Giovedì Posh",
    timing: "Giovedì",
    description:
      "La serata del giovedì negli spazi esterni di Hawaii, con dj set e tavoli sotto le stelle. In caso di pioggia, Posh si sposta in veranda.",
    notes: ["dj set", "tavoli sotto le stelle", "veranda in caso di pioggia"],
    action: { label: "Info eventi su WhatsApp", href: whatsappContacts.events },
  },
  {
    title: "Special Date",
    timing: "Date selezionate",
    description:
      "Serate speciali e tappe d'estate — come l'Aperol tour — con dj set, ospiti e tavoli evento annunciati sui canali social.",
    notes: ["dj set", "special guest", "tavoli evento"],
    action: { label: "Info eventi su WhatsApp", href: whatsappContacts.events },
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

/* Keep this content aligned with the live site's actual data flows, not legacy WordPress plugins. */
export const legalSections: Record<"privacy" | "cookie", LegalSection[]> = {
  privacy: [
    {
      title: "Titolare del trattamento",
      body: "Il titolare del trattamento è Kona S.R.L., Viale della Riviera 154, 65123 Pescara (PE), P. IVA IT02271430684. Per richieste relative ai dati personali: info@hawaiipescara.it.",
    },
    {
      title: "Dati trattati durante la navigazione",
      body: "Il funzionamento del sito comporta il trattamento di dati tecnici e di navigazione, come indirizzo IP, risorse richieste, data e ora della richiesta, dati del dispositivo e registri di sicurezza. Il sito non utilizza strumenti propri di profilazione, marketing o analytics.",
      bullets: [
        "finalità: funzionamento del sito, sicurezza e gestione tecnica",
        "base giuridica: interesse legittimo del titolare alla sicurezza e al corretto funzionamento del sito",
        "conservazione: i log tecnici sono conservati, di regola, per un periodo non superiore a 1 mese, salvo esigenze di accertamento di illeciti o obblighi di legge",
      ],
    },
    {
      title: "Contatti e richieste",
      body: "Il sito non raccoglie dati tramite moduli proprietari. Email, telefono e WhatsApp sono canali scelti dall'utente per richiedere informazioni, disponibilità o servizi. I dati comunicati a Kona S.R.L. sono trattati per gestire la richiesta e l'eventuale rapporto successivo.",
      bullets: [
        "base giuridica: esecuzione di misure precontrattuali richieste dall'interessato e, quando necessario, interesse legittimo alla gestione del rapporto",
        "conservazione: fino a 12 mesi dalla definizione della richiesta, salvo obblighi di legge o necessità di tutela dei diritti del titolare",
      ],
    },
    {
      title: "Piattaforme e servizi esterni",
      body: "Il calendario TheFork viene caricato soltanto dopo la scelta generale dell'utente di accettare i servizi esterni. Prima che l'utente inserisca dati di prenotazione, il browser stabilisce una connessione di rete con widget.thefork.com. WhatsApp, Spiagge.it, Wansport e le mappe si aprono esclusivamente quando l'utente seleziona il relativo collegamento. Ogni servizio esterno opera secondo la propria informativa e può trattare dati secondo modalità autonome.",
      references: [
        { label: "Informativa TheFork", href: "https://www.thefork.it/legal" },
        { label: "Informativa WhatsApp", href: "https://www.whatsapp.com/legal/privacy-policy-eea" },
        { label: "Informativa Spiagge.it", href: "https://www.spiagge.it/privacy-policy/?lang=it" },
        { label: "Informativa Wansport", href: "https://wansport.com/privacy-policy/" },
      ],
    },
    {
      title: "Trasferimenti di dati",
      body: "Alcuni servizi esterni possono trattare dati anche al di fuori dello Spazio Economico Europeo. Le informazioni sulle eventuali garanzie adottate e sui trasferimenti sono riportate nelle informative dei rispettivi fornitori, disponibili dai collegamenti indicati sopra.",
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
      body: "L'interessato può chiedere accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del consenso scrivendo a info@hawaiipescara.it. Resta salvo il diritto di proporre reclamo al Garante per la protezione dei dati personali.",
      references: [
        { label: "Garante per la protezione dei dati personali", href: "https://www.garanteprivacy.it/web/guest/home/autorita" },
      ],
    },
    {
      title: "Aggiornamenti",
      body: "Questa informativa è aggiornata al 30 luglio 2026. Il titolare può modificarla per riflettere cambiamenti normativi, organizzativi o tecnici; la versione pubblicata su questa pagina è quella applicabile al momento della consultazione.",
    },
  ],
  cookie: [
    {
      title: "Preferenze locali e servizi esterni",
      body: "Il sito memorizza nel browser una preferenza tecnica locale per ricordare la scelta sul consenso ai servizi esterni. Non usa cookie proprietari di profilazione, marketing o analytics.",
    },
    {
      title: "Servizi soggetti a consenso",
      body: "Il calendario di prenotazione TheFork resta bloccato finché l'utente non effettua la scelta generale di accettare i servizi esterni. Dopo il consenso generale, prima che l'utente inserisca dati di prenotazione, il browser stabilisce una connessione di rete con widget.thefork.com, che può usare proprie tecnologie e trattare dati secondo la propria informativa.",
      bullets: [
        "preferenza locale di consenso: necessaria per ricordare la scelta dell'utente",
        "TheFork: servizio esterno caricato soltanto dopo il consenso",
      ],
      references: [{ label: "Informativa privacy e cookie TheFork", href: "https://www.thefork.it/legal" }],
    },
    {
      title: "Collegamenti aperti dall'utente",
      body: "WhatsApp, Spiagge.it, Wansport e le mappe non sono incorporati né caricati automaticamente nel sito. Si aprono soltanto su scelta dell'utente e sono regolati dalle informative dei rispettivi servizi.",
      references: [
        { label: "Informativa WhatsApp", href: "https://www.whatsapp.com/legal/privacy-policy-eea" },
        { label: "Informativa Spiagge.it", href: "https://www.spiagge.it/privacy-policy/?lang=it" },
        { label: "Informativa Wansport", href: "https://wansport.com/privacy-policy/" },
      ],
    },
    {
      title: "Gestione del consenso",
      body: "Al primo accesso il banner permette di accettare o rifiutare i servizi esterni. La scelta può essere modificata in qualsiasi momento dal pulsante in questa pagina oppure cancellando le preferenze del sito dal browser. Il rifiuto non limita la consultazione dei contenuti del sito.",
    },
    {
      title: "Titolare e contatti",
      body: "Titolare del trattamento: Kona S.R.L., Viale della Riviera 154, 65123 Pescara (PE), P. IVA IT02271430684 · info@hawaiipescara.it. Per il quadro completo si rimanda all'informativa privacy. Aggiornamento: 30 luglio 2026.",
    },
  ],
};
