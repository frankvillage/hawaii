# Final Content And Safari Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correggere Safari/tablet, aggiornare Villaggio, Menu ed Eventi secondo le annotazioni approvate e pubblicare un artifact Pages verificato.

**Architecture:** Le correzioni restano nei componenti e nei dati esistenti. Il video conserva il controller dual-layer ma perde ogni transform CSS; menu ed eventi continuano a derivare da `site-content.ts`, con anchor esplicite e link esterni sicuri. I test statici bloccano regressioni di copy e struttura, mentre un test browser dedicato verifica i controlli tablet.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node assert, Playwright Chromium/WebKit, GitHub Actions Pages.

---

### Task 1: Regressioni contenuto e struttura

**Files:**
- Modify: `tests/web-static.js`
- Modify: `tests/web-smoke.js`
- Create: `tests/tablet-interface-controls.js`
- Modify: `tests/run-web-production.js`

- [ ] Aggiungere assertion negative per `Fritti al cono`, `Special panini`, sandwich, hot dog, bao, `Il Giovedi in terrazza`, champagne/crudi e CTA terrazza.
- [ ] Aggiungere assertion per ordine delle cinque card Villaggio, link `/terrazza` e span della sola card Eventi.
- [ ] Aggiungere assertion per quattro anchor univoche, link PDF MUULab e carta vini Hawaii interna.
- [ ] Scrivere il test tablet 768x1024 e 1024x768: CTA primaria navigabile, popup menu apribile e Soul Rail funzionante negli stati iniziale, moving e settled.
- [ ] Eseguire i test e confermare il RED sui contenuti e sugli stili correnti.

### Task 2: Stabilita Safari e input tablet

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/home/scroll-video-stage.tsx`

- [ ] Separare gli stili `video` dagli stili `img`: entrambi i video devono avere `transform:none`, `object-position:center` e transizione limitata all'opacita.
- [ ] Conservare parallax/scale soltanto sul poster e sulle immagini statiche.
- [ ] Portare copy e controlli interattivi sopra hotspot/video con stacking esplicito e `touch-action:pan-y`.
- [ ] Fare in modo che il priming touch del video non impedisca i click originati su link e button.
- [ ] Eseguire lint, TypeScript, unit test journey e build.
- [ ] Commit: `Stabilize Safari video crop and tablet controls`.

### Task 3: Villaggio, Menu ed Eventi

**Files:**
- Modify: `web/src/app/villaggio/page.tsx`
- Modify: `web/src/app/menu/page.tsx`
- Modify: `web/src/lib/site-content.ts`
- Modify: eventuali pagine individuate dal controllo negativo in `web/src`

- [ ] Inserire la card MUULab prima di Nightlife; rendere soltanto Nightlife `sm:col-span-2`.
- [ ] Aggiornare titoli e copy Villaggio a cinque anime e pesce a pranzo e cena.
- [ ] Eliminare panini/fritti e relativi copy da tutte le sorgenti.
- [ ] Rendere le quattro card Menu anchor link accessibili.
- [ ] Aggiungere `#cocktail`, la sezione `#carta-vini` Hawaii con i vini pubblicati sul sito esistente e il pulsante interno nella card bevande.
- [ ] Aggiungere `Menu MUULab completo` con il PDF ufficiale accanto a `Prenota MUULab`.
- [ ] Sostituire ovunque il vecchio giovedi con `Giovedi Posh`, senza orario e con CTA WhatsApp.
- [ ] Eseguire test statici, booking, journey, lint, TypeScript e build.
- [ ] Commit: `Update village menus and recurring events`.

### Task 4: Valutazione back office

**Files:**
- Create: `docs/backoffice-menu-evaluation.md`

- [ ] Documentare l'opzione consigliata Decap CMS Git-backed, prerequisiti e dipendenze.
- [ ] Specificare che questo rilascio non modifica runtime, workflow, autenticazione o deploy.
- [ ] Commit: `Document lightweight menu back office`.

### Task 5: Verifica e pubblicazione

**Files:**
- No source changes expected.

- [ ] Eseguire `npm run test:web:journey`.
- [ ] Eseguire `npm run test:web:booking`.
- [ ] Eseguire `npm run test:web:static`.
- [ ] Eseguire `./web/node_modules/.bin/tsc --noEmit -p web/tsconfig.json`.
- [ ] Eseguire `npm --prefix web run lint -- --max-warnings=0`.
- [ ] Eseguire `npm run build:web:aruba`.
- [ ] Eseguire il test browser sul Pages artifact quando consentito; non sostituire il controllo fisico Safari.
- [ ] Eseguire `git fetch origin` e verificare che `origin/claude/codex-handoff-assets-se8fjq` sia antenata di `HEAD`.
- [ ] Push fast-forward `HEAD:claude/codex-handoff-assets-se8fjq`.
- [ ] Controllare workflow Pages, commit pubblicato e URL pubblico.
- [ ] Richiedere conferma crop/zoom su Safari desktop fisico; in caso di blocker pubblicare un commit di revert del range post-remote pre-release.
