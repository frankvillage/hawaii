# Booking Hub Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separare Food, Beach & Sport ed Eventi nella pagina prenotazioni e semplificare le CTA dei ristoranti.

**Architecture:** Sostituire l'elenco piatto con gruppi dati tipizzati renderizzati dalla stessa pagina. Conservare i componenti e i percorsi esistenti, limitando il cambiamento a presentazione e copy.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node assert, Playwright.

---

### Task 1: Regressione della gerarchia

**Files:**
- Modify: `tests/web-static.js`
- Modify: `tests/web-booking.js`

- [ ] Aggiornare le aspettative delle CTA in `Prenota Hawaii` e `Prenota MUULab`.
- [ ] Verificare l'ordine completo `Food`, `Beach & Sport`, `Eventi privati` e le rispettive destinazioni: Hawaii/MUULab, palma/padel, eventi/feste.
- [ ] Verificare che tutti gli URL interni ed esterni restino invariati.
- [ ] Eseguire i test e confermare che falliscano sul markup corrente.

### Task 2: Gruppi della pagina prenotazioni

**Files:**
- Modify: `web/src/app/prenotazioni/page.tsx`
- Modify: `web/src/lib/site-content.ts`

- [ ] Suddividere le destinazioni in `Food`, `Beach & Sport` ed `Eventi privati`.
- [ ] Renderizzare titoli e griglie responsive senza cambiare href o comportamento esterno.
- [ ] Rimuovere `su TheFork` dalle CTA promozionali del sito, lasciando il fornitore esplicito nel consenso e nel modulo.

### Task 3: Verifica e preparazione alla pubblicazione

**Files:**
- Verify only: source and generated Pages artifact.

- [ ] Eseguire booking test, static test, TypeScript, lint e build.
- [ ] Eseguire il browser smoke test sull'artefatto Pages.
- [ ] Creare un commit locale reversibile.
- [ ] Richiedere conferma esplicita prima di pushare sul branch Pages e verificare GitHub Actions.
