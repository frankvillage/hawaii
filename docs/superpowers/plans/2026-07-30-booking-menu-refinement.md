# Booking and Menu Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere automatiche e interne le prenotazioni ristorante, contestualizzare WhatsApp, indirizzare il Padel alla pagina Sport e ordinare i menu con le rispettive carte vini.

**Architecture:** La configurazione prenotazioni resta centralizzata in `booking-config.ts`; il componente condiviso gestisce entrambi i ristoranti. I dati della carta MUULab vivono in un modulo dedicato, mentre `menu/page.tsx` associa ogni carta vini al relativo ristorante.

**Tech Stack:** Next.js App Router, React, TypeScript, Playwright, Node assert.

---

### Task 1: Contratti di regressione

**Files:**
- Modify: `tests/booking-config.test.mjs`
- Modify: `tests/web-booking.js`
- Modify: `tests/web-static.js`
- Modify: `tests/web-smoke.js`

- [ ] Aggiungere test per messaggi WhatsApp contestuali, assenza dei link diretti a TheFork, percorso interno Padel, ordine menu e assenza degli sfizi.
- [ ] Verificare per Hawaii e MUULab che il calendario sia assente prima del consenso e venga caricato automaticamente subito dopo il consenso generale, senza un secondo pulsante.
- [ ] Eseguire i test interessati e verificare che falliscano per i comportamenti mancanti.

### Task 2: Prenotazioni e WhatsApp

**Files:**
- Modify: `web/src/lib/booking-config.ts`
- Modify: `web/src/components/booking/thefork-booking.tsx`
- Modify: `web/src/app/prenotazioni/page.tsx`
- Modify: `web/src/app/prenotazioni/ristorante/page.tsx`
- Modify: `web/src/app/prenotazioni/muulab/page.tsx`
- Modify: `web/src/lib/site-content.ts`

- [ ] Aggiungere un builder centrale per URL WhatsApp con messaggio.
- [ ] Assegnare messaggi specifici a Hawaii, MUULab, Padel, eventi e feste private.
- [ ] Rimuovere collegamento e copy TheFork visibili dalle pagine ristorante.
- [ ] Conservare il caricamento automatico del calendario incorporato per entrambe le venue dopo il consenso generale.
- [ ] Sostituire `Prenota sport` con `Prenota padel` e destinazione `/sport`.
- [ ] Eseguire i test prenotazioni e portarli a verde.

### Task 3: Menu e carte vini

**Files:**
- Create: `web/src/lib/muulab-wines.ts`
- Modify: `web/src/lib/site-content.ts`
- Modify: `web/src/app/menu/page.tsx`

- [ ] Trascrivere la carta vini ufficiale MUULab in sezioni strutturate.
- [ ] Eliminare integralmente la categoria Hawaii `Gli sfizi, prima della pizza`.
- [ ] Renderizzare carta Hawaii subito dopo menu Hawaii.
- [ ] Renderizzare carta MUULab subito dopo menu MUULab.
- [ ] Assegnare ancore distinte e aggiornare gli highlight.
- [ ] Eseguire test statici e smoke e portarli a verde.

### Task 4: Verifica e commit

**Files:**
- Verify all modified files.

- [ ] Eseguire TypeScript senza emissione.
- [ ] Eseguire lint senza warning.
- [ ] Rigenerare `pages-preview`.
- [ ] Eseguire la suite browser production a risorse limitate.
- [ ] Verificare `git diff --check`.
- [ ] Eseguire code review indipendente.
- [ ] Creare un commit dedicato e reversibile.
