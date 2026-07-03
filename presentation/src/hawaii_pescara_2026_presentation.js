"use strict";

const pptxgen = require("pptxgenjs");
const {
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("./pptxgenjs_helpers/layout");
const { safeOuterShadow } = require("./pptxgenjs_helpers/util");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "OpenAI";
pptx.subject = "Hawaii Pescara 2026 - proposta sito e landing interattiva";
pptx.title = "Hawaii Pescara 2026 - Presentazione Progetto";
pptx.lang = "it-IT";
pptx.theme = {
  headFontFace: "Georgia",
  bodyFontFace: "Arial",
  lang: "it-IT",
};

const COLORS = {
  navy: "0E2233",
  deep: "17364A",
  sand: "E9D9C7",
  coral: "D48661",
  gold: "C8A46B",
  white: "F8F6F2",
  ink: "13202A",
  mist: "DDE6EA",
  sea: "6C8B9B",
  foam: "EEF3F4",
  success: "3C6650",
};

const SLIDE = { w: 13.333, h: 7.5 };
const M = 0.45;

function addBackground(slide, accent = COLORS.deep) {
  slide.background = { color: COLORS.white };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE.w,
    h: SLIDE.h,
    line: { color: COLORS.white, transparency: 100 },
    fill: { color: COLORS.white },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.18,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 6.94,
    w: 13.333,
    h: 0.56,
    line: { color: COLORS.navy, transparency: 100 },
    fill: { color: COLORS.navy },
  });
}

function addFooter(slide, pageNumber, label = "Hawaii Pescara 2026") {
  slide.addText(label, {
    x: 0.45,
    y: 7.09,
    w: 3.8,
    h: 0.16,
    fontFace: "Arial",
    fontSize: 9,
    color: COLORS.white,
    margin: 0,
  });
  slide.addText(String(pageNumber), {
    x: 12.35,
    y: 7.06,
    w: 0.3,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 9,
    color: COLORS.white,
    align: "right",
    margin: 0,
  });
}

function addTitle(slide, eyebrow, title, subtitle) {
  slide.addText(eyebrow, {
    x: M,
    y: 0.38,
    w: 3.8,
    h: 0.22,
    fontFace: "Arial",
    fontSize: 12,
    bold: true,
    color: COLORS.coral,
    characterSpacing: 1,
    margin: 0,
  });
  slide.addText(title, {
    x: M,
    y: 0.7,
    w: 8.9,
    h: 0.72,
    fontFace: "Georgia",
    fontSize: 26,
    bold: false,
    color: COLORS.ink,
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: M,
      y: 1.45,
      w: 7.9,
      h: 0.48,
      fontFace: "Arial",
      fontSize: 12,
      color: COLORS.deep,
      margin: 0,
      valign: "mid",
    });
  }
}

function addBadge(slide, text, x, y, w = 2.2, fill = COLORS.foam, color = COLORS.deep) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.34,
    rectRadius: 0.08,
    line: { color: fill, transparency: 100 },
    fill: { color: fill },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.045,
    w: w - 0.16,
    h: 0.22,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color,
    align: "center",
    margin: 0,
  });
}

function addCard(slide, opts) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    rectRadius: 0.08,
    line: { color: opts.stroke || COLORS.mist, pt: 1 },
    fill: { color: opts.fill || "FFFFFF" },
    shadow: safeOuterShadow("000000", 0.14, 45, 1, 1.5),
  });
  if (opts.kicker) {
    slide.addText(opts.kicker, {
      x: opts.x + 0.16,
      y: opts.y + 0.14,
      w: opts.w - 0.32,
      h: 0.2,
      fontFace: "Arial",
      fontSize: 10,
      bold: true,
      color: opts.kickerColor || COLORS.coral,
      margin: 0,
    });
  }
  if (opts.title) {
    slide.addText(opts.title, {
      x: opts.x + 0.16,
      y: opts.y + 0.34,
      w: opts.w - 0.32,
      h: 0.4,
      fontFace: "Georgia",
      fontSize: 16,
      color: COLORS.ink,
      bold: false,
      margin: 0,
    });
  }
  if (opts.body) {
    slide.addText(opts.body, {
      x: opts.x + 0.16,
      y: opts.y + (opts.title ? 0.82 : 0.24),
      w: opts.w - 0.32,
      h: opts.h - (opts.title ? 1.0 : 0.38),
      fontFace: "Arial",
      fontSize: 11,
      color: COLORS.deep,
      breakLine: false,
      margin: 0,
      valign: "top",
      fit: "shrink",
    });
  }
}

function addBulletList(slide, items, x, y, w, h, color = COLORS.deep, fontSize = 12) {
  const runs = [];
  items.forEach((item, index) => {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 12 },
        hanging: 2,
        breakLine: index !== items.length - 1,
      },
    });
  });
  slide.addText(runs, {
    x,
    y,
    w,
    h,
    fontFace: "Arial",
    fontSize,
    color,
    margin: 0.02,
    valign: "top",
    fit: "shrink",
  });
}

function addPhaseArrow(slide, x, y, w, h, title, body, color) {
  slide.addShape(pptx.ShapeType.chevron, {
    x,
    y,
    w,
    h,
    line: { color, pt: 1 },
    fill: { color },
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.5,
    h: 0.3,
    fontFace: "Georgia",
    fontSize: 15,
    bold: false,
    color: COLORS.white,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.56,
    w: w - 0.62,
    h: h - 0.72,
    fontFace: "Arial",
    fontSize: 10,
    color: COLORS.white,
    margin: 0,
    fit: "shrink",
  });
}

function finalizeSlide(slide, index) {
  addFooter(slide, index);
  warnIfSlideHasOverlaps(slide, pptx, { muteContainment: true, ignoreDecorativeShapes: true });
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

function sceneCard(slide, x, y, w, h, id, title, emotion, info, hotspot) {
  addCard(slide, {
    x,
    y,
    w,
    h,
    fill: "FFFFFF",
    kicker: id,
    title,
    body: `Emozione: ${emotion}\nInfo: ${info}\nHotspot: ${hotspot}`,
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.coral);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.18,
    w: 13.333,
    h: 6.76,
    line: { color: COLORS.navy, transparency: 100 },
    fill: { color: COLORS.navy },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.8,
    y: 0.18,
    w: 5.533,
    h: 6.76,
    line: { color: COLORS.deep, transparency: 100 },
    fill: { color: COLORS.deep, transparency: 8 },
  });
  slide.addText("HAWAII PESCARA 2026", {
    x: 0.58,
    y: 0.72,
    w: 4.5,
    h: 0.3,
    fontFace: "Arial",
    fontSize: 14,
    bold: true,
    color: COLORS.sand,
    characterSpacing: 1.2,
    margin: 0,
  });
  slide.addText("Sito refresh + landing interattiva\ncome concierge esperienziale", {
    x: 0.58,
    y: 1.25,
    w: 6.6,
    h: 1.35,
    fontFace: "Georgia",
    fontSize: 26,
    color: COLORS.white,
    bold: false,
    margin: 0,
  });
  slide.addText(
    "Concept website 2026\nModello ibrido concierge, tono premium/luxury + aperitivo/nightlife",
    {
      x: 0.58,
      y: 2.85,
      w: 5.9,
      h: 0.7,
      fontFace: "Arial",
      fontSize: 13,
      color: COLORS.mist,
      margin: 0,
    }
  );
  addBadge(slide, "Concept evolutivo", 0.58, 4.15, 2.2, COLORS.gold, COLORS.navy);
  slide.addText("Visione:", {
    x: 8.18,
    y: 1.15,
    w: 1.4,
    h: 0.22,
    fontFace: "Arial",
    fontSize: 11,
    bold: true,
    color: COLORS.sand,
    margin: 0,
  });
  slide.addText(
    "Un sito semplice da usare come concierge,\nma memorabile come una micro-experience.\n\nNon un portale dispersivo.\nNon un esercizio di design pesante.\n\nUn percorso che fa entrare, esplorare,\nemozionare e prenotare.",
    {
      x: 8.18,
      y: 1.45,
      w: 4.2,
      h: 3.0,
      fontFace: "Arial",
      fontSize: 14,
      color: COLORS.white,
      margin: 0,
      fit: "shrink",
    }
  );
  finalizeSlide(slide, 1);
}

// Slide 2
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "CONTESTO E DIREZIONE",
    "Obiettivo del progetto",
    "Aggiornare hawaiipescara.it senza perdere chiarezza, ma aggiungendo una homepage capace di raccontare l'experience Hawaii in modo interattivo."
  );
  addCard(slide, {
    x: 0.45,
    y: 2.0,
    w: 4.05,
    h: 3.95,
    fill: COLORS.foam,
    kicker: "PERCHÉ AGGIORNARE",
    title: "Refresh del sito classico",
    body:
      "Nuove foto, nuove informazioni su ristorante e servizi, aggiornamento offerta 2026, navigazione più ordinata, CTA più leggibili, contenuti più coerenti con il posizionamento.",
  });
  addCard(slide, {
    x: 4.64,
    y: 2.0,
    w: 4.05,
    h: 3.95,
    fill: "FFFFFF",
    kicker: "CUORE DEL PROGETTO",
    title: "Landing interattiva",
    body:
      "Homepage come navigatore esperienziale: scene, hotspot, avanti/indietro, contenuti rapidi da consultare, micro-clip leggere, passaggi fluidi tra bar, ristorante, spiaggia e terrazza.",
  });
  addCard(slide, {
    x: 8.83,
    y: 2.0,
    w: 4.05,
    h: 3.95,
    fill: COLORS.foam,
    kicker: "DIREZIONE SCELTA",
    title: "Ibrido concierge",
    body:
      "Unione di due anime: premium/luxury per elevare il valore percepito, aperitivo/nightlife per comunicare energia, socialità e desiderabilità serale. L'utilità resta sempre immediata.",
  });
  finalizeSlide(slide, 2);
}

// Slide 3
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.gold);
  addTitle(
    slide,
    "CONCEPT UX",
    "Homepage interattiva come experience navigator",
    "La homepage non sostituisce il sito: lo introduce, lo organizza e lo rende più memorabile."
  );
  addPhaseArrow(slide, 0.55, 2.2, 2.12, 1.6, "1. Facciata", "Primo frame iconico. Il brand si presenta con un'immagine forte, un claim breve e il primo invito a entrare.", COLORS.deep);
  addPhaseArrow(slide, 2.82, 2.2, 2.18, 1.6, "2. Viale", "Un breve movimento porta l'utente dentro la struttura e crea continuità tra homepage e spazi reali.", COLORS.sea);
  addPhaseArrow(slide, 5.15, 2.2, 2.25, 1.6, "3. Bivio", "Hotspot chiari permettono di scegliere il percorso: ristorante, bar, spiaggia, terrazza.", COLORS.coral);
  addPhaseArrow(slide, 7.55, 2.2, 2.18, 1.6, "4. Esplora", "Menu, carta vini, servizi e contenuti emergono in overlay o pannelli leggeri, mai come pagine invasive.", COLORS.gold);
  addPhaseArrow(slide, 9.88, 2.2, 2.18, 1.6, "5. Prenota", "Da ogni scena si può tornare alla navigazione classica o convertire con CTA immediate.", COLORS.success);
  addBulletList(
    slide,
    [
      "Ogni scena ha 1 focus principale, 1 azione primaria e massimo 3 hotspot.",
      "Avanti/indietro funziona come indice visivo, non come timeline cinematografica.",
      "La navigazione classica resta sempre raggiungibile con CTA chiare.",
      "Su mobile l'esperienza si semplifica: sticky bar e tap target più grandi."
    ],
    0.65,
    4.45,
    6.1,
    1.7,
    COLORS.deep,
    12
  );
  addCard(slide, {
    x: 7.45,
    y: 4.32,
    w: 5.35,
    h: 1.95,
    fill: "FFFFFF",
    kicker: "PRINCIPIO GUIDA",
    title: "Storytelling utile",
    body:
      "L'utente deve poter vivere l'atmosfera Hawaii in 10-30 secondi, ma anche saltare subito a menu, servizi, prenotazioni e contatti senza frizione.",
  });
  finalizeSlide(slide, 3);
}

// Slide 4
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "ARCHITETTURA DELLA SCENA",
    "Come funziona ogni schermata della landing",
    "Struttura pensata per restare fluida, leggibile e leggera."
  );
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 2.05,
    w: 7.1,
    h: 3.95,
    rectRadius: 0.08,
    line: { color: COLORS.mist, pt: 1 },
    fill: { color: COLORS.navy },
  });
  slide.addText("Poster frame / clip breve", {
    x: 3.0,
    y: 3.68,
    w: 2.2,
    h: 0.24,
    fontFace: "Georgia",
    fontSize: 18,
    color: COLORS.white,
    align: "center",
    margin: 0,
  });
  addBadge(slide, "CTA principale", 1.0, 2.45, 1.45, COLORS.coral, COLORS.white);
  addBadge(slide, "Hotspot menu", 5.72, 2.58, 1.55, COLORS.gold, COLORS.navy);
  addBadge(slide, "Hotspot vino", 4.85, 4.78, 1.42, COLORS.sand, COLORS.navy);
  addBadge(slide, "Avanti / Indietro", 2.72, 5.48, 1.82, COLORS.foam, COLORS.navy);
  addCard(slide, {
    x: 8.18,
    y: 2.05,
    w: 4.55,
    h: 1.0,
    fill: COLORS.foam,
    kicker: "LIVELLO 1",
    title: "Media",
    body: "Poster image immediata + clip breve lazy-loaded. Se necessario, il movimento si ferma su un frame forte.",
  });
  addCard(slide, {
    x: 8.18,
    y: 3.2,
    w: 4.55,
    h: 1.0,
    fill: "FFFFFF",
    kicker: "LIVELLO 2",
    title: "Interazione",
    body: "Hotspot grandi e pochi. Un solo gesto dominante per scena. Overlay veloci e reversibili.",
  });
  addCard(slide, {
    x: 8.18,
    y: 4.35,
    w: 4.55,
    h: 1.0,
    fill: COLORS.foam,
    kicker: "LIVELLO 3",
    title: "Conversione",
    body: "Prenota, apri menu, scopri la spiaggia, contattaci: ogni scena porta a un'azione concreta.",
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.18,
    y: 5.43,
    w: 4.55,
    h: 0.75,
    rectRadius: 0.08,
    line: { color: COLORS.mist, pt: 1 },
    fill: { color: "FFFFFF" },
    shadow: safeOuterShadow("000000", 0.14, 45, 1, 1.5),
  });
  slide.addText("ACCESSIBILITÀ E PERFORMANCE", {
    x: 8.34,
    y: 5.56,
    w: 4.2,
    h: 0.18,
    fontFace: "Arial",
    fontSize: 10,
    bold: true,
    color: COLORS.coral,
    margin: 0,
  });
  slide.addText("Reduced motion, fallback statico, niente interazioni pesanti o poco intuitive.", {
    x: 8.34,
    y: 5.8,
    w: 4.05,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 10.5,
    color: COLORS.deep,
    margin: 0,
    fit: "shrink",
  });
  finalizeSlide(slide, 4);
}

// Slide 5
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.coral);
  addTitle(
    slide,
    "SITEMAP 2026",
    "Architettura contenuti del sito classico",
    "La landing immersiva convive con una struttura semplice, chiara e orientata alla prenotazione."
  );
  const cards = [
    ["01", "Home Experience", "Landing interattiva + accesso rapido a percorsi, CTA e navigazione classica."],
    ["02", "Ristorante", "Identità cucina, dining room, menu, signature dishes, prenotazione tavolo."],
    ["03", "Bar & Cocktail", "Aperitivo, cocktail menu, atmosfera serale, offerte e momenti social."],
    ["04", "Carta Vini", "Selezione, abbinamenti, bottiglie, tono premium."],
    ["05", "Beach Club", "Spiaggia, servizi, relax, stagione 2026, prenotazione postazione."],
    ["06", "Terrazza / Fine Dining", "Percorso premium, esperienza più esclusiva, storytelling dedicato."],
    ["07", "Eventi", "Privati, aziendali, serate, format speciali, richiesta informazioni."],
    ["08", "Servizi / Gallery / Contatti", "Info pratiche, FAQ, servizi, foto, contatti e canali di prenotazione."],
  ];
  cards.forEach((entry, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    addCard(slide, {
      x: 0.6 + col * 6.25,
      y: 2.0 + row * 1.12,
      w: 5.9,
      h: 0.92,
      fill: row % 2 === 0 ? COLORS.foam : "FFFFFF",
      kicker: entry[0],
      title: entry[1],
      body: entry[2],
    });
  });
  finalizeSlide(slide, 5);
}

// Slide 6
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "STORYBOARD / PARTE 1",
    "Dall'arrivo alla scoperta degli spazi",
    "Prime scene dedicate a ingresso, orientamento e primi punti di contatto con il valore percepito."
  );
  sceneCard(slide, 0.55, 2.0, 4.0, 1.25, "S1", "Facciata", "Desiderio e riconoscibilità", "Hawaii è una destination experience, non solo un locale.", "CTA iniziale: Entra / Scopri");
  sceneCard(slide, 4.68, 2.0, 4.0, 1.25, "S2", "Viale", "Anticipazione", "Ingresso fisico ed emotivo nella struttura.", "Avanti / indietro + invito a proseguire");
  sceneCard(slide, 8.81, 2.0, 4.0, 1.25, "S3", "Bivio iniziale", "Curiosità", "Primi percorsi: ristorante, bar, spiaggia, terrazza.", "Hotspot di scelta");
  sceneCard(slide, 0.55, 3.55, 4.0, 1.25, "S4", "Sala ristorante", "Eleganza", "Esiste una dining experience completa e curata.", "Apri sezione ristorante");
  sceneCard(slide, 4.68, 3.55, 4.0, 1.25, "S5", "Menu ristorante", "Appetito", "Signature dishes, menu e prenotazione tavolo.", "Hotspot su tavolo / piatto");
  sceneCard(slide, 8.81, 3.55, 4.0, 1.25, "S6", "Bancone bar", "Energia e socialità", "Il bar è un ambiente vivo, aspirazionale e fotografabile.", "Hotspot cocktail");
  addCard(slide, {
    x: 0.65,
    y: 5.2,
    w: 12.05,
    h: 0.9,
    fill: COLORS.foam,
    kicker: "NOTE DI TONO",
    title: "Bilanciamento premium + nightlife",
    body:
      "Le prime scene devono far percepire ordine, luce, eleganza e posizione; già da S5-S6 entra una vibrazione più sociale, aperitivo e serale, senza perdere raffinatezza.",
  });
  finalizeSlide(slide, 6);
}

// Slide 7
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.gold);
  addTitle(
    slide,
    "STORYBOARD / PARTE 2",
    "Dal beverage al climax terrazza",
    "Seconda parte costruita per spostare l'utente dalla curiosità alla scelta concreta."
  );
  sceneCard(slide, 0.55, 2.0, 4.0, 1.25, "S7", "Cocktail menu", "Tentazione", "Drink list e signature cocktail come contenuto apribile.", "Hotspot sul drink finito");
  sceneCard(slide, 4.68, 2.0, 4.0, 1.25, "S8", "Carta vini", "Raffinatezza", "La selezione vini completa il tono premium dell'offerta.", "Hotspot al tavolo");
  sceneCard(slide, 8.81, 2.0, 4.0, 1.25, "S9", "Verso la spiaggia", "Libertà", "Hawaii si apre alla dimensione day-use e beach club.", "Hotspot stabilimento");
  sceneCard(slide, 0.55, 3.55, 4.0, 1.25, "S10", "POV spiaggia", "Immersione", "Video in soggettiva per far sentire l'esperienza.", "Overlay servizi spiaggia");
  sceneCard(slide, 4.68, 3.55, 4.0, 1.25, "S11", "Scale terrazza", "Aspettativa", "Salita verso il livello più esclusivo del percorso.", "Hotspot salita");
  sceneCard(slide, 8.81, 3.55, 4.0, 1.25, "S12-S13", "Terrazza + Prenota", "Wow + decisione", "Climax premium e chiusura conversione.", "Prenota / Contatta / WhatsApp");
  addBulletList(
    slide,
    [
      "Luxury variant: più pause, più servizio, più tramonto e table setting.",
      "Nightlife variant: più ritmo al bar, più energia aperitivo, più socialità serale.",
      "La versione finale può mixare i due registri in base ai materiali reali prodotti."
    ],
    0.75,
    5.18,
    12.0,
    0.82,
    COLORS.deep,
    11
  );
  finalizeSlide(slide, 7);
}

// Slide 8
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "SHOTLIST VIDEO",
    "Sistema di clip leggere, modulari e cliccabili",
    "Video brevi, ottimizzati per il web, con finali utili a fermarsi su un frame leggibile."
  );
  addCard(slide, {
    x: 0.55,
    y: 2.0,
    w: 3.0,
    h: 3.7,
    fill: COLORS.foam,
    kicker: "BRANCH 01",
    title: "Facade / Viale",
    body:
      "Wide establishing\nClose-up insegna\nPush-in verso ingresso\nReveal entrata\n\nDurata media: 1.0-2.0s",
  });
  addCard(slide, {
    x: 3.76,
    y: 2.0,
    w: 3.0,
    h: 3.7,
    fill: "FFFFFF",
    kicker: "BRANCH 02",
    title: "Ristorante / Bar",
    body:
      "Wide sala\nTavolo apparecchiato\nPiatto signature\nWide bancone\nPour cocktail\nDrink finale\n\nDurata media: 0.8-1.8s",
  });
  addCard(slide, {
    x: 6.97,
    y: 2.0,
    w: 3.0,
    h: 3.7,
    fill: COLORS.foam,
    kicker: "BRANCH 03",
    title: "Menu / Vini",
    body:
      "Apertura menu ristorante\nApertura cocktail menu\nCarta vini al tavolo\nDettagli tipografici leggibili\n\nDurata media: 0.8-1.2s",
  });
  addCard(slide, {
    x: 10.18,
    y: 2.0,
    w: 2.6,
    h: 3.7,
    fill: "FFFFFF",
    kicker: "BRANCH 04",
    title: "Spiaggia / Terrazza",
    body:
      "Wide ombrelloni\nPOV spiaggia\nSalita scale\nReveal terrazza\nHero sunset dining\n\nDurata media: 1.2-2.5s",
  });
  addCard(slide, {
    x: 0.7,
    y: 5.95,
    w: 12.0,
    h: 0.36,
    fill: COLORS.navy,
    title: "",
    body:
      "Regola chiave: il video introduce il momento, il fermo immagine finale permette di leggere hotspot, menu e CTA senza stress visivo.",
  });
  finalizeSlide(slide, 8);
}

// Slide 9
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.coral);
  addTitle(
    slide,
    "MAPPA CONTENUTI",
    "Asset e materiali da produrre o aggiornare",
    "Questa è la base operativa per organizzare shooting, raccolta informazioni e aggiornamento contenuti."
  );
  addCard(slide, {
    x: 0.55,
    y: 2.0,
    w: 3.0,
    h: 3.95,
    fill: COLORS.foam,
    kicker: "ASSET FOTO",
    title: "Nuove immagini",
    body:
      "Facciata\nViale\nSala ristorante\nBancone bar\nTavoli e mise en place\nCarta vini\nSpiaggia e servizi\nScale e terrazza\nSunset / serale",
  });
  addCard(slide, {
    x: 3.78,
    y: 2.0,
    w: 3.0,
    h: 3.95,
    fill: "FFFFFF",
    kicker: "ASSET VIDEO",
    title: "Micro-clip web",
    body:
      "Tutte le scene della shotlist\nVersioni desktop e mobile-safe\nPoster frame per ogni clip\nLoop brevi quando utili\nFermate su frame ad alta leggibilità",
  });
  addCard(slide, {
    x: 7.01,
    y: 2.0,
    w: 2.8,
    h: 3.95,
    fill: COLORS.foam,
    kicker: "CONTENUTI EDITORIALI",
    title: "Testi 2026",
    body:
      "Posizionamento\nRistorante\nBar / aperitivo\nCarta vini\nBeach club\nEventi\nServizi\nContatti",
  });
  addCard(slide, {
    x: 10.03,
    y: 2.0,
    w: 2.8,
    h: 3.95,
    fill: "FFFFFF",
    kicker: "DATI DA CLIENTE",
    title: "Da confermare",
    body:
      "Novità 2026\nMenu aggiornati\nServizi effettivi\nPolicy\nOrari\nCanali prenotazione\nRistorante terrazza\nEventi e format",
  });
  addBadge(slide, "Contenuti in definizione", 0.62, 6.18, 2.7, COLORS.gold, COLORS.navy);
  finalizeSlide(slide, 9);
}

// Slide 10
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "BENCHMARK E ISPIRAZIONI",
    "Pattern utili da adattare a Hawaii",
    "Riferimenti scelti per equilibrio tra desiderabilità, wayfinding e praticità."
  );
  addCard(slide, {
    x: 0.55,
    y: 2.0,
    w: 3.95,
    h: 1.7,
    fill: COLORS.foam,
    kicker: "AMAN AMANKORA",
    title: "Storytelling premium",
    body: "Tono editoriale, pochi messaggi forti, esperienza trasformata in journey coerente.",
  });
  addCard(slide, {
    x: 4.7,
    y: 2.0,
    w: 3.95,
    h: 1.7,
    fill: "FFFFFF",
    kicker: "JOALI BEING 360",
    title: "Preview immersivo",
    body: "Anteprima degli spazi e riduzione dell'incertezza prima della scelta.",
  });
  addCard(slide, {
    x: 8.85,
    y: 2.0,
    w: 3.95,
    h: 1.7,
    fill: COLORS.foam,
    kicker: "MARGARITAVILLE MAP",
    title: "Wayfinding utile",
    body: "Orientamento semplice, utile per una struttura con servizi diversi e percorsi multipli.",
  });
  addCard(slide, {
    x: 0.55,
    y: 4.1,
    w: 6.1,
    h: 1.85,
    fill: "FFFFFF",
    kicker: "DA PRENDERE",
    title: "Pattern da prendere in prestito",
    body:
      "Hero con promessa chiara\nEsperienze organizzate per percorsi\nPreview leggera degli spazi\nTono premium ma concreto\nInterazioni concise e orientate alla scelta",
  });
  addCard(slide, {
    x: 6.9,
    y: 4.1,
    w: 5.9,
    h: 1.85,
    fill: COLORS.foam,
    kicker: "DA EVITARE",
    title: "Rischi da evitare",
    body:
      "WebGL eccessivo\nNavigazione strana\nMotion continua e pesante\nCopy troppo artefatta\nInformazioni utili nascoste dietro effetti",
  });
  finalizeSlide(slide, 10);
}

// Slide 11
{
  const slide = pptx.addSlide();
  addBackground(slide, COLORS.gold);
  addTitle(
    slide,
    "ROADMAP IN 3 FASI",
    "Percorso consigliato di progetto",
    "Struttura pensata per consegnare valore presto e poi aumentare l'effetto wow senza compromettere performance e chiarezza."
  );
  addPhaseArrow(slide, 0.58, 2.15, 4.0, 2.75, "Fase 1. Refresh classico", "Aggiornamento foto e contenuti 2026\nPulizia navigazione e gerarchie\nPagine chiave più chiare\nCTA più visibili\nRiordino servizi, eventi, contatti", COLORS.deep);
  addPhaseArrow(slide, 4.65, 2.15, 4.0, 2.75, "Fase 2. Landing immersiva", "Progettazione scene e hotspot\nHomepage experience navigator\nOverlay menu, vini, servizi\nDesktop e mobile ottimizzati\nIntegrazione micro-clip e poster frame", COLORS.coral);
  addPhaseArrow(slide, 8.72, 2.15, 4.0, 2.75, "Fase 3. Ottimizzazione", "Compressione media\nLazy loading e fallback statici\nRiduzione motion dove serve\nAnalytics su hotspot e CTA\nRifinitura performance mobile", COLORS.success);
  addBadge(slide, "Approccio consigliato: rilascio progressivo", 4.18, 5.38, 5.0, COLORS.sand, COLORS.navy);
  finalizeSlide(slide, 11);
}

// Slide 12
{
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(
    slide,
    "PUNTI APERTI",
    "Sezioni da finalizzare",
    "La struttura è definita, mentre alcune parti restano da completare su offerta, servizi e priorità."
  );
  addCard(slide, {
    x: 0.55,
    y: 2.0,
    w: 4.0,
    h: 3.7,
    fill: COLORS.foam,
    kicker: "IN DEFINIZIONE",
    title: "Offerta 2026",
    body:
      "Novità di stagione\nServizi realmente attivi\nMenu definitivi\nCarta vini aggiornata\nPosizionamento terrazza / fine dining",
  });
  addCard(slide, {
    x: 4.67,
    y: 2.0,
    w: 4.0,
    h: 3.7,
    fill: "FFFFFF",
    kicker: "FOCUS STRATEGICO",
    title: "Priorità commerciali",
    body:
      "Cosa spingere di più\nPrenotazione tavolo vs beach club\nEventi da promuovere\nTarget principale 2026\nBilanciamento luxury vs nightlife",
  });
  addCard(slide, {
    x: 8.79,
    y: 2.0,
    w: 4.0,
    h: 3.7,
    fill: COLORS.foam,
    kicker: "SVILUPPO",
    title: "Dopo l'incontro",
    body:
      "Aggiornare il deck\nDefinire wireframe homepage\nBloccare lista asset shooting\nValidare roadmap e priorità\nPassare a stima e progettazione esecutiva",
  });
  addBadge(slide, "Framework progettuale", 4.1, 6.05, 3.2, COLORS.coral, COLORS.white);
  finalizeSlide(slide, 12);
}

// Write file
(async () => {
  await pptx.writeFile({ fileName: "presentation/output/hawaii-pescara-2026-proposta.pptx" });
})();
