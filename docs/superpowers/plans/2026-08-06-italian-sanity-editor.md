# Italian Sanity Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tradurre lo Studio Sanity in italiano e separare chiaramente Hawaii Ristorante da MUULab Riviera senza modificare i dati.

**Architecture:** Il locale ufficiale traduce l'interfaccia nativa; struttura e schema forniscono microcopy italiana specifica. Il campo tecnico `venue` resta validato ma invisibile e non modificabile.

**Tech Stack:** Sanity Studio 6, TypeScript, `@sanity/locale-it-it`, test statici Node.

---

### Task 1: Contratto UX Italiano

**Files:**
- Modify: `tests/web-static.js`

- [ ] Aggiungere test per locale italiano, esattamente due item root, mapping document ID, etichette italiane, `venue` nascosto/read-only e assenza delle azioni `delete`, `duplicate`, `unpublish`.
- [ ] Eseguire `npm run test:web:static` e osservare il fallimento atteso.

### Task 2: Navigazione E Schema

**Files:**
- Modify: `studio/structure.ts`
- Modify: `studio/schemaTypes/menuType.ts`
- Modify: `studio/sanity.config.ts`
- Modify: `studio/package.json`
- Modify: `studio/package-lock.json`
- Create: `studio/tsconfig.json`
- Create: `studio/scripts/snapshot-menu-identity.ts`

- [ ] Installare il plugin ufficiale italiano.
- [ ] Separare i due locali nella navigazione con titoli e descrizioni inequivocabili.
- [ ] Mostrare esattamente due elementi root e verificare i mapping `menu-hawaii` e `menu-muulab`.
- [ ] Tradurre campi, descrizioni, anteprime e validazioni.
- [ ] Nascondere e rendere read-only `venue` mantenendo la validazione esistente.
- [ ] Escludere le azioni `duplicate`, `delete` e `unpublish` per i singleton.
- [ ] Implementare `snapshot-menu-identity.ts` con query `*[_id in ["menu-hawaii","menu-muulab","drafts.menu-hawaii","drafts.menu-muulab"]]|order(_id){_id,_rev,venue}`, client `getCliClient({apiVersion: "2026-07-31"}).withConfig({perspective: "raw"})`, verifica project `og7dym3o`/dataset `production` e output `JSON.stringify(result, null, 2)` senza log aggiuntivi.
- [ ] Aggiungere `npm run typecheck` basato su `tsc --noEmit` e una configurazione TypeScript dedicata.
- [ ] Eseguire nuovamente i test statici.

### Task 3: Verifica E Deploy Studio

**Files:**
- Modify as required by smoke findings, then repeat the complete verification loop

- [ ] Eseguire test statici, `npm run typecheck` e `npm run build` nello Studio.
- [ ] Salvare il baseline con `npx sanity exec scripts/snapshot-menu-identity.ts --with-user-token > /tmp/hawaii-sanity-menu-baseline.json`.
- [ ] Eseguire smoke locale e audit visivo di root, Hawaii e MUULab; dopo ogni correzione ripetere test statici, typecheck, build e smoke.
- [ ] Dopo conferma deploy, committare e pushare su `codex/sanity-italian-editor`, branch non incluso nei trigger Pages.
- [ ] Verificare hostname `hawaii-urban-village`, eseguire `sanity deploy` e ripetere `npx sanity exec scripts/snapshot-menu-identity.ts --with-user-token > /tmp/hawaii-sanity-menu-post.json`.
- [ ] Salvare il risultato post-deploy in `/tmp/hawaii-sanity-menu-post.json` e richiedere `cmp -s /tmp/hawaii-sanity-menu-baseline.json /tmp/hawaii-sanity-menu-post.json` con exit code 0.
- [ ] In caso di regressione, ripubblicare lo Studio dal commit `440db4c`; nessuna mutazione dataset e consentita.
