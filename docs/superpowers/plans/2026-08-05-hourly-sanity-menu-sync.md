# Hourly Sanity Menu Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pubblicare automaticamente su GitHub Pages i menu Sanity modificati, con controllo orario e build solo in presenza di nuove revisioni.

**Architecture:** Il workflow confronta le revisioni Sanity pubblicate con un marcatore della release online. Il generatore di release crea il marcatore dalla snapshot gia validata e il job di build viene saltato quando non esistono differenze.

**Tech Stack:** GitHub Actions, Node.js 22, Sanity Content Lake, Next.js static export, test Node `assert`.

---

### Task 1: Contratto del marcatore di release

**Files:**
- Modify: `tests/web-static.js`
- Modify: `scripts/verified-menu-release.mjs`

- [ ] Scrivere un test che richieda un comando `marker`, i due ID previsti e solo le revisioni validate.
- [ ] Eseguire `npm run test:web:static` e osservare il fallimento per comando mancante.
- [ ] Implementare la generazione atomica di `menu-release.json` dalla snapshot, con modalita normale e sospesa per rollback.
- [ ] Eseguire `npm run test:web:static` e verificare il passaggio.

### Task 2: Gate orario nello workflow

**Files:**
- Modify: `tests/web-static.js`
- Create: `tests/menu-sync-check.js`
- Create: `scripts/check-menu-sync.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-pages.yml`

- [ ] Scrivere test funzionali per revisioni uguali/diverse, marker assente/irraggiungibile/malformato/sospeso/fuori timeout/oltre 32 KiB, proprietà aggiuntive e Sanity parziale/non valido.
- [ ] Collegare i test al comando `npm run test:menu-sync` e alla verifica del workflow.
- [ ] Scrivere asserzioni per cron orario, gruppi di concorrenza separati, arbitraggio dei run, query `published`, revisione fail-closed e sospensione rollback.
- [ ] Eseguire `npm run test:menu-sync` e `npm run test:web:static`, osservando i fallimenti attesi.
- [ ] Implementare un checker isolato con timeout, limite risposta e schema esatto `schemaVersion`, `syncSuspended`, `documentRevisions` senza proprietà aggiuntive.
- [ ] Aggiungere il controllo schedulato nel workflow Pages e propagare la revisione soltanto quando le revisioni differiscono.
- [ ] Generare il marcatore direttamente in `web/out` dopo la build; sovrascriverlo come sospeso nei rollback.
- [ ] Separare i gruppi di concorrenza e aggiungere un arbitraggio pre-deploy che dia priorità a push, avvii manuali e rollback.
- [ ] Eseguire nuovamente `npm run test:menu-sync` e `npm run test:web:static`.

### Task 3: Verifica e pubblicazione

**Files:**
- Verify only

- [ ] Eseguire `npm run test:web:static`.
- [ ] Eseguire `npm run test:menu-sync`.
- [ ] Eseguire test, lint e typecheck del progetto.
- [ ] Eseguire una build statica con snapshot Sanity.
- [ ] Revisionare il diff e controllare che non contenga segreti.
- [ ] Committare e inviare sul branch Pages.
- [ ] Verificare il workflow e la presenza online di `menu-release.json`.
