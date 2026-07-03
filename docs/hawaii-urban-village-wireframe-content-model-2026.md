# Hawaii Pescara — Urban Village

Wireframe testuale + content model operativo

Documento firmato da `the.o`
Per il cliente `Comunica Group`
Data: `2026-04-07`

## 1. Obiettivo del documento

Questo documento traduce il masterplan in tre artefatti eseguibili:
- wireframe testuale della piattaforma
- modello contenuti per CMS
- regole di popolamento, relazione e riuso dei contenuti

La logica è questa:
- la homepage racconta
- le landing spiegano e convertono
- il CMS deve governare entrambe senza duplicazioni inutili

## 2. Wireframe della homepage

### 2.1 Header globale

Elementi:
- logotipo Hawaii
- payoff `Urban Village`
- nav leggera
- CTA primaria `Prenota`
- eventuale toggle menu mobile

Comportamento:
- overlay trasparente all’inizio
- si compatta durante lo scroll
- resta sempre leggibile

Voci consigliate:
- Beach
- Ristorante Mare
- Terrazza
- Sport
- Eventi
- Prenota

Regole:
- niente megamenu complesso
- niente doppia CTA
- su mobile la CTA `Prenota` resta visibile anche nel menu chiuso

### 2.2 Hero alba

Scopo:
- introdurre Hawaii come luogo in trasformazione
- definire il tono premium
- offrire subito l’accesso alla scoperta o alla prenotazione

Contenuto:
- headline: 1 riga o 2 molto corte
- microlinea di posizionamento
- CTA `Scopri Hawaii`
- CTA secondaria `Prenota`

Visual:
- fronte mare
- alba
- luce calma

Elementi opzionali:
- progress marker minimo
- etichetta daypart `Alba`

### 2.3 Chapter 01 — Beach

Scopo:
- mostrare il luogo quando è spazio, luce e comfort

Blocchi:
- visual full-bleed
- titolo `Beach`
- microcopy di una riga
- hotspot `Prenota spiaggia`
- hotspot `Servizi`

Contenuti da visualizzare:
- ampiezza spiaggia
- palme/ombrelloni
- qualità del contesto

### 2.4 Chapter 02 — Morning / bar

Scopo:
- segnare l’attivazione dello spazio
- introdurre il lato ospitale e sociale

Blocchi:
- visual bar/colazione
- titolo breve
- microlinea
- CTA `Scopri il bar`

Hotspot:
- colazione
- aperitivo
- cocktail bar

### 2.5 Chapter 03 — Sport

Scopo:
- rendere credibile la promessa “Urban Village”

Blocchi:
- visual padel/campo
- visual crossfit outdoor
- titolo `Sport`
- CTA `Scopri sport`

Hotspot:
- padel
- crossfit
- prenotazione

Regola:
- deve essere percepito come parte naturale della giornata, non come sezione aliena

### 2.6 Chapter 04 — Lunch / fish

Scopo:
- posizionare il piano terra come luogo del pranzo e della cena di pesce

Blocchi:
- visual preparazione sala
- visual cucina
- visual piatto signature
- titolo `Ristorante Mare`
- CTA `Prenota un tavolo`
- CTA secondaria `Scopri il menu`

Hotspot:
- menu mare
- carta vini
- cocktail bar

### 2.7 Chapter 05 — Transition

Scopo:
- cambiare atmosfera senza interrompere il racconto

Blocchi:
- visual scale/cambio luce
- titolo minimo o nessun titolo
- microfrase di transizione

Regole:
- poco testo
- più atmosfera
- funzione narrativa, non commerciale

### 2.8 Chapter 06 — Sunset terrace

Scopo:
- mostrare il passaggio al premium social

Blocchi:
- terrazza al tramonto
- titolo `Terrazza`
- microcopy
- CTA `Scopri la terrazza`

Hotspot:
- aperitivo
- sunset
- menu terrazza

### 2.9 Chapter 07 — Dinner terrace / brace

Scopo:
- distinguere chiaramente la terrazza serale dalla sala mare

Blocchi:
- brace
- cucina a vista
- tavolo serale
- titolo `MUULab Riviera`
- CTA `Prenota in terrazza`
- CTA secondaria `Scopri il menu`

Hotspot:
- carni alla brace
- cucina creativa
- vista mare

### 2.10 Chapter 08 — Events / nightlife

Scopo:
- chiudere la giornata con energia e programmazione

Blocchi:
- visual dj set / evento
- titolo `Eventi & Nightlife`
- CTA `Scopri gli eventi`
- CTA secondaria `Feste private`

Hotspot:
- calendario
- tavoli
- feste private

### 2.11 Chapter 09 — Loop to dawn

Scopo:
- chiudere il racconto e riaprirlo

Blocchi:
- visual notturno che si dissolve nell’alba
- microcopy finale
- CTA persistenti

Elementi:
- `Prenota`
- `Scopri le aree`

Regola:
- chiusura morbida, mai “fine pagina” teatrale

### 2.12 Footer strategico

Contenuto:
- contatti
- mappa
- social
- orari
- hub prenotazioni
- privacy/cookie

Funzione:
- conversione e fiducia

## 3. Wireframe pagine satellite

### 3.1 Beach page

Struttura:
- hero visivo
- overview servizi
- layout/comfort
- gallery
- FAQ beach
- CTA prenotazione

### 3.2 Ristorante Mare page

Struttura:
- hero
- posizionamento
- esperienza pranzo/cena
- piatti / menu teaser
- cocktail bar
- carta vini
- FAQ
- CTA tavolo

### 3.3 Terrazza MUULab Riviera page

Struttura:
- hero sunset
- promise della terrazza
- cucina creativa / brace
- menu teaser
- momenti della sera
- FAQ
- CTA tavolo terrazza

### 3.4 Sport page

Struttura:
- hero
- padel
- crossfit outdoor
- corsi / partner / app prenotazione
- FAQ
- CTA sport

### 3.5 Eventi page

Struttura:
- hero
- calendario
- format ricorrenti
- eventi speciali
- gallery
- CTA eventi
- CTA feste private

### 3.6 Feste Private page

Struttura:
- hero
- tipi evento
- spazi disponibili
- servizi inclusi
- gallery
- FAQ
- form qualificato

### 3.7 Prenotazioni page

Struttura:
- scelta rapida
- beach
- tavolo mare
- tavolo terrazza
- sport
- eventi privati

Regola:
- ridurre al minimo il carico cognitivo

## 4. Content model CMS

### 4.1 Site settings

Campi:
- site_title
- payoff
- primary_phone_restaurant
- primary_phone_beach
- main_email
- address
- geo_coordinates
- social_links
- legal_company_name
- vat_number
- opening_hours_global
- analytics_ids
- consent_text_version

Ruolo:
- contenitore unico per informazioni globali e SEO base

### 4.2 Global navigation

Campi:
- label
- target_type
- target_reference
- order
- is_primary
- mobile_label

Ruolo:
- governare header, footer e quick links

### 4.3 Homepage

Campi:
- hero_headline
- hero_subheadline
- hero_cta_primary
- hero_cta_secondary
- chapter_sequence
- fallback_poster
- seo_title
- seo_description
- og_image

Ruolo:
- composizione editoriale della homepage

### 4.4 Narrative chapter

Campi:
- internal_name
- slug
- daypart
- soul_type
- title
- subtitle
- body_short
- primary_cta_label
- primary_cta_target
- secondary_cta_label
- secondary_cta_target
- hero_image_desktop
- hero_image_mobile
- video_clip_desktop
- video_clip_mobile
- poster_frame
- ambient_color_start
- ambient_color_end
- motion_preset
- hotspot_items
- related_pages
- is_loop_connector

Ruolo:
- unità narrativa base per la homepage

Enumerazioni consigliate:
- daypart: dawn, morning, noon, afternoon, sunset, evening, night, reset
- soul_type: beach, restaurant, sport, nightlife, transition
- motion_preset: calm, glide, reveal, glow, pulse-low

### 4.5 Page

Campi:
- page_type
- slug
- nav_label
- h1
- hero_kicker
- hero_copy
- hero_media
- modular_sections
- primary_cta
- secondary_cta
- faq_items
- seo_fields
- schema_type
- related_pages
- status

Page type consigliati:
- beach
- restaurant
- terrace
- sport
- events
- private-events
- bookings
- menu
- faq
- contact

### 4.6 Menu

Campi:
- menu_type
- title
- short_description
- availability
- downloadable_pdf
- sections
- seo_fields

Menu type:
- restaurant-mare
- terrace
- cocktail
- wine-list

### 4.7 Menu section

Campi:
- title
- description
- order
- items

### 4.8 Menu item

Campi:
- name
- description
- price
- category
- dietary_flags
- image
- featured

### 4.9 Event

Campi:
- title
- slug
- event_type
- summary
- long_description
- start_datetime
- end_datetime
- recurring_rule
- location_reference
- hero_image
- gallery
- booking_link
- price_info
- artist_or_format
- seo_fields
- is_featured

Event type:
- sunset
- dj-set
- dinner-format
- special-night
- private

### 4.10 Sport offering

Campi:
- title
- slug
- sport_type
- summary
- description
- booking_link
- partner_name
- schedule_notes
- hero_image
- gallery
- faq_items
- seo_fields

Sport type:
- padel
- crossfit
- yoga
- training

### 4.11 FAQ item

Campi:
- question
- answer
- category
- applicable_pages
- order

Categorie consigliate:
- beach
- restaurant
- terrace
- sport
- events
- private-events
- general

### 4.12 CTA object

Campi:
- label
- target_type
- url_or_reference
- tracking_name
- style

Style:
- primary
- secondary
- quiet
- inline

### 4.13 Media asset

Campi:
- asset_title
- asset_type
- alt_text
- caption
- credit
- focal_point
- mobile_crop_safe
- desktop_crop_safe
- dominant_tone
- rights_status
- related_entities

Asset type:
- image
- video
- poster

### 4.14 SEO fields

Campi:
- seo_title
- seo_description
- canonical_url
- og_title
- og_description
- og_image
- noindex
- schema_overrides

## 5. Relazioni tra contenuti

Relazioni chiave:
- Homepage contiene Narrative Chapter
- Narrative Chapter punta a Page, Menu, Event, Sport Offering
- Page contiene modular sections, FAQ e CTA object
- Event e Sport Offering vivono sia come landing autonome sia come target dei capitoli
- Menu vive come contenuto indipendente e come reference da pagine food

Regola:
- nessun testo di servizio critico deve vivere solo nei capitoli home
- ogni entità importante deve avere una sua pagina indicizzabile

## 6. Modular sections per landing

Tipologie consigliate:
- hero_media
- intro_copy
- proof_points
- gallery_strip
- menu_teaser
- schedule_block
- faq_block
- booking_block
- contact_block
- event_list
- testimonial_quote
- dual_story_block
- map_block

Regola:
- massimo 6-7 moduli per pagina
- ogni modulo ha una sola responsabilità

## 7. Content rules

### Regole di copy

- headline brevi
- no tono da agenzia
- no spiegazioni del design
- tono caldo, raffinato, concreto

### Regole di SEO copy

- H1 chiaro e umano
- sottotitoli utili
- FAQ scritte in lingua naturale
- servizi esplicitati in HTML

### Regole media

- ogni pagina ha un hero forte
- ogni chapter ha poster image
- ogni media ha alt text reale

## 8. Priorità implementative sul content model

Must-have:
- site settings
- homepage
- narrative chapter
- page
- menu
- event
- sport offering
- faq item
- seo fields

Should-have:
- CTA object separato
- modular sections evolute
- related entities strutturate

Nice-to-have:
- sistemi editoriali di stagionalità e programmazione automatica

## 9. Dati da validare prima della modellazione definitiva

- se esistono più numeri/booking flow per area
- se MUULab deve restare entità autonoma o figlia di Hawaii
- se pizza va modellata come asse forte o secondario
- se esistono corsi sport ricorrenti da gestire come calendario
- se gli eventi hanno ticketing o solo booking tavolo
- se il cliente vuole multilingua già nel primo rilascio
