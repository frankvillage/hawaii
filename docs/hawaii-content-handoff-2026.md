# Hawaii Pescara — Content Handoff

Documento operativo per aggiornare il sito con i contenuti reali senza modificare la struttura.

## Dove aggiornare i contenuti principali

- `web/src/lib/site-content.ts`
  Qui vivono:
  - hero homepage
  - dati della homepage scroll-driven in `homeJourney`
  - scene, timing, hotspot e CTA del video narrativo
  - capitoli narrativi storici/di supporto
  - contenuti delle landing
  - sezioni menu
  - format eventi
  - FAQ
  - blocchi legali placeholder

- `web/src/lib/seo.ts`
  Qui vivono:
  - metadata base
  - structured data globali
  - structured data delle landing entity-led
  - schema FAQ

## Cosa sostituire appena arrivano i contenuti reali

- `siteMeta`
  - contatti definitivi
  - eventuali link social aggiornati
  - indirizzo e riferimenti mappa se necessari

- `homeHero`
  - headline finale
  - summary finale
  - CTA definitive

- `homeJourney`
  - sorgente video definitiva
  - poster frame definitivo
  - durata video
  - range `start` / `end` di ogni scena
  - hotspot con coordinate coerenti con i frame reali
  - microcopy breve di ogni momento della giornata

- `chapters`
  - mantenere solo se usati da pagine o blocchi secondari
  - non considerarli la sorgente primaria della homepage immersiva

- `pages`
  - contenuti delle landing `Beach`, `Ristorante Mare`, `Terrazza`, `Sport`, `Eventi`, `Feste Private`
  - bullets di servizi effettivi
  - FAQ validate

- `menuSections`
  - categorie reali di menu
  - piatti, signature, sezioni beverage
  - CTA specifiche se cambiano i flussi

- `eventFormats`
  - nomi ufficiali dei format
  - cadenza reale
  - testi brevi per tavoli, sunset, dj set e special date

- `legalSections`
  - testi validati da consulente privacy e cookie

## File di layout da non toccare salvo redesign

- `web/src/components/home/narrative-homepage.tsx`
- `web/src/components/home/scroll-video-stage.tsx`
- `web/src/components/home/soul-rail.tsx`
- `web/src/components/chrome/site-header.tsx`
- `web/src/components/chrome/site-footer.tsx`
- `web/src/components/pages/entity-page.tsx`

Questi file contengono la struttura UI. In condizioni normali basta aggiornare i dati nel content layer. Toccare `scroll-video-stage.tsx` solo se cambia il comportamento dello scrub, degli hotspot o del fallback motion.

## File dei form

- `web/src/components/forms/booking-inquiry-form.tsx`
- `web/src/components/forms/contact-form.tsx`
- `web/src/components/forms/private-event-form.tsx`

Aggiornare solo se cambiano:
- campi richiesti
- etichette
- percorso API o CRM

## API locali attuali

- `web/src/app/api/booking-inquiry/route.ts`
- `web/src/app/api/contact/route.ts`
- `web/src/app/api/private-events/route.ts`

Attualmente validano payload, honeypot e rate limit minimo. Sono una base pronta, ma prima del rilascio vanno collegate al sistema reale di recapito lead.

## Verifiche da eseguire dopo ogni aggiornamento contenuti

- `npm --prefix web run lint`
- `npm --prefix web run build`
- `npm run test:web:smoke`

## Stato della struttura

La piattaforma e gia impostata per:
- homepage immersiva con video controllato dallo scroll
- landing SEO-first
- menu strutturato
- eventi e nightlife
- FAQ indicizzabili
- form di contatto e prenotazione
- privacy e cookie layer

Da qui in avanti il lavoro principale e di sostituzione contenuti, media e integrazioni finali.
