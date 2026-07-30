# Tablet Dynamic Viewport and Events Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminare la fascia nera e la perdita dello sticky su tablet, mantenendo stabile il ritmo video e spostando "Giovedì Posh" dalla scena aperitivo alla scena eventi.

**Architecture:** Stage, sovrapposizione della timeline e coda finale useranno una coppia CSS `100svh`/`100dvh`, mentre le altezze narrative resteranno in `svh`. I contenuti cambieranno soltanto nel modello dati del journey. I test statici proteggeranno i contratti CSS e di contenuto; il test browser tablet verificherà uscita nel footer e rientro sticky in reverse.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, CSS viewport units, Node assertions, Playwright Chromium/WebKit.

---

## File Map

- Modify: `tests/web-static.js`
  - Contratti statici per fallback viewport, durata narrativa e collocazione di "Giovedì Posh".
- Modify: `tests/tablet-interface-controls.js`
  - Regressione browser per uscita nel footer e ritorno a un progresso intermedio.
- Modify: `tests/run-web-production.js`
  - Controllo delle regole `svh` e `dvh` nell'artefatto CSS compilato.
- Modify: `web/src/app/globals.css`
  - Classi viewport con fallback `svh` e override `dvh`.
- Modify: `web/src/components/home/scroll-video-stage.tsx`
  - Applicazione delle classi viewport a stage, track e tail.
- Modify: `web/src/lib/site-content.ts`
  - Copy aperitivo e hotspot eventi.
- Modify: `docs/superpowers/specs/2026-07-23-tablet-dynamic-viewport-and-events-placement-design.md`
  - Specifica già approvata; nessuna ulteriore modifica prevista.

### Task 1: Contratti statici in RED

**Files:**
- Modify: `tests/web-static.js`
- Test: `tests/web-static.js`

- [ ] **Step 1: aggiungere il test della collocazione editoriale**

Estrarre dal file `site-content.ts` i blocchi con confini espliciti:

```js
function sourceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing source range ${start} -> ${end}`);
  return source.slice(startIndex, endIndex);
}

const aperitivoScene = sourceBetween(
  siteContent,
  'id: "aperitivo"',
  'id: "muulab"',
);
const eventiScene = sourceBetween(
  siteContent,
  'id: "eventi"',
  '] satisfies JourneyScene[]',
);

assert.doesNotMatch(aperitivoScene, /Giovedì Posh/);
assert.match(
  aperitivoScene,
  /label:\s*"Cocktail & bollicine",\s*href:\s*"\/menu#cocktail"/,
);
assert.match(
  eventiScene,
  /label:\s*"Giovedì Posh",\s*href:\s*"\/eventi"/,
);
assert.doesNotMatch(eventiScene, /label: "Le serate"/);
```

- [ ] **Step 2: aggiungere il test del contratto viewport**

Usare un helper che legge una sola regola CSS, evitando regex che attraversano
selettori diversi:

```js
function cssRuleBody(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Missing standalone CSS rule for ${selector}`);
  return match[1];
}

assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-stage")),
  "height:100svh;",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-track")),
  "margin-top:-100svh;",
);
assert.equal(
  compactCssDeclarations(cssRuleBody(journeyViewportBaseStyles, ".journey-viewport-tail")),
  "height:100svh;",
);

const dynamicViewportBlock = cssBlock(
  globalStyles,
  /@supports \(height: 100dvh\)/,
  "@supports (height: 100dvh) journey viewport block",
);
assert.match(dynamicViewportBlock.body, /height:\s*100dvh/);
assert.match(dynamicViewportBlock.body, /margin-top:\s*-100dvh/);
```

Sostituire il vecchio controllo della coda `h-[100svh]` con:

```js
assert.match(stage, /journey-stage journey-viewport-stage sticky top-0/);
assert.match(stage, /journey-viewport-track/);
assert.match(
  stage,
  /data-journey-tail[\s\S]{0,120}journey-viewport-tail/,
);
assert.doesNotMatch(stage, /h-\[100svh\]|-mt-\[100svh\]/);
assert.match(
  stage,
  /style=\{\{ height: `\$\{\(scene\.end - scene\.start\) \* 1800\}svh` \}\}/,
);
```

- [ ] **Step 3: eseguire il test e osservare il fallimento atteso**

Run:

```bash
npm run test:web:static
```

Expected: FAIL perché il codice usa ancora `100svh`, la scena aperitivo cita "Giovedì Posh" e la scena eventi usa "Le serate".

### Task 2: Caratterizzazione tablet/footer

**Files:**
- Modify: `tests/tablet-interface-controls.js`
- Test: `tests/tablet-interface-controls.js`

- [ ] **Step 1: aggiungere un helper per il round trip**

```js
async function assertJourneyFooterRoundTrip(page, label) {
  const expectedProgress = 0.62;

  await page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (!footer) throw new Error("Missing footer");
    const top = window.scrollY + footer.getBoundingClientRect().top;
    window.scrollTo({ top, behavior: "auto" });
  });
  await page.waitForFunction(
    () => {
      const footer = document.querySelector("footer");
      if (!footer) return false;
      const rect = footer.getBoundingClientRect();
      const wrapper = document.querySelector('[data-testid="hero-stage"]');
      const progress = Number(wrapper?.dataset.scrollProgress);
      const target = Number(wrapper?.dataset.targetTime);
      return (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        progress >= 0.998 &&
        Number.isFinite(target)
      );
    },
    undefined,
    { timeout: 4_000 },
  );

  const footerTargetTime = Number(
    await page.locator('[data-testid="hero-stage"]').getAttribute("data-target-time"),
  );
  assert.ok(Number.isFinite(footerTargetTime), `${label}: finite footer target`);

  await prepareMovement(page, expectedProgress, "reverse");
  const state = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="scroll-video-stage"]');
    const wrapper = document.querySelector('[data-testid="hero-stage"]');
    const rect = stage.getBoundingClientRect();
    return {
      height: rect.height,
      innerHeight: window.innerHeight,
      progress: Number(wrapper.dataset.scrollProgress),
      targetTime: Number(wrapper.dataset.targetTime),
      top: rect.top,
      videoDirection: wrapper.dataset.videoDirection,
    };
  });

  assert.ok(Number.isFinite(state.progress), `${label}: finite progress`);
  assert.ok(Number.isFinite(state.targetTime), `${label}: finite return target`);
  assert.ok(Math.abs(state.height - state.innerHeight) <= 2, `${label}: viewport height`);
  assert.ok(Math.abs(state.top) <= 2, `${label}: sticky top`);
  assert.ok(
    Math.abs(state.progress - expectedProgress) <= 0.002,
    `${label}: restored progress`,
  );
  assert.ok(state.targetTime < footerTargetTime, `${label}: decreasing target`);
  assert.equal(state.videoDirection, "reverse", `${label}: reverse direction`);
}
```

Chiamare lo helper alla fine di `exerciseTablet`, prima del log di successo. Il
`prepareMovement` esistente fornisce `waitForFunction`, timeout e diagnostica
dello stato reverse. Le asserzioni dell'helper usano una costante locale
`expectedProgress = 0.62`, indipendente dal dataset applicativo.

- [ ] **Step 2: caratterizzare una variazione di viewport a journey attivo**

Dopo il round trip, ridimensionare la viewport tablet di 96 pixel in altezza,
riposizionare il journey allo stesso progresso normalizzato e verificare entro
2 pixel altezza dello stage e sticky top, oltre al progresso entro 0,002. Ripetere
le stesse verifiche dopo il ripristino della viewport originale. Questo test non
emula la toolbar iPadOS, ma protegge la risposta del layout agli eventi resize.

- [ ] **Step 3: eseguire la caratterizzazione sulla build corrente**

Rigenerare l'artefatto Pages e usare il runner esistente, che impone deadline e
chiude sempre server e browser:

```bash
bash scripts/build-pages-preview.sh
PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production
```

Expected: il test può passare con la viewport fissa di Playwright. Serve come
caratterizzazione del round trip e non come prova RED del browser chrome
dinamico. Il RED obbligatorio e affidabile è il test statico della Task 1.

### Task 3: Implementazione minima in GREEN

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/home/scroll-video-stage.tsx`
- Modify: `web/src/lib/site-content.ts`
- Test: `tests/web-static.js`
- Test: `tests/tablet-interface-controls.js`
- Test: `tests/run-web-production.js`

- [ ] **Step 1: aggiungere le classi CSS con fallback**

```css
.journey-viewport-stage {
  height: 100svh;
}

.journey-viewport-track {
  margin-top: -100svh;
}

.journey-viewport-tail {
  height: 100svh;
}

@supports (height: 100dvh) {
  .journey-viewport-stage {
    height: 100dvh;
  }

  .journey-viewport-track {
    margin-top: -100dvh;
  }

  .journey-viewport-tail {
    height: 100dvh;
  }
}
```

Il runner di produzione deve inoltre verificare che l'artefatto CSS compilato
conservi tutte e sei le coppie selettore/valore `svh` e `dvh`.

- [ ] **Step 2: applicare le classi senza cambiare la durata narrativa**

Nel componente:

- impostare lo stage esattamente come
  `className="journey-stage journey-viewport-stage sticky top-0 overflow-hidden"`;
- sostituire `-mt-[100svh]` del track con `journey-viewport-track`;
- sostituire `h-[100svh]` della coda con `journey-viewport-tail`;
- lasciare invariato `${(scene.end - scene.start) * 1800}svh`.

- [ ] **Step 3: correggere i contenuti del journey**

Scena aperitivo:

```ts
summary:
  "Daybed e tavoli vista mare, cocktail e bollicine accompagnano la golden hour sul mare.",
{
  label: "Cocktail & bollicine",
  href: "/menu#cocktail",
  x: 71,
  y: 52,
  caption: "Mixology e bollicine alla golden hour",
}
```

Scena eventi, al posto di "Le serate":

```ts
{
  label: "Giovedì Posh",
  href: "/eventi",
  x: 66,
  y: 28,
  caption: "Dj set e tavoli sotto le stelle",
}
```

- [ ] **Step 4: eseguire i test statici**

Run:

```bash
npm run test:web:static
```

Expected: PASS.

- [ ] **Step 5: eseguire il test tablet**

Ricostruire l'artefatto dopo la modifica e usare il runner con cleanup:

Run:

```bash
bash scripts/build-pages-preview.sh
PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production
```

Expected: PASS su Chromium e WebKit, portrait e landscape.

### Task 4: Verifica completa e revisione indipendente

**Files:**
- Verify only.

- [ ] **Step 1: eseguire unit e static tests**

```bash
npm run test:web:journey
npm run test:web:booking
npm run test:web:static
```

Expected: tutti PASS.

- [ ] **Step 2: eseguire lint e build**

```bash
./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json
NODE_OPTIONS=--max-old-space-size=1024 npm --prefix web run lint -- --max-warnings=0
NODE_OPTIONS=--max-old-space-size=2048 npm --prefix web run build
```

Expected: exit code 0 senza errori.

- [ ] **Step 3: eseguire le regressioni browser di produzione**

```bash
bash scripts/build-pages-preview.sh
PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production
```

Expected: tutte le suite browser PASS.

- [ ] **Step 4: richiedere una revisione indipendente**

Il reviewer deve controllare:

- nessuna regressione desktop;
- nessun listener o workaround JavaScript aggiunto;
- geometria wrapper invariata a `1800svh` di corsa utile;
- copy "Giovedì Posh" assente soltanto dall'aperitivo journey;
- test round trip realmente significativo.

- [ ] **Step 5: verificare il diff finale**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: nessun errore whitespace; soltanto i file previsti.

### Task 5: Commit, push e pubblicazione Pages

**Files:**
- Commit all approved files.

- [ ] **Step 1: creare un commit dedicato e reversibile**

```bash
git add docs/superpowers/specs/2026-07-23-tablet-dynamic-viewport-and-events-placement-design.md \
  docs/superpowers/plans/2026-07-23-tablet-dynamic-viewport-and-events-placement.md \
  tests/run-web-production.js \
  tests/web-static.js \
  tests/tablet-interface-controls.js \
  web/src/app/globals.css \
  web/src/components/home/scroll-video-stage.tsx \
  web/src/lib/site-content.ts
git commit -m "Fix tablet journey viewport and event placement"
```

- [ ] **Step 2: pushare il branch di lavoro**

```bash
git push origin codex/audit-hardening-font-video
```

- [ ] **Step 3: aggiornare il branch Pages senza merge distruttivi**

Prima di questo step ottenere una conferma esplicita dell'utente: il push sul
branch `claude/codex-handoff-assets-se8fjq` attiva il deploy GitHub Pages.

Aggiornare i riferimenti remoti, verificare che il branch Pages remoto sia
antenato di `HEAD` e inviare esplicitamente il commit corrente senza usare il
vecchio branch locale:

```bash
git fetch origin claude/codex-handoff-assets-se8fjq
git merge-base --is-ancestor origin/claude/codex-handoff-assets-se8fjq HEAD
git push origin HEAD:claude/codex-handoff-assets-se8fjq
```

- [ ] **Step 4: attendere e verificare GitHub Pages**

Controllare che il workflow associato al commit termini con `success`, quindi verificare:

- HTML online riferito al nuovo deployment;
- scena aperitivo senza "Giovedì Posh";
- scena eventi con "Giovedì Posh";
- asset CSS del nuovo build servito da Pages.

- [ ] **Step 5: eseguire lo smoke test iPad reale**

Su iPad, prima Safari e poi Chrome:

1. aprire la homepage con la barra indirizzi visibile;
2. scorrere finché la barra si ritrae;
3. verificare che lo stage riempia lo schermo senza fascia nera;
4. raggiungere il footer;
5. tornare alla scena aperitivo;
6. verificare stage ancorato, video in reverse e controlli cliccabili.

PASS: nessuna fascia nera, nessuna perdita di ancoraggio, ritorno reverse fluido.
FAIL: eseguire il rollback seguente prima di ulteriori modifiche.

- [ ] **Step 6: registrare il rollback**

Rollback reversibile, se necessario:

```bash
git revert <sha-del-commit>
git push origin codex/audit-hardening-font-video
git push origin HEAD:claude/codex-handoff-assets-se8fjq
```

Il test automatico non simula l'animazione della barra iPadOS. Segnalare come
verifica finale necessaria uno smoke test su iPad reale, Safari e Chrome, facendo
scomparire la barra del browser, raggiungendo il footer e tornando indietro.
