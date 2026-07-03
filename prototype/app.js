const chapters = [
  {
    id: "facciata",
    kicker: "Capitolo 01",
    title: "Arrivo",
    subtitle: "La facciata si apre sul mare.",
    body: "La sala attende dietro la luce del mattino e il rumore dell'acqua.",
    accent: "#d49069",
    start: "#17384d",
    end: "#08111a",
    primary: "Prenota un tavolo",
    secondary: "Scopri la sala",
    callouts: [
      { phase: "0.15", label: "Mare", text: "Il primo orizzonte resta sempre davanti." },
      { phase: "0.48", label: "Ingresso", text: "La casa accoglie con luce e calma." },
      { phase: "0.76", label: "Sala", text: "Il servizio inizia prima ancora di sedersi." },
    ],
    focus: [
      { eyebrow: "Vista", title: "Fronte mare", text: "La sala si apre verso l'acqua con tavoli vicini alla luce." },
      { eyebrow: "Accoglienza", title: "Ingresso", text: "Un arrivo calmo, tra legno, vetro e riflessi chiari." },
      { eyebrow: "Tavoli", title: "Sala principale", text: "Il servizio accompagna il ritmo del pranzo e della cena." },
    ],
  },
  {
    id: "cucina",
    kicker: "Capitolo 02",
    title: "Cucina",
    subtitle: "Il fuoco entra in scena.",
    body: "Padelle, passaggi rapidi e piatti che escono verso la sala.",
    accent: "#f0b16f",
    start: "#40261e",
    end: "#0b1218",
    primary: "Menu ristorante",
    secondary: "Carta vini",
    callouts: [
      { phase: "0.12", label: "Chef", text: "Ogni piatto nasce da un gesto netto e preciso." },
      { phase: "0.44", label: "Fiamma", text: "La cucina si accende e cambia ritmo." },
      { phase: "0.78", label: "Tavola", text: "Il piatto arriva in sala mentre il mare resta sullo sfondo." },
    ],
    focus: [
      { eyebrow: "Cucina", title: "Fuoco vivo", text: "Il passaggio in padella segna il carattere del piatto." },
      { eyebrow: "Chef", title: "Gesto", text: "Ogni uscita è fatta di ritmo, calore e precisione." },
      { eyebrow: "Menu", title: "Piatti", text: "Sapori netti, mare vicino, servizio diretto." },
    ],
  },
  {
    id: "bar",
    kicker: "Capitolo 03",
    title: "Bar & Aperitivo",
    subtitle: "Il tramonto passa dal bancone.",
    body: "Cocktail freddi, vetro, ghiaccio e la prima luce della sera.",
    accent: "#ff9c6a",
    start: "#3f2440",
    end: "#09121a",
    primary: "Menu cocktail",
    secondary: "Aperitivo sul mare",
    callouts: [
      { phase: "0.16", label: "Bancone", text: "Il primo incontro passa dal bancone." },
      { phase: "0.46", label: "Cocktail", text: "Il drink prende forma tra luce e ghiaccio." },
      { phase: "0.78", label: "Tramonto", text: "Fuori il cielo si abbassa, dentro cambia l'atmosfera." },
    ],
    focus: [
      { eyebrow: "Aperitivo", title: "Bancone", text: "Il bar accompagna il passaggio dal giorno alla sera." },
      { eyebrow: "Cocktail", title: "Miscelazione", text: "Ghiaccio, vetro e luce calda davanti al mare." },
      { eyebrow: "Sera", title: "Tramonto", text: "Il ritmo si alza mentre il cielo cambia colore." },
    ],
  },
  {
    id: "spiaggia",
    kicker: "Capitolo 04",
    title: "Spiaggia",
    subtitle: "La giornata continua sulla spiaggia.",
    body: "Passerella, ombrelloni, brezza e orizzonte aperto.",
    accent: "#87bbcf",
    start: "#205872",
    end: "#07121a",
    primary: "Scopri la spiaggia",
    secondary: "Beach club",
    callouts: [
      { phase: "0.14", label: "Passerella", text: "Un passo dopo l'altro verso il mare." },
      { phase: "0.42", label: "Spiaggia", text: "Ombrelloni, luce aperta e orizzonte davanti." },
      { phase: "0.8", label: "Relax", text: "La giornata si distende tra sabbia e brezza." },
    ],
    focus: [
      { eyebrow: "Beach Club", title: "Passerella", text: "L'accesso al mare accompagna tutta la giornata." },
      { eyebrow: "Spiaggia", title: "Ombrelloni", text: "Spazio, luce e relax a pochi passi dall'acqua." },
      { eyebrow: "Mare", title: "Tempo lento", text: "Un tratto di costa da vivere fino al tramonto." },
    ],
  },
  {
    id: "terrazza",
    kicker: "Capitolo 05",
    title: "Terrazza",
    subtitle: "La sera sale in terrazza.",
    body: "Tavoli illuminati, bicchieri pieni e vista aperta sul mare.",
    accent: "#f0c889",
    start: "#5b3d39",
    end: "#091019",
    primary: "Prenota in terrazza",
    secondary: "Cena sul mare",
    callouts: [
      { phase: "0.18", label: "Salita", text: "La luce cambia mentre la vista si apre." },
      { phase: "0.5", label: "Terrazza", text: "Il tavolo prende posto sopra il mare." },
      { phase: "0.82", label: "Cena", text: "Il momento più raccolto della serata." },
    ],
    focus: [
      { eyebrow: "Terrazza", title: "Vista aperta", text: "Il mare resta davanti fino all'ultimo bicchiere." },
      { eyebrow: "Cena", title: "Tavoli illuminati", text: "La sera trova qui il suo momento più raccolto." },
      { eyebrow: "Prenotazioni", title: "Sul mare", text: "Un tavolo in terrazza per il tramonto e la cena." },
    ],
  },
];

const chapterContainer = document.getElementById("chapterContainer");
const chapterQuicknav = document.getElementById("chapterQuicknav");
const pageProgressBar = document.getElementById("pageProgressBar");

function renderChapterQuicknav() {
  chapterQuicknav.innerHTML = chapters
    .map(
      (chapter) => `
        <a class="quicknav-link" href="#chapter-${chapter.id}" data-quicknav="${chapter.id}">
          <span>${chapter.kicker}</span>
          <strong>${chapter.title}</strong>
        </a>
      `,
    )
    .join("");
}

function renderChapter(chapter) {
  return `
    <section class="chapter-shell" id="chapter-${chapter.id}" data-chapter="${chapter.id}" style="--chapter-accent:${chapter.accent}; --chapter-start:${chapter.start}; --chapter-end:${chapter.end};">
      <div class="chapter-sticky">
        <div class="chapter-stage">
          <div class="chapter-media">
            <div class="chapter-media-backdrop"></div>
            <div class="chapter-media-beam"></div>
            <div class="chapter-media-object">
              <span class="chapter-media-label">${chapter.title}</span>
              <div class="chapter-media-core"></div>
              <div class="chapter-media-trace"></div>
              <div class="chapter-media-glow"></div>
            </div>
            <div class="chapter-overlay">
              <p class="chapter-kicker">${chapter.kicker}</p>
              <h2>${chapter.title}</h2>
              <p class="chapter-subtitle">${chapter.subtitle}</p>
              <p class="chapter-body">${chapter.body}</p>
              <div class="chapter-actions">
                <button class="primary-button" type="button">${chapter.primary}</button>
                <button class="ghost-button" type="button">${chapter.secondary}</button>
              </div>
            </div>
            <div class="chapter-callouts">
              ${chapter.callouts
                .map(
                  (callout, index) => `
                    <article class="chapter-callout callout-${index + 1}" style="--phase:${callout.phase};">
                      <span>${callout.label}</span>
                      <p>${callout.text}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
            <div class="chapter-focus-stack">
              ${chapter.focus
                .map(
                  (item) => `
                    <article class="chapter-focus-card">
                      <span>${item.eyebrow}</span>
                      <strong>${item.title}</strong>
                      <p>${item.text}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderChapters() {
  chapterContainer.innerHTML = chapters.map(renderChapter).join("");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setActiveQuicknav(activeId) {
  document.querySelectorAll("[data-quicknav]").forEach((node) => {
    node.classList.toggle("active", node.dataset.quicknav === activeId);
  });
}

function updateChapterProgress() {
  const chapterNodes = [...document.querySelectorAll(".chapter-shell")];
  let activeId = chapters[0].id;

  chapterNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    const scrollRange = rect.height - window.innerHeight;
    const progress = scrollRange <= 0 ? 1 : clamp((-rect.top) / scrollRange, 0, 1);
    node.style.setProperty("--chapter-progress", progress.toFixed(4));

    if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.4) {
      activeId = node.dataset.chapter;
    }
  });

  const doc = document.documentElement;
  const totalScroll = doc.scrollHeight - window.innerHeight;
  const pageProgress = totalScroll <= 0 ? 0 : clamp(window.scrollY / totalScroll, 0, 1);
  pageProgressBar.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
  setActiveQuicknav(activeId);

  const activeNode = document.querySelector(`[data-chapter="${activeId}"]`);
  if (activeNode) {
    activeNode.classList.add("is-active");
    chapterNodes
      .filter((node) => node !== activeNode)
      .forEach((node) => node.classList.remove("is-active"));
  }
}

renderChapterQuicknav();
renderChapters();
updateChapterProgress();

window.addEventListener("scroll", updateChapterProgress, { passive: true });
window.addEventListener("resize", updateChapterProgress);

document.title = "Hawaii Pescara 2026 Experience";
