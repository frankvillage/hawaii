# Hawaii Pescara — Urban Village

Documento strategico firmato da `the.o`
Per il cliente `Comunica Group`
Data: `2026-04-07`

## A. Executive summary

Hawaii va progettato come una piattaforma editoriale-immersiva, non come un sito vetrina a blocchi. La homepage deve raccontare la trasformazione del luogo nell’arco della giornata, mentre le pagine satellite devono assorbire il traffico ad alta intenzione: prenotazione spiaggia, prenotazione tavolo, menu, sport, eventi, feste private.

La scelta progettuale corretta non è un “vero infinite scroll” tecnico, ma un loop percettivo: l’utente sente un ciclo continuo alba → giorno → tramonto → notte → nuova alba, mentre il sito mantiene URL puliti, capitoli leggibili, performance alte e semantica solida per SEO e accessibilità.

La piattaforma deve posizionare Hawaii come un sistema coerente di esperienze sul mare:
- beach club di giorno
- ristorante di pesce al piano terra
- sport outdoor e campi da gioco
- terrazza serale MUULab Riviera con cucina creativa e brace
- aperitivi al tramonto
- nightlife ed eventi
- format privati e corporate

La raccomandazione è:
- homepage immersiva scroll-driven con capitoli cinematici e interfaccia quasi invisibile
- architettura informazioni separata per intenzione utente e per momento della giornata
- stack headless e SSR-first
- SEO entity-led, non keyword-led
- baseline security moderna allineata a OWASP Top 10:2025 e OWASP ASVS 5.0
- piano media estremamente disciplinato per evitare un sito “wow ma lento”

Must-have:
- homepage narrativa continua
- landing dedicate per beach, restaurant, terrace, sport, events, private events
- booking architecture chiara
- SSR, structured data, media optimization, security headers, consent logging

Should-have:
- micro-motion avanzato, hotspot ambientali, CMS editoriale evoluto, video object markup, event schema esteso

Nice-to-have:
- personalizzazione per fasce orarie, weather-aware hero, mini agenda real-time, playlist audio ambientale opzionale

Dati da validare in discovery:
- “Il primo punto Aperol d’Abruzzo” resta asset di brand o viene archiviato
- il piano terra mantiene pizza come offerta primaria o viene subordinata a pesce/cocktail
- MUULab Riviera resta brand autonomo o diventa “Hawaii Terrace by MUULab”
- l’area sport comprende solo padel e crossfit oppure anche altri campi/format
- l’evento disco è ricorrente, stagionale o solo per date speciali
- esiste già una piattaforma unica di prenotazione o vanno orchestrati più sistemi

## B. Brand interpretation

Hawaii non va raccontato come “uno stabilimento con extra”, ma come un villaggio urbano fronte mare che cambia identità senza perdere continuità.

Le quattro anime sono:
- Beach
- Restaurant
- Sport
- Nightlife

Queste anime non devono competere in homepage come quattro blocchi equivalenti. Devono emergere come quattro stati dello stesso luogo.

Interpretazione corretta del brand:
- di mattina è respiro, luce, spazio, energia fisica
- a pranzo è ospitalità, pesce, rituale conviviale
- al tramonto è socialità, cocktail, transizione
- di sera è upgrade, terrazza, brace, atmosfera
- di notte è ritmo, evento, appartenenza

Il payoff “Urban Village” funziona se il sito fa percepire:
- prossimità tra funzioni diverse
- varietà di utilizzi nello stesso luogo
- passaggio naturale da un momento all’altro
- esclusività senza rigidità

Rischio da evitare:
- un linguaggio troppo “resort tropicale” o troppo “discoteca”
- un sito che mette tutto sullo stesso piano e perde gerarchia
- una narrazione troppo notturna che impoverisce beach e sport

## C. Strategic concept

### Positioning statement

Hawaii è l’urban village sul mare di Pescara: un luogo che accompagna l’ospite dall’alba alla notte tra beach club, cucina, sport, terrazza ed eventi, con un’esperienza continua, raffinata e sempre viva.

### Value proposition

Un solo luogo, più ritmi, più motivi per tornarci nella stessa giornata: spiaggia, tavolo, allenamento, tramonto, cena, notte.

### Big idea di prodotto

Il sito non presenta aree. Mette in scena trasformazioni.

La homepage deve far dire all’utente:
- “ho capito subito che posto è”
- “so dove andare per quello che cerco”
- “voglio vedere come cambia durante il giorno”

### Tesi strategica

Il progetto deve unire due modelli:
- modello esperienziale per la homepage
- modello utilitario ad alta intenzione per le landing satellite

Questo evita il problema classico dei siti immersivi:
- wow iniziale alto
- conversione bassa
- indicizzazione debole
- contenuti pratici introvabili

### Architettura di valore

Hawaii vende sei cose diverse ma contigue:
- posto fisico
- tempo di qualità
- prenotazione
- rituale food
- rituale social
- format evento

La piattaforma deve quindi lavorare su tre livelli contemporaneamente:
- brand narrative
- discovery delle aree
- conversione rapida

Must-have:
- home come manifesto dinamico
- landing come pagine da motore di ricerca e da campagne
- chiarezza netta tra ristorante mare e terrazza brace

Should-have:
- linguaggio editoriale coerente su tutti i touchpoint
- mini ecosystem “giornata ideale” cross-linkato

Nice-to-have:
- programmazione stagionale dinamica visibile per slot orari

## D. User experience vision

### Visione generale

L’esperienza deve sembrare fluida, cinematica e inevitabile. Non deve sembrare una serie di sezioni WordPress decorate.

L’utente entra in una scena e non in un layout.

### Modello UX

La homepage ha tre responsabilità:
- posizionare il brand
- orientare senza interrompere il racconto
- distribuire traffico verso le pagine ad alta intenzione

Le pagine satellite hanno invece responsabilità specifiche:
- convincere
- dettagliare
- convertire

### Principi UX

- niente overlay descrittivi pesanti
- niente testo che spiega il design
- ogni scena ha un gesto dominante
- ogni scena ha una CTA primaria e al massimo una secondaria
- la navigazione resta sempre disponibile ma mai dominante
- il contenuto utile deve essere accessibile senza “capire” il concept

### Comportamento mobile-first

Su mobile il sito deve sembrare ancora migliore che su desktop:
- più verticale
- più ritmico
- più essenziale
- con CTA sempre a portata di pollice

Su desktop si può aggiungere profondità:
- parallax più ricco
- tilt 3D lieve
- layering fotografico
- hotspot più ambientali

Must-have:
- mobile first reale
- navigazione leggera persistente
- CTA sticky discreta

Should-have:
- quick-jump per anime o per momenti della giornata

Nice-to-have:
- switching automatico hero/daypart in base all’orario locale

## E. Information architecture

### Architettura top-level consigliata

- Home
- Beach
- Ristorante Mare
- Terrazza MUULab Riviera
- Sport
- Eventi & Nightlife
- Feste Private
- Menu
- Prenotazioni
- Contatti
- FAQ
- Privacy / Cookie / Termini

### Home

Ruolo:
- manifesto del brand
- esperienza immersiva
- snodo verso tutte le aree

### Beach

Ruolo:
- pagina commerciale per stabilimento
- servizi, layout, prenotazione ombrelloni/palme, atmosfera giorno

Contenuti:
- servizi inclusi
- fascia oraria
- comfort
- gallery
- CTA spiaggia

### Ristorante Mare

Ruolo:
- pagina del piano terra
- focus su pesce, pranzo e cena, à la carte, eventuale pizza, cocktail bar

Contenuti:
- posizionamento
- menu teaser
- piatti signature
- pairing
- orari
- CTA tavolo

### Terrazza MUULab Riviera

Ruolo:
- pagina premium serale
- vista mare, cucina creativa, brace, carne, cucina a vista, sunset

Contenuti:
- brand tone più scuro e sofisticato
- esperienza sunset-to-dinner
- menu teaser
- CTA terrazza

### Sport

Ruolo:
- pagina utility + aspirazionale
- padel, crossfit outdoor, campi, corsi, prenotazione

Contenuti:
- padel
- crossfit
- campi e allenamento
- calendario o partner tecnici
- CTA sport

### Eventi & Nightlife

Ruolo:
- hub eventi
- format ricorrenti
- dj set
- tramonto
- disco dopo cena

Contenuti:
- calendario
- pagine evento
- gallery/video
- CTA eventi

### Feste Private

Ruolo:
- landing conversione B2B/B2C
- compleanni, matrimoni informali, brand event, cene aziendali

Contenuti:
- tipologie evento
- capienze
- spazi
- servizi
- form qualificato

### Menu

Ruolo:
- hub chiaro con due ingressi
- ristorante mare
- terrazza/braceria
- cocktail
- vini

### Prenotazioni

Ruolo:
- page hub per scelta rapida
- spiaggia
- tavolo piano terra
- tavolo terrazza
- sport
- eventi privati

### FAQ

Ruolo:
- risposta a dubbi operativi
- macchina SEO/AI

Contenuti:
- parcheggio
- orari
- dress code se esiste
- accessibilità
- policy prenotazioni
- animali
- maltempo

Must-have:
- separazione netta fra Beach, Ristorante Mare, Terrazza, Sport, Eventi, Private Events
- hub Prenotazioni
- hub Menu

Should-have:
- pagine evento individuali
- FAQ per area

Nice-to-have:
- Journal editoriale per stagionalità, chef stories, sunset rituals

## F. Scroll narrative blueprint

### Principio

La homepage deve simulare una giornata che non finisce mai. Non va realizzato un loop tecnico infinito del DOM: è più fragile, meno indicizzabile e più difficile da gestire. Va progettato un loop narrativo percettivo.

Il finale notturno deve dissolversi in una nuova alba:
- cambio di luce
- ritorno del mare
- ricomparsa del payoff
- anchor opzionale “ricomincia il giorno”

### Sequenza narrativa

#### 1. Hero alba

Funzione:
- definire immediatamente “Urban Village”
- mostrare il fronte mare come soglia

Visual:
- struttura frontale
- luce bassa
- mare quasi fermo

Copy:
- essenziale
- 1 headline
- 1 subline

CTA:
- Scopri Hawaii
- Prenota

#### 2. Beach

Funzione:
- mostrare spazio, ordine, riservatezza, qualità del giorno

Visual:
- palme/ombrelloni
- sabbia curata
- campo largo

Interazione:
- micro hotspot su servizi e prenotazione beach

#### 3. Morning / bar

Funzione:
- passaggio dal beach mood al luogo vissuto

Visual:
- bar
- caffè, colazione, primi drink
- personale che prepara

Interazione:
- reveal leggero del servizio bar

#### 4. Sport

Funzione:
- affermare che Hawaii è anche performance e benessere

Visual:
- yoga soft o warm-up
- padel
- outdoor gym / crossfit

Interazione:
- hotspot discreti su campi e allenamento

#### 5. Lunch / fish

Funzione:
- portare l’utente nella promessa culinaria diurna

Visual:
- preparazione sala
- cucina
- servizio
- piatto di pesce

Interazione:
- reveal menu mare
- carta vini
- prenota tavolo

#### 6. Transition

Funzione:
- far percepire cambio di luce e di identità

Visual:
- scale
- corridoio
- riflessi
- ombre più lunghe

Interazione:
- ridurre testo
- aumentare atmosfera

#### 7. Sunset terrace

Funzione:
- climax visivo del tramonto

Visual:
- terrazza
- golden hour
- cocktail
- brace che si prepara

Interazione:
- hotspot menu terrazza
- aperitivo
- eventi

#### 8. Dinner terrace / brace

Funzione:
- definire il premium night dining

Visual:
- carne
- brace
- cucina a vista
- tavoli più raccolti

Interazione:
- scopri menu
- prenota terrazza

#### 9. Events / nightlife

Funzione:
- trasformare la location in social destination

Visual:
- luce più bassa
- persone
- dj set
- energia

Interazione:
- calendario eventi
- tavoli
- private events

#### 10. Loop to dawn

Funzione:
- chiudere senza davvero chiudere

Visual:
- notte che sfuma
- riflessi freddi
- ritorno al fronte mare

Interazione:
- auto-suggestione di restart
- CTA sempre disponibile

Must-have:
- chiara progressione temporale
- due anime food distinte
- transizione luce come dispositivo narrativo centrale

Should-have:
- scene video brevi con freeze frame utile

Nice-to-have:
- adattamento stagionale di alcuni capitoli

## G. Interaction and motion system

### Principio generale

Il movimento non deve dimostrare tecnologia. Deve produrre atmosfera e orientamento.

### Sistema consigliato

- sticky storytelling per capitoli
- parallax leggero su tre piani
- reveal progressivi di copy e CTA
- micro-tilt 3D solo per puntatori fine
- hotspot ambientali minimali
- progress line o progress glow quasi invisibile
- color grading dinamico lungo lo scroll

### Parallax

Usarlo su:
- fondale mare/cielo
- soggetto principale
- elementi ambientali come luce, ombre, riflessi

Non usarlo su:
- testo
- CTA
- componenti utili

### Micro animazioni 3D

Consentite solo su desktop e trackpad/mouse:
- lieve rotazione del visual principale
- profondità 2-4 gradi max
- easing morbido

Da disattivare su:
- mobile
- prefers-reduced-motion
- battery saver

### Hotspot

Devono sembrare parte della scena, non marker turistici.

Formato consigliato:
- piccolo label + dot + fade in
- compare solo quando l’utente è nella fase giusta
- apre sheet leggero o inline panel contestuale

Hotspot candidati:
- prenota spiaggia
- menu mare
- carta vini
- menu terrazza
- sport
- eventi

### Reveal progressivi

Ordine consigliato dentro ogni capitolo:
- titolo
- microline
- dettaglio visuale
- CTA

Ogni reveal deve rispondere a uno scopo:
- orientare
- spiegare
- convertire

### Cambio luce

È il vero collante del sito.

Timeline cromatica:
- alba fredda e dorata
- giorno pieno e pulito
- pomeriggio sabbia e vetro
- golden hour rame e miele
- sera blu petrolio e ambra
- notte carbone, brace e accenti rame

Must-have:
- motion sobrio
- hotspot discreti
- reduced-motion completo

Should-have:
- progressione luce/grade
- pointer-reactive depth

Nice-to-have:
- light bloom ambientale su capitoli chiave

## H. Visual direction

### Palette

Base:
- blu petrolio profondo
- sabbia chiara
- avorio caldo
- grafite morbida

Accenti:
- rame
- ambra
- terracotta bruciata
- oliva molto scuro per dettagli naturali

Da evitare:
- turchesi tropicali banali
- viola artificiali
- nero puro ovunque

### Tipografia

Sistema a due famiglie:
- serif elegante e contemporanea per headline
- sans neutra e precisa per UI e dettagli

Carattere del titolo:
- alto contrasto ma non classico da luxury hotel generico
- deve reggere bene sia pesce di giorno che brace di sera

Carattere UI:
- pulito, teso, leggibile, senza personalità invadente

### Layout

Principio:
- poster, non dashboard

Scelte:
- hero full-bleed
- grandi immagini
- contenitori minimi
- massimo rispetto dello spazio negativo
- card solo dove servono davvero

### Fotografia

Fotografia da commissionare con quattro registri:
- architettura e fronte mare
- hospitality e servizio
- cibo ravvicinato ma non food-porn
- atmosfera e socialità serale

Regole:
- niente immagini rumorose dietro il testo
- niente saturazioni finte
- niente collage
- ogni chapter deve avere un key visual riconoscibile

### Motion language

Vocabolario:
- drift
- reveal
- dissolve
- rise
- glow

Non:
- bounce
- overshoot evidente
- effetti da promo nightlife anni 2010

Must-have:
- forte gerarchia fotografica
- due sole famiglie tipografiche
- palette coerente giorno/notte

Should-have:
- LUT cromatiche dedicate per i daypart

Nice-to-have:
- sonore identità visive per teaser social coordinati al sito

## I. Conversion architecture

### Obiettivo

Il sito deve convertire cinque intenzioni diverse senza confonderle:
- prenota spiaggia
- prenota tavolo piano terra
- prenota tavolo terrazza
- prenota sport
- richiedi evento privato

### Regola

Ogni capitolo narrativo deve spingere verso una sola azione primaria coerente con il momento.

### CTA principali

Prenota spiaggia:
- posizionata in hero, beach, footer persistente, pagina prenotazioni

Prenota tavolo:
- posizionata in lunch/fish, dinner terrace, header mobile, hub prenotazioni

Scopri menu:
- presente nei capitoli food
- porta a hub menu o menu specifico

Scopri sport:
- in sport chapter e pagina sport

Eventi:
- in sunset terrace e nightlife

Feste private:
- nel footer strategico, pagina dedicata, moduli contestuali

### Pattern conversione

Homepage:
- CTA discreta ma sempre disponibile
- dock mobile basso con una sola CTA primaria contestuale

Landing:
- CTA above the fold
- ripetizione a metà pagina
- chiusura con CTA + rassicurazioni pratiche

### Booking hub

La pagina Prenotazioni deve essere brutalmente semplice:
- cosa vuoi prenotare
- per quando
- con quale canale

Se i sistemi restano multipli, il sito deve orchestrare e non nascondere:
- spiaggia
- tavolo
- sport
- eventi privati

Must-have:
- CTA contestuali distinte
- hub prenotazioni centralizzato

Should-have:
- booking pre-selector per area e fascia oraria

Nice-to-have:
- pre-compilazione intelligente da capitolo visitato

## J. Technical architecture

### Framework ideale

Raccomandazione:
- Next.js App Router
- TypeScript
- React Server Components dove utili
- rendering ibrido SSR + ISR

Motivo:
- SEO forte
- gestione metadata robusta
- ottimo compromesso tra esperienzialità e performance
- routing pulito per landing entity-led

### CMS

Raccomandazione:
- headless CMS con forte gestione media e modellazione contenuti

Opzioni valide:
- Sanity come scelta primaria
- Contentful se il cliente ha già governance enterprise
- Strapi solo se serve forte autonomia self-hosted

Scelta consigliata:
- Sanity

Perché:
- ottimo authoring editoriale
- schema flessibile
- workflow adatto a menu, eventi, FAQ, gallery, pages, schedule

### Media stack

Raccomandazione:
- immagini AVIF/WebP
- video MP4/H.264 o H.265 per fallback, con varianti leggere
- poster image obbligatoria per ogni clip
- CDN media dedicato

Opzioni:
- Cloudinary
- Imgix
- Cloudflare Images

Scelta consigliata:
- Cloudinary o Cloudflare Images

### Architettura applicativa

- homepage scroll-driven
- pagine satellite SSR/ISR
- route handlers solo per form, webhook, event feeds e booking proxy
- niente logica complessa lato client se non motion e UI state

### Analytics

Raccomandazione:
- base privacy-first
- event tracking semantico

Stack ideale:
- GA4 solo dopo consenso
- oppure Plausible/Matomo per baseline
- Search Console
- server-side event logging per lead quality

Must-have:
- Next.js SSR/ISR
- headless CMS
- CDN media
- analytics privacy-aware

Should-have:
- server-side tagging leggero

Nice-to-have:
- edge personalization per daypart

## K. SEO + AI indexing strategy

### Principio

La homepage immersive serve al brand. Le landing entity-led servono a farsi trovare.

### Strategia SEO

- ogni servizio importante ha una pagina propria
- ogni pagina ha un’entità chiara
- ogni entità ha titolo, H1, description, FAQ, immagini, CTA, internal links
- il contenuto principale deve stare nell’HTML SSR, non solo in video o canvas

### Entity map da presidiare

- Hawaii Pescara
- beach club a Pescara
- ristorante pesce sul mare Pescara
- terrazza vista mare Pescara
- braceria / ristorante carne in terrazza Pescara
- aperitivo tramonto Pescara
- padel sul mare Pescara
- crossfit outdoor Pescara
- eventi in terrazza Pescara
- location feste private Pescara

### Structured data consigliati

Homepage:
- Organization
- LocalBusiness
- WebSite
- WebPage

Ristorante Mare:
- Restaurant
- Menu
- FAQPage
- BreadcrumbList

Terrazza:
- Restaurant
- Menu
- FAQPage
- ImageObject

Eventi:
- Event
- ItemList
- BreadcrumbList

Sport:
- SportsActivityLocation o LocalBusiness contestualizzato
- FAQPage

Immagini e video:
- ImageObject
- VideoObject dove il video è parte sostanziale della pagina

### Note importanti su structured data

- usare JSON-LD
- markup solo per contenuti realmente visibili e coerenti con la pagina
- niente schema “decorativo”
- FAQ markup utile per machine readability, ma non va considerato garanzia di rich result

### SEO tecnico

- SSR o pre-rendering per tutte le pagine core
- URL leggibili e permanenti
- canonical lato HTML
- sitemap XML
- image sitemap
- robots.txt rigoroso
- breadcrumbs HTML e JSON-LD
- titles e meta description unici
- og:image dedicata per ogni landing

### AI discoverability

Non esiste uno standard unico di “AI indexing”. La strategia corretta è massimizzare:
- chiarezza semantica
- entità esplicite
- contenuto utile e citabile
- dati strutturati
- FAQ e blocchi informativi stabili
- media con caption e alt text forti
- testi descrittivi in HTML

In pratica:
- ogni pagina deve rispondere a una domanda precisa
- ogni servizio deve avere un blocco facts rapido
- i video devono avere trascrizione/caption o almeno summary editoriale
- i menu non devono essere solo PDF o immagine

### Internal linking

Pattern:
- Home → tutte le entità
- Beach → aperitivo → eventi
- Ristorante Mare → carta vini → prenota tavolo → terrazza
- Terrazza → eventi → private events
- Sport → beach → morning bar
- Eventi → terrazza → booking

Must-have:
- landing dedicate
- HTML SSR completo
- schema JSON-LD
- sitemap immagini

Should-have:
- FAQ per pagina
- VideoObject dove appropriato
- blocchi “fatti utili” per AI retrieval

Nice-to-have:
- glossario/editoriale stagionale

## L. Security + compliance blueprint

### Security baseline

Obiettivo:
- sito pubblico ad alto impatto media
- poche superfici dinamiche
- massima riduzione del rischio su form, CMS, supply chain e configurazione

### Mappatura pratica a OWASP Top 10:2025

A01 Broken Access Control:
- separare pubblico, editor, admin, marketing
- ruolo editor senza permessi infrastrutturali
- CMS con RBAC reale

A02 Security Misconfiguration:
- hardening hosting
- headers corretti
- niente ambienti preview indicizzati
- niente bucket/media pubblici mal configurati

A03 Software Supply Chain Failures:
- lockfile
- dipendenze minime
- dependency scanning
- review dei pacchetti motion/media

A04 Cryptographic Failures:
- TLS end-to-end
- secret management centralizzato
- encryption at rest per lead e form submissions lato provider

A05 Injection:
- validazione server-side di tutti i form
- niente query dinamiche concatenate
- escaping output

A06 Insecure Design:
- abuse cases su booking, spam, scraping, form flooding, CMS abuse

A07 Authentication Failures:
- SSO o 2FA per CMS/admin
- passwordless o password policy forte

A08 Software or Data Integrity Failures:
- CI protetta
- deploy da branch controllati
- webhook firmati

A09 Security Logging and Alerting Failures:
- log strutturati
- alert su rate spike, form abuse, auth failures, 5xx anomalies

A10 Mishandling of Exceptional Conditions:
- timeouts, retry policy, fallback chiari
- no stack trace esposti
- degradazione elegante se CMS/media non rispondono

### ASVS 5.0 target

Raccomandazione:
- ASVS Level 1 per tutto il sito pubblico
- ASVS Level 2 per CMS, admin, lead handling, integrazioni booking e form

### Header policy

Minimo consigliato:
- Content-Security-Policy via header HTTP
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy restrittiva
- frame-ancestors via CSP per anti-clickjacking

Indicazione CSP:
- niente `unsafe-eval`
- evitare `unsafe-inline`
- script con nonce/hash
- font, immagini, media e connect limitati ai domini strettamente necessari

### WAF/CDN

Raccomandazione:
- Cloudflare davanti al sito

Uso:
- CDN
- bot protection
- rate limiting
- managed rules
- image caching

### Form security

Per ogni form:
- validazione server-side con schema
- honeypot
- rate limiting per IP e fingerprint leggero
- Turnstile o equivalente solo sui form a rischio
- sanitizzazione output in email e CRM
- no invio diretto a email in chiaro lato client

### Secret management

- nessun segreto nel client
- env separati per dev/stage/prod
- secret manager del provider o vault dedicato
- rotazione segreti e ownership chiara

### Logging e monitoring

- Sentry per error tracking
- log applicativi strutturati
- audit log per accessi CMS
- alerting su spike di form, 429, 403, 5xx

Must-have:
- CSP header vera
- RBAC CMS
- 2FA admin
- rate limiting form
- WAF/CDN

Should-have:
- dependency scanning automatico
- audit log admin
- webhook signing

Nice-to-have:
- SAST/DAST in CI
- SBOM software supply chain

### Privacy e compliance

Banner cookie:
- non invasivo ma chiarissimo
- nessun tracciatore non tecnico prima del consenso
- rifiuta facile quanto accetta
- settings granulari
- revoca sempre disponibile

Regole operative:
- no scroll come consenso
- no cookie wall
- no riproposizione aggressiva del banner
- registrazione del consenso con timestamp, versione testo, preferenze espresse

Policy pages:
- privacy policy
- cookie policy
- termini di utilizzo
- informativa eventi/feste se lead form distinti

Analytics conforme:
- analytics solo dopo consenso se non strettamente tecnici
- valutare stack privacy-first
- documentare finalità, basi giuridiche, retention e terze parti

Must-have:
- cookie banner conforme
- consent logging
- policy pages complete

Should-have:
- consent mode coerente se vengono usati strumenti Google

Nice-to-have:
- preference center persistente

## M. Performance + accessibility plan

### Performance budget

Target homepage:
- LCP mobile < 2.5s su rete 4G buona
- JS iniziale contenuto e differito
- first screen leggibile prima del caricamento dei video

Budget orientativo:
- hero poster immediato
- niente autoplay video pesanti above-the-fold senza poster
- massimo 1 scena video attiva per volta
- immagini responsive con srcset

### Media strategy

- video clip brevi
- preferire loop da 2-5 secondi
- freeze-frame finale utile
- poster obbligatoria
- lazy loading per capitoli sotto la piega
- prefetch solo del capitolo successivo

### Mobile fallback

Su device deboli:
- immagini statiche o motion ridotto
- niente tilt 3D
- niente parallax complesso
- callout semplificati

### Accessibilità

- contrasto elevato
- focus states chiari
- CTA reali e grandi abbastanza
- headings gerarchici
- alt text informativi
- reduced motion pienamente rispettato
- testo core non incorporato solo nei video

### Progressive enhancement

Il sito deve funzionare così:
- base HTML leggibile senza JS
- enhanced motion con JS
- full immersion solo quando device e rete lo consentono

Must-have:
- poster images
- lazy loading
- reduced motion
- HTML utile senza JS

Should-have:
- device capability gating

Nice-to-have:
- adaptive media strategy per network conditions

## N. Content production plan

### Asset da produrre

Fronte mare / alba:
- esterni struttura
- facciata
- accesso
- prime luci

Beach:
- palme/ombrelloni
- sabbia
- servizio beach
- dettaglio comfort

Morning / bar:
- caffè
- banco
- mise en place leggera

Sport:
- padel
- campi
- crossfit outdoor
- yoga/warm-up se previsto

Lunch / fish:
- preparazione sala
- cucina
- piatti di pesce
- servizio tavolo

Transition:
- scale
- corridoi
- cambio luce

Sunset terrace:
- aperitivo
- cocktail
- golden hour

Dinner terrace / brace:
- brace
- carne
- cucina a vista
- tavoli serali

Events / nightlife:
- dj set
- folla controllata
- luci
- private moments

### Deliverable editoriali

- manifesto brand “Urban Village”
- microcopy navigazione
- headline per ogni chapter
- testi landing
- FAQ
- metadata SEO
- alt text e caption principali

### Regole di produzione media

- un key visual per chapter
- un visual verticale safe per mobile
- un visual orizzontale per desktop/social
- un poster frame scelto in fase di shooting, non a caso
- niente video lunghi non pensati per il web

### Trascrizioni e machine-readable content

- summary editoriale per ogni clip
- caption per ogni video hero
- menu in formato dati e HTML, non solo PDF

Must-have:
- shooting strutturato per daypart
- poster frame
- summary testuali

Should-have:
- clip dedicate mobile/desktop

Nice-to-have:
- behind-the-scenes per social/CRM

## O. Delivery roadmap con fasi, dipendenze e priorità

### Fase 0 — Discovery e allineamento

Obiettivo:
- chiarire brand, offerta 2026, modelli di prenotazione, ownership contenuti

Output:
- decisioni brand
- entity map
- inventory servizi
- scope definitivo

Dipendenze:
- stakeholder interview
- audit booking
- audit contenuti attuali

Priorità:
- must-have

### Fase 1 — Strategy, IA, narrative system

Obiettivo:
- fissare architettura, user journeys, scroll blueprint, CTA model

Output:
- sitemap
- narrative map
- wireframe low-fi
- conversion model
- SEO map

Dipendenze:
- chiusura discovery

Priorità:
- must-have

### Fase 2 — Art direction e prototype

Obiettivo:
- tradurre il concept in visual system e prototipo navigabile

Output:
- moodboard
- design tokens
- prototype homepage
- prototype mobile-first

Dipendenze:
- approvazione strategy

Priorità:
- must-have

### Fase 3 — Content production

Obiettivo:
- produrre foto, video, copy, menu, FAQ, metadata

Output:
- libreria asset
- copydeck
- content matrix
- naming media

Dipendenze:
- art direction approvata
- shotlist firmata

Priorità:
- must-have

### Fase 4 — Build

Obiettivo:
- sviluppo frontend, CMS, SEO layer, forms, tracking, security baseline

Output:
- sito stage completo
- integrazione media
- schema markup
- form e booking hub

Dipendenze:
- asset minimi pronti
- CMS schema approvato

Priorità:
- must-have

### Fase 5 — QA, hardening, launch prep

Obiettivo:
- performance tuning
- accessibility QA
- SEO QA
- security QA
- legal QA

Output:
- launch checklist
- redirect map
- consent validation
- analytics validation

Dipendenze:
- build completo

Priorità:
- must-have

### Fase 6 — Launch

Obiettivo:
- pubblicazione controllata

Output:
- go-live
- monitoring attivo
- fallback plan

Priorità:
- must-have

### Fase 7 — Optimization

Obiettivo:
- migliorare conversione e qualità dell’engagement

Output:
- A/B test su CTA
- refinement motion
- landing nuove
- ottimizzazioni SEO continuative

Priorità:
- should-have

## P. Rischi progettuali e contromisure

### Rischio 1

Homepage troppo spettacolare e troppo poco utile.

Contromisure:
- CTA persistenti
- landing dedicate
- hub prenotazioni
- test utenti su task semplici

### Rischio 2

Confusione fra ristorante mare e terrazza brace.

Contromisure:
- due pagine diverse
- due palette narrative diverse
- due CTA diverse
- due menu distinti

### Rischio 3

Sito lento per eccesso di media.

Contromisure:
- performance budget rigido
- poster first
- una sola scena attiva
- mobile fallback

### Rischio 4

Brand incoerente tra lusso, beach resort e nightlife.

Contromisure:
- regole art direction chiare
- tono premium caldo, non clubbing aggressivo
- gerarchia temporale giorno → notte

### Rischio 5

SEO sacrificata dalla home immersiva.

Contromisure:
- SSR completo
- pagine satellite forti
- testo HTML reale
- schema markup

### Rischio 6

Booking frammentato.

Contromisure:
- prenotazioni hub
- naming chiaro dei canali
- microcopy orientativo

### Rischio 7

Cookie/privacy gestiti con pattern invasivi o non conformi.

Contromisure:
- banner semplice
- reject chiaro
- consent logging
- analytics attivati solo quando consentiti

### Rischio 8

Abuso form/spam/event leads di bassa qualità.

Contromisure:
- rate limiting
- honeypot
- validazione
- challenge invisibile on demand

## Q. Checklist finale per handoff design/dev

### Brand

- payoff definitivo approvato
- relazione tra Hawaii e MUULab chiarita
- claim Aperol confermato o rimosso

### UX

- homepage chapters approvati
- mobile flow approvato
- CTA map approvata

### Content

- asset list completa
- copydeck completo
- FAQ validate
- menu e vini aggiornati

### Design

- palette approvata
- type system approvato
- component inventory minima definita
- motion rules documentate

### Dev

- stack scelto
- CMS schema definito
- data model approvato
- hosting/CDN/WAF decisi

### SEO

- URL map
- title/meta rules
- schema map
- sitemap plan
- internal linking map

### Security

- RBAC admin/CMS
- 2FA
- CSP e header policy
- rate limiting form
- secret management

### Compliance

- privacy policy
- cookie policy
- banner pattern
- consent log design

### Performance

- performance budget
- media rules
- fallback mobile
- reduced motion

### Launch

- stage QA
- Search Console
- analytics QA
- error monitoring
- rollback plan

## Fonti usate

- Sito live Hawaii Pescara, home e aree principali: [hawaiipescara.it](https://www.hawaiipescara.it/)
- Home claim e aree correnti: [Home](https://www.hawaiipescara.it/)
- Offerta ristorante piano terra: [Il ristorante](https://www.hawaiipescara.it/il-ristorante/)
- Sport, padel e crossfit outdoor: [Lo sport](https://www.hawaiipescara.it/lo-sport/)
- Spiaggia e servizi: [La spiaggia](https://www.hawaiipescara.it/la-spiaggia/)
- MUULab Riviera in terrazza: [MUULab Riviera](https://www.hawaiipescara.it/muulab-riviera-in-terrazza/)
- Eventi correnti: [Eventi](https://www.hawaiipescara.it/eventi/)
- Google Search Central, structured data guidelines: [Structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- Google Search Central, JavaScript SEO: [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- Google Search Central, image SEO: [Image SEO Best Practices](https://developers.google.com/search/docs/appearance/google-images)
- Google Search Central, people-first content: [Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- OWASP Top 10:2025: [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- OWASP ASVS 5.0: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- OWASP CSP guidance: [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- Garante Privacy, linee guida cookie: [Linee guida cookie 2021](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876%26nbsp)
- Garante Privacy, sintesi operativa: [No a scrolling e cookie wall](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9679893)
- EDPB cookie banner taskforce: [EDPB cookie banner report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)
