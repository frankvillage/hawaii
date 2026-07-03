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
};

export type JourneyScene = {
  id: string;
  anchor: string;
  daypart: string;
  soul: "Beach" | "Restaurant" | "Sport" | "Nightlife" | "Transition";
  eyebrow: string;
  title: string;
  summary: string;
  start: number;
  end: number;
  hotspots: JourneyHotspot[];
};

export type Chapter = {
  slug: string;
  daypart: string;
  soul: "Beach" | "Restaurant" | "Sport" | "Nightlife" | "Transition";
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

export type MenuSectionContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  action?: Action;
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
  navLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  intro: string;
  primaryAction: Action;
  secondaryAction?: Action;
  gradient: string;
  media?: MediaAsset;
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
  restaurantPhone: "085 9396664",
  beachPhone: "375 5175508",
  email: "info@hawaiipescara.it",
  mapUrl: "https://g.page/r/CV_HAWAII_PESCARA",
  instagramUrl: "https://www.instagram.com/hawaii_pescara/",
  facebookUrl: "https://www.facebook.com/hawaiipescara",
};

export const navigation = [
  { label: "Beach", href: "/beach" },
  { label: "Ristorante Mare", href: "/ristorante-mare" },
  { label: "Terrazza", href: "/terrazza" },
  { label: "Sport", href: "/sport" },
  { label: "Eventi", href: "/eventi" },
];

export const soulNavigation = [
  { label: "Beach", href: "#beach" },
  { label: "Restaurant", href: "#restaurant" },
  { label: "Sport", href: "#sport" },
  { label: "Nightlife", href: "#nightlife" },
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
  scenes: [
    {
      id: "arrivo",
      anchor: "journey",
      daypart: "Prima luce",
      soul: "Transition",
      eyebrow: "Fronte mare",
      title: "Il villaggio si apre sul mare.",
      summary: "Palme, insegna e fronte mare: Hawaii comincia dal lungomare di Pescara.",
      start: 0,
      end: 0.125,
      hotspots: [
        { label: "Beach", href: "/beach", x: 72, y: 30 },
        { label: "Ristorante", href: "/ristorante-mare", x: 34, y: 54 },
        { label: "Sport", href: "/sport", x: 62, y: 72 },
      ],
    },
    {
      id: "restaurant",
      anchor: "restaurant",
      daypart: "Mattina",
      soul: "Restaurant",
      eyebrow: "Bar & sala",
      title: "La mattina comincia al bancone.",
      summary: "Caffè, bancone e sala che prende ritmo verso il mezzogiorno.",
      start: 0.125,
      end: 0.2,
      hotspots: [
        { label: "Prenota tavolo", href: "/prenotazioni", x: 30, y: 62 },
        { label: "Scopri menu", href: "/menu", x: 74, y: 40 },
        { label: "Cocktail bar", href: "/ristorante-mare", x: 55, y: 26 },
      ],
    },
    {
      id: "sport",
      anchor: "sport",
      daypart: "Tarda mattina",
      soul: "Sport",
      eyebrow: "Sport",
      title: "Il padel entra nel paesaggio.",
      summary: "Campi da gioco e outdoor training a pochi passi dalla sabbia.",
      start: 0.2,
      end: 0.26,
      hotspots: [
        { label: "Campi da padel", href: "/sport", x: 50, y: 42 },
        { label: "Outdoor gym", href: "/sport", x: 24, y: 66 },
        { label: "Prenota attività", href: "/prenotazioni", x: 76, y: 64 },
      ],
    },
    {
      id: "beach",
      anchor: "beach",
      daypart: "Pieno giorno",
      soul: "Beach",
      eyebrow: "Beach",
      title: "La giornata si distende tra sabbia e mare.",
      summary: "Ombrelloni, camminamenti chiari e tutta la calma del fronte mare.",
      start: 0.26,
      end: 0.335,
      hotspots: [
        { label: "Prenota spiaggia", href: "/prenotazioni", x: 50, y: 66 },
        { label: "Beach club", href: "/beach", x: 24, y: 42 },
        { label: "Aperitivi", href: "/eventi", x: 79, y: 36 },
      ],
    },
    {
      id: "lunch",
      anchor: "lunch",
      daypart: "Pranzo",
      soul: "Restaurant",
      eyebrow: "Ristorante mare",
      title: "A pranzo il pesce arriva in tavola.",
      summary: "Sala luminosa, servizio e piatti di mare nel pieno della giornata.",
      start: 0.335,
      end: 0.45,
      hotspots: [
        { label: "Menu pesce", href: "/menu", x: 70, y: 46 },
        { label: "Prenota tavolo", href: "/prenotazioni", x: 32, y: 62 },
        { label: "Ristorante", href: "/ristorante-mare", x: 18, y: 32 },
      ],
    },
    {
      id: "cucina",
      anchor: "cucina",
      daypart: "Verso sera",
      soul: "Restaurant",
      eyebrow: "Cucina a vista",
      title: "La cucina lavora a vista.",
      summary: "Piatti espressi, fuoco e mani veloci dietro il bancone.",
      start: 0.45,
      end: 0.55,
      hotspots: [
        { label: "Cucina a vista", href: "/ristorante-mare", x: 50, y: 38 },
        { label: "Scopri menu", href: "/menu", x: 74, y: 60 },
        { label: "Prenota", href: "/prenotazioni", x: 26, y: 64 },
      ],
    },
    {
      id: "sunset",
      anchor: "sunset",
      daypart: "Tramonto",
      soul: "Nightlife",
      eyebrow: "Terrazza",
      title: "Il giorno sale in terrazza e cambia luce.",
      summary: "Daybed, bollicine e tavoli vista mare aprono la parte più sospesa della sera.",
      start: 0.55,
      end: 0.74,
      hotspots: [
        { label: "Terrazza", href: "/terrazza", x: 62, y: 40 },
        { label: "Aperitivo", href: "/eventi", x: 36, y: 62 },
        { label: "Prenota in terrazza", href: "/prenotazioni", x: 76, y: 68 },
      ],
    },
    {
      id: "muulab",
      anchor: "muulab",
      daypart: "Sera",
      soul: "Restaurant",
      eyebrow: "MUULab Riviera",
      title: "La sera prende il profumo della brace.",
      summary: "In terrazza la cena vive tra brace, cucina a vista e panorama.",
      start: 0.74,
      end: 0.9,
      hotspots: [
        { label: "MUULab Riviera", href: "/terrazza", x: 50, y: 34 },
        { label: "Menu della sera", href: "/menu", x: 28, y: 62 },
        { label: "Prenota", href: "/prenotazioni", x: 74, y: 64 },
      ],
    },
    {
      id: "nightlife",
      anchor: "nightlife",
      daypart: "Notte",
      soul: "Nightlife",
      eyebrow: "Eventi",
      title: "Dopo cena il ritmo si accende.",
      summary: "Dj set, tavoli evento e notti che riportano lentamente verso una nuova alba.",
      start: 0.9,
      end: 1,
      hotspots: [
        { label: "Eventi", href: "/eventi", x: 55, y: 44 },
        { label: "Feste private", href: "/feste-private", x: 30, y: 64 },
        { label: "Prenota", href: "/prenotazioni", x: 72, y: 30 },
      ],
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
    primaryAction: { label: "Prenota spiaggia", href: "/prenotazioni" },
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
    secondaryAction: { label: "Prenota un tavolo", href: "/prenotazioni" },
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
    secondaryAction: { label: "Prenota attività", href: "/prenotazioni" },
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
    primaryAction: { label: "Prenota tavolo", href: "/prenotazioni" },
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
    primaryAction: { label: "Prenota in terrazza", href: "/prenotazioni" },
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
    title: "La giornata comincia sulla spiaggia.",
    lead: "Ampiezza, ordine, comfort e una relazione continua con il mare.",
    intro:
      "La spiaggia di Hawaii invita a fermarsi: ombra leggera, mare davanti e tutto il tempo per restare fino al tramonto.",
    primaryAction: { label: "Prenota spiaggia", href: "/prenotazioni" },
    secondaryAction: { label: "Contattaci", href: "/contatti" },
    gradient: "from-[#0e3147] via-[#1d6079] to-[#cde0df]",
    media: {
      src: "/media/hawaii/beach-umbrellas.jpg",
      alt: "Spiaggia Hawaii con ombrelloni, palme e mare",
    },
    sections: [
      {
        title: "La spiaggia",
        body: "Palme, ombrelloni e mare aperto disegnano una giornata rilassata, ordinata e luminosa.",
        bullets: [
          "postazioni fronte mare",
          "ombrelloni e palme",
          "servizi pensati per l'intera giornata",
          "passaggio naturale verso pranzo e aperitivo",
        ],
      },
      {
        title: "Dal mattino al tramonto",
        body: "La spiaggia resta connessa al resto di Hawaii: un caffe al mattino, un pranzo leggero, un aperitivo vista mare.",
      },
    ],
    faqs: [
      {
        question: "Come si prenota la spiaggia?",
        answer: "Dal sito puoi richiedere facilmente ombrellone o palma e ricevere tutte le indicazioni utili.",
      },
      {
        question: "La spiaggia è collegata al ristorante?",
        answer: "Si. Beach club, pranzo, aperitivo e tramonto fanno parte dello stesso percorso.",
      },
    ],
    schemaType: "LocalBusiness",
  },
  "ristorante-mare": {
    slug: "ristorante-mare",
    navLabel: "Ristorante Mare",
    eyebrow: "Ristorante",
    title: "Pesce, à la carte, cocktail bar.",
    lead: "Il piano terra racconta il lato diurno e conviviale di Hawaii.",
    intro:
      "Qui il mare arriva in tavola con piatti di pesce, menu a la carte, cocktail bar e un ritmo piu aperto e conviviale.",
    primaryAction: { label: "Prenota tavolo", href: "/prenotazioni" },
    secondaryAction: { label: "Scopri il menu", href: "/menu" },
    gradient: "from-[#18384e] via-[#405667] to-[#dbc8ad]",
    media: {
      src: "/media/hawaii/dinner-table.jpg",
      alt: "Piatto e tavolo del ristorante mare",
    },
    sections: [
      {
        title: "Pranzo e cena di mare",
        body: "Il piano terra accoglie il lato piu fresco e conviviale di Hawaii, tra piatti di pesce, carta vini e cocktail bar.",
        bullets: [
          "pranzo e cena",
          "menu à la carte di mare",
          "cocktail bar integrato",
          "tavoli interni ed esterni",
        ],
      },
      {
        title: "Il gusto del giorno",
        body: "Servizio curato, luce naturale e un'atmosfera informale accompagnano dal pranzo alla sera.",
      },
    ],
    faqs: [
      {
        question: "Il ristorante mare è diverso dalla terrazza?",
        answer: "Si. Il piano terra racconta il lato di mare di Hawaii; la terrazza vive il tramonto e la cena con un tono piu serale.",
      },
      {
        question: "Il menu è disponibile online?",
        answer: "Si. Le proposte sono organizzate per aree, con accesso rapido alla prenotazione del tavolo.",
      },
    ],
    schemaType: "Restaurant",
  },
  "terrazza": {
    slug: "terrazza",
    navLabel: "Terrazza",
    eyebrow: "MUULab Riviera",
    title: "Vista mare, tramonto, cucina creativa e brace.",
    lead: "La terrazza è la trasformazione serale premium di Hawaii.",
    intro:
      "MUULab Riviera vive la sera con vista mare, cucina creativa, brace e un tono piu raccolto rispetto al piano terra.",
    primaryAction: { label: "Prenota in terrazza", href: "/prenotazioni" },
    secondaryAction: { label: "Scopri gli eventi", href: "/eventi" },
    gradient: "from-[#241b21] via-[#66453a] to-[#f0b16f]",
    media: {
      src: "/media/hawaii/terrace-evening.jpg",
      alt: "Terrazza MUULab Riviera al cambio di luce",
    },
    sections: [
      {
        title: "Il tramonto in terrazza",
        body: "Vista mare, cocktail e luce calda introducono la parte piu panoramica della giornata.",
        bullets: [
          "location esclusiva vista mare",
          "cucina creativa",
          "carni alla brace",
          "cucina a vista",
        ],
      },
      {
        title: "Dalla golden hour alla cena",
        body: "Aperitivo, dinner e dopocena condividono lo stesso panorama con un tono piu raccolto ed esclusivo.",
      },
    ],
    faqs: [
      {
        question: "MUULab Riviera è prenotabile separatamente?",
        answer: "Si. La terrazza ha un percorso dedicato, separato dal ristorante di mare al piano terra.",
      },
      {
        question: "La terrazza è pensata per aperitivo o cena?",
        answer: "Per entrambi. Si inizia con il tramonto e si prosegue con la cena tra brace e cucina a vista.",
      },
    ],
    schemaType: "Restaurant",
  },
  "sport": {
    slug: "sport",
    navLabel: "Sport",
    eyebrow: "Sport",
    title: "Padel e crossfit outdoor sul mare.",
    lead: "Allenarsi sul mare fa parte del ritmo di Hawaii.",
    intro:
      "Padel, campi da gioco e outdoor training completano la giornata con energia e vista mare.",
    primaryAction: { label: "Scopri sport", href: "/sport" },
    secondaryAction: { label: "Prenota attività", href: "/prenotazioni" },
    gradient: "from-[#152c2f] via-[#355247] to-[#bfc57d]",
    media: {
      src: "/media/hawaii/padel-court.jpg",
      alt: "Partita di padel sul campo di Hawaii",
    },
    sections: [
      {
        title: "Padel",
        body: "Due campi regolamentari GIMPADEL e un ritmo attivo che affianca la vita in spiaggia.",
        bullets: [
          "due campi GIMPADEL regolamentari",
          "lezioni e attività",
          "prenotazione via app o canale dedicato",
        ],
      },
      {
        title: "Outdoor training",
        body: "Crossfit e allenamento all'aperto portano energia, mare e benessere nello stesso luogo.",
      },
    ],
    faqs: [
      {
        question: "Lo sport è prenotabile dal sito?",
        answer: "Si. Il sito accompagna verso il canale corretto per prenotare campi e attivita.",
      },
      {
        question: "Sport e spiaggia convivono nella stessa giornata?",
        answer: "Si. E uno dei tratti che rende Hawaii un vero Urban Village.",
      },
    ],
    schemaType: "SportsActivityLocation",
  },
  "eventi": {
    slug: "eventi",
    navLabel: "Eventi",
    eyebrow: "Eventi & Nightlife",
    title: "Dj set, sunset, tavoli evento, after dinner.",
    lead: "Quando scende la sera, Hawaii cambia ritmo.",
    intro:
      "Sunset, dj set, tavoli evento e date speciali prolungano la giornata fino a notte.",
    primaryAction: { label: "Scopri gli eventi", href: "/eventi" },
    secondaryAction: { label: "Feste private", href: "/feste-private" },
    gradient: "from-[#12161f] via-[#283140] to-[#7b5149]",
    media: {
      src: "/media/hawaii/night-event.jpg",
      alt: "Evento serale di Hawaii visto dall'alto",
    },
    sections: [
      {
        title: "Sunset e dopocena",
        body: "Aperitivi, tavoli e musica accompagnano la giornata verso la notte.",
      },
      {
        title: "Date speciali",
        body: "Dj set, ospiti e serate dedicate danno un ritmo diverso ai weekend sul mare.",
      },
    ],
    faqs: [
      {
        question: "Gli eventi sono prenotabili?",
        answer: "Si. Quando previsto, il sito accompagna direttamente verso tavolo, RSVP o richiesta informazioni.",
      },
      {
        question: "Eventi e terrazza sono collegati?",
        answer: "Si. Sunset, terrazza, nightlife e feste private fanno parte dello stesso racconto serale.",
      },
    ],
    schemaType: "EventVenue",
  },
  "feste-private": {
    slug: "feste-private",
    navLabel: "Feste Private",
    eyebrow: "Private events",
    title: "Occasioni private sul mare.",
    lead: "Una cornice elegante per ricorrenze, cene riservate ed eventi dedicati.",
    intro:
      "Compleanni, cene private, ricorrenze ed eventi aziendali trovano qui spazi e atmosfera da personalizzare.",
    primaryAction: { label: "Richiedi un evento", href: "/feste-private#form" },
    secondaryAction: { label: "Contatti", href: "/contatti" },
    gradient: "from-[#1d2029] via-[#463b40] to-[#c79f72]",
    media: {
      src: "/media/hawaii/terrace-daybed.jpg",
      alt: "Setup serale della terrazza per eventi privati",
    },
    sections: [
      {
        title: "Occasioni private",
        body: "Compleanni, ricorrenze, cene riservate ed eventi aziendali trovano una cornice sul mare da modellare su misura.",
        bullets: [
          "cene private",
          "feste di compleanno",
          "eventi corporate",
          "format brandizzati",
        ],
      },
      {
        title: "Su misura",
        body: "Spazi, menu e atmosfera possono essere calibrati in base all'occasione e al numero di ospiti.",
      },
    ],
    faqs: [
      {
        question: "È possibile personalizzare format e menu?",
        answer: "Si. Ogni richiesta puo essere costruita su misura tra menu, spazi, allestimento e timing.",
      },
    ],
    schemaType: "LocalBusiness",
  },
};

export const bookingOptions = [
  {
    title: "Prenota spiaggia",
    description: "Palma, ombrellone e una giornata piena di mare.",
    href: "/beach",
  },
  {
    title: "Prenota tavolo mare",
    description: "Pranzo o cena di pesce al piano terra.",
    href: "/ristorante-mare",
  },
  {
    title: "Prenota terrazza",
    description: "MUULab Riviera, sunset e dinner con vista mare.",
    href: "/terrazza",
  },
  {
    title: "Prenota sport",
    description: "Padel, outdoor gym e attivita sul mare.",
    href: "/sport",
  },
  {
    title: "Richiedi un evento",
    description: "Feste private, cene speciali e format dedicati.",
    href: "/feste-private",
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

export const menuSections: MenuSectionContent[] = [
  {
    eyebrow: "Ristorante Mare",
    title: "Pranzo di mare e cena al piano terra",
    description:
      "Crudi, antipasti, primi, secondi e dessert accompagnano il lato piu luminoso e conviviale della giornata.",
    items: [
      "Crudi, antipasti e signature di mare",
      "Primi piatti e specialita del giorno",
      "Secondi di pesce e griglia",
      "Dessert e fine pasto",
    ],
    action: { label: "Prenota tavolo mare", href: "/prenotazioni" },
  },
  {
    eyebrow: "Terrazza MUULab Riviera",
    title: "La braceria della terrazza",
    description:
      "MUULab Riviera è la braceria serale di Hawaii: carni alla brace, cucina a vista e piatti pensati per una cena vista mare.",
    items: [
      "Carni alla brace",
      "Cucina a vista",
      "Piatti signature della terrazza",
      "Dessert e pairing serali",
    ],
    action: { label: "Prenota terrazza", href: "/prenotazioni" },
  },
  {
    eyebrow: "Aperitivo in Terrazza",
    title: "Il tramonto si prenota",
    description:
      "Daybed, bollicine e sunset bites: l'aperitivo vista mare apre la sera della terrazza.",
    items: [
      "Bollicine e sunset bites",
      "Gin tonic e signature del tramonto",
      "Daybed e tavoli vista mare",
      "Passaggio naturale verso la cena",
    ],
    action: { label: "Prenota il tramonto", href: "/prenotazioni" },
  },
  {
    eyebrow: "Cocktail Bar",
    title: "Dal morning bar all'aperitivo",
    description:
      "Caffetteria, aperitivo e signature cocktail seguono il ritmo di Hawaii dal giorno alla sera.",
    items: [
      "Colazione e caffetteria",
      "Signature cocktail",
      "Classici e twist",
      "Analcolici e low ABV",
    ],
    action: { label: "Scopri il bar", href: "/ristorante-mare" },
  },
  {
    eyebrow: "Carta Vini",
    title: "Vini e abbinamenti",
    description:
      "Uno spazio ordinato per etichette al calice, bottiglie e suggerimenti di pairing tra mare e brace.",
    items: [
      "Bollicine e aperitivo",
      "Bianchi per il menu mare",
      "Rossi per la terrazza",
      "Selezioni speciali e pairing",
    ],
  },
];

export const eventFormats: EventFormat[] = [
  {
    title: "Sunset Terrace",
    timing: "Tramonto",
    description:
      "Aperitivo vista mare, luce calda, cocktail e tavoli che accompagnano il passaggio verso la sera.",
    notes: ["vista mare", "cocktail", "golden hour"],
    action: { label: "Prenota il tramonto", href: "/prenotazioni" },
  },
  {
    title: "Dinner & After Dinner",
    timing: "Sera",
    description:
      "Cena in terrazza, brace e una transizione naturale verso il dopocena con musica e tavoli.",
    notes: ["brace", "cena", "tavoli serali"],
    action: { label: "Scopri la terrazza", href: "/terrazza" },
  },
  {
    title: "Dj Set & Special Date",
    timing: "Notte",
    description:
      "Format serali, special guest, tavoli evento e serate che tengono acceso il luogo fino a tardi.",
    notes: ["dj set", "special date", "nightlife"],
    action: { label: "Richiedi info eventi", href: "/contatti" },
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

export const legalSections: Record<"privacy" | "cookie", LegalSection[]> = {
  privacy: [
    {
      title: "Titolare del trattamento",
      body: "Nella versione definitiva saranno riportati ragione sociale completa, sede, contatti del titolare e riferimenti aggiornati.",
    },
    {
      title: "Finalita del trattamento",
      body: "Questa informativa descrive finalita legate a contatto, prenotazioni, richieste evento e gestione tecnica del sito.",
      bullets: [
        "gestione delle richieste inviate dai form",
        "organizzazione di prenotazioni e contatti commerciali",
        "sicurezza e manutenzione tecnica del sito",
      ],
    },
    {
      title: "Base giuridica e tempi di conservazione",
      body: "Nella versione definitiva saranno specificate basi giuridiche, tempi di conservazione e criteri applicati dal titolare.",
    },
    {
      title: "Diritti dell'interessato",
      body: "Saranno indicati i riferimenti per accesso, rettifica, cancellazione, limitazione, opposizione e reclamo.",
    },
  ],
  cookie: [
    {
      title: "Categorie di cookie",
      body: "Questa pagina distingue cookie tecnici, analytics e strumenti di terze parti effettivamente attivi sul sito.",
      bullets: [
        "cookie tecnici necessari",
        "analytics configurati nel rispetto del consenso",
        "eventuali integrazioni di terze parti da validare",
      ],
    },
    {
      title: "Gestione del consenso",
      body: "Questa sezione spiega come l'utente puo accettare, rifiutare o modificare le preferenze in qualsiasi momento.",
    },
    {
      title: "Elenco strumenti",
      body: "Nella versione definitiva saranno elencati strumenti analytics, pixel o servizi esterni realmente attivi in produzione.",
    },
  ],
};
