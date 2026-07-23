# Final Content And Safari Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correggere Safari/tablet, aggiornare Villaggio, Menu ed Eventi secondo le annotazioni approvate e pubblicare un artifact Pages verificato.

**Architecture:** Le correzioni restano nei componenti e nei dati esistenti. Il video conserva il controller dual-layer ma perde ogni transform CSS; menu ed eventi continuano a derivare da `site-content.ts`, con anchor esplicite e link esterni sicuri. I test statici bloccano regressioni di copy e struttura, mentre un test browser dedicato verifica i controlli tablet.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node assert, Playwright Chromium/WebKit, GitHub Actions Pages.

---

### Task 1: Regressioni Safari e tablet

**Files:**
- Create: `tests/tablet-interface-controls.js`
- Modify: `tests/run-web-production.js`

- [ ] Scrivere test Chromium e WebKit a 768x1024 e 1024x768.
- [ ] In stato iniziale, moving, settled e cambio direzione verificare CTA, apertura popup e navigazione Soul Rail.
- [ ] Per forward e reverse verificare `transform:none`, bounds identici, `object-fit:cover` e `object-position:center`.
- [ ] Eseguire il test e confermare il RED sugli stili correnti.

### Task 2: Stabilita Safari e input tablet

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/home/scroll-video-stage.tsx`

- [ ] Separare gli stili `video` dagli stili `img`: entrambi i video devono avere `transform:none`, `object-position:center` e transizione limitata all'opacita.
- [ ] Conservare parallax/scale soltanto sul poster e sulle immagini statiche.
- [ ] Portare copy e controlli interattivi sopra hotspot/video con stacking esplicito e `touch-action:pan-y`.
- [ ] Fare in modo che il priming touch del video non impedisca i click originati su link e button.
- [ ] Eseguire test tablet, lint, TypeScript, unit test journey e build.
- [ ] Commit: `Stabilize Safari video crop and tablet controls`.

### Task 3: Regressioni Villaggio, Menu ed Eventi

**Files:**
- Modify: `tests/web-static.js`
- Modify: `tests/web-smoke.js`

- [ ] Aggiungere negative check su source e artifact per `Fritti al cono`, `Special panini`, sandwich, hot dog, bao, `Il Giovedì in terrazza`, `18:00 — 01:00`, `Prenota terrazza`, `champagne e crudi` e `musica dal vivo`.
- [ ] Verificare copy esatto `Giovedì Posh` e CTA verso il WhatsApp Hawaii configurato.
- [ ] Verificare ordine Beach/Restaurant/Sport/MUULab/Nightlife, `/terrazza` e span esclusivo Eventi.
- [ ] Verificare mapping esatto delle quattro anchor, click native, focus visibile, `scroll-margin` e comportamento reduced-motion.
- [ ] Verificare PDF MUULab con `target="_blank"` e `rel="noopener noreferrer"`.
- [ ] Usare come fonte deterministica della carta Hawaii `docs/content/hawaii-wine-list-2026-07-23.md`, fotografia della sola sezione Cantina di `https://www.hawaiipescara.it/menu/` acquisita il 23 luglio 2026.
- [ ] Eseguire i test e confermare il RED.

### Task 4: Villaggio, Menu ed Eventi

**Files:**
- Modify: `web/src/app/villaggio/page.tsx`
- Modify: `web/src/app/menu/page.tsx`
- Modify: `web/src/lib/site-content.ts`
- Modify: `web/src/app/eventi/page.tsx` solo se necessario per markup/anchor; il copy resta derivato da `site-content.ts`

- [ ] Inserire la card MUULab prima di Nightlife; rendere soltanto Nightlife `sm:col-span-2`.
- [ ] Aggiornare titoli e copy Villaggio a cinque anime e pesce a pranzo e cena.
- [ ] Eliminare panini/fritti e relativi copy da tutte le sorgenti.
- [ ] Rendere le quattro card Menu anchor link accessibili.
- [ ] Aggiungere `#cocktail`, la sezione `#carta-vini` Hawaii con i vini pubblicati sul sito esistente e il pulsante interno nella card bevande.
- [ ] Aggiungere `Menu MUULab completo` con il PDF ufficiale accanto a `Prenota MUULab`.
- [ ] Sostituire ovunque il vecchio giovedì con `Giovedì Posh`, senza orario e con CTA WhatsApp.
- [ ] Eseguire test statici, booking, journey, lint, TypeScript e build.
- [ ] Commit: `Update village menus and recurring events`.

### Task 5: Valutazione back office

**Files:**
- Create: `docs/backoffice-menu-evaluation.md`

- [ ] Documentare l'opzione consigliata Decap CMS Git-backed, prerequisiti e dipendenze.
- [ ] Specificare che questo rilascio non modifica `studio/`, route admin, manifest/lockfile, `.env*`, autenticazione, workflow o configurazione deploy.
- [ ] Commit: `Document lightweight menu back office`.

### Task 6: Verifica e pubblicazione

**Files:**
- No source changes expected.

- [ ] Eseguire `npm run test:web:journey`.
- [ ] Eseguire `npm run test:web:booking`.
- [ ] Eseguire `npm run test:web:static`.
- [ ] Eseguire `./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json`.
- [ ] Eseguire `npm --prefix web run lint -- --max-warnings=0`.
- [ ] Eseguire `npm run build:web:aruba`.
- [ ] Costruire l'esatto artifact con `NODE_OPTIONS=--max-old-space-size=2048 bash scripts/build-pages-preview.sh` ed eseguire `PAGES_BASE_PATH=/hawaii WEBKIT_PLAYBACK_OPTIONAL=0 npm run test:web:production`; se il sandbox locale blocca `ps`/browser, il job GitHub `verify` deve passare prima che `deploy` possa iniziare.
- [ ] Eseguire `git fetch origin`, salvare lo SHA immutabile in `/tmp/hawaii-pages-pre-release-sha.txt` con `git rev-parse origin/claude/codex-handoff-assets-se8fjq` e verificare che il valore registrato sia antenato di `HEAD`.
- [ ] Push fast-forward `HEAD:claude/codex-handoff-assets-se8fjq`.
- [ ] Controllare che workflow Pages, artifact e deployment riportino lo SHA pubblicato.
- [ ] Richiedere conferma crop/zoom su Safari desktop fisico.
- [ ] In caso di blocker: leggere lo SHA con `PRE_RELEASE_SHA="$(cat /tmp/hawaii-pages-pre-release-sha.txt)"`, eseguire `git revert --no-commit "$PRE_RELEASE_SHA..HEAD"`, commit `Revert blocked Pages release` e normale push fast-forward sulla branch Pages; mai force-push.
