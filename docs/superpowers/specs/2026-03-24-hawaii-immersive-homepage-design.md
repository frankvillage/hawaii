# Hawaii Pescara 2026 Immersive Homepage Design

## Goal

Definire una nuova homepage per Hawaii Pescara che unisca:

- navigazione classica chiara e immediata
- storytelling visivo in stile Apple
- scroll verticale che controlla il progresso dei media
- overlay progressivi con testi, grafiche e link
- una modalita immersiva opzionale piu cinematografica

L'obiettivo e far percepire Hawaii come esperienza completa, mantenendo il sito utile per prenotazioni, menu, servizi e contatti.

## Direction

Per evitare ambiguita, i tre modelli discussi vengono definiti qui dentro.

### Model A: Timeline Unica

Una lunga timeline continua e cinematografica, con media collegato allo scroll dall'inizio alla fine.

Caratteristiche:

- massimo effetto spettacolare
- continuita forte tra scene
- navigazione ridotta
- peso maggiore sui media

### Model B: Capitoli Sticky

Una sequenza di capitoli verticali. Ogni capitolo ha una propria area sticky, un proprio media principale e un proprio set di overlay progressivi.

Caratteristiche:

- piena fedelta al pattern Apple
- struttura modulare
- facilita di estensione
- migliore controllo editoriale

### Model C: Concierge Layer

Un livello di utility persistente e discreto, pensato per non perdere mai accesso a prenotazioni, menu, contatti e aree chiave.

Caratteristiche:

- scorciatoie permanenti
- orientamento piu semplice
- maggiore utilita pratica

### Approved Direction

La direzione approvata e:

- homepage standard basata su `Model B`
- integrazione leggera di `Model C`
- `Model A` disponibile solo come `Modalita immersiva`

Tradotto in prodotto:

- la pagina principale usa capitoli sticky Apple-style lungo tutto lo scroll
- ogni capitolo ha media sincronizzato allo scroll, testi progressivi e CTA contestuali
- restano sempre disponibili scorciatoie concierge verso aree chiave
- una `Modalita immersiva` attivabile porta l'utente in una versione piu filmica e continua

## Product Principles

1. Lo scroll deve controllare il media in modo diretto: avanti se l'utente scorre avanti, indietro se torna indietro.
2. La pagina deve sembrare premium e moderna, ma non sperimentale in modo gratuito.
3. I contenuti utili non devono mai sparire dietro l'effetto wow.
4. Ogni capitolo deve raccontare un momento specifico dell'experience Hawaii.
5. Il sistema deve essere leggero, rapido e mobile-first nelle performance.

## Experience Model

### Default Mode

La homepage scorre per capitoli verticali. Ogni capitolo usa una sezione sticky con:

- un media principale
- una finestra di scroll dedicata
- un progresso visuale controllato dallo scroll
- testi e callout che compaiono a soglia
- uno o piu link contestuali
- scorciatoie sempre accessibili alle aree chiave

Questa e la modalita standard di navigazione.

Scelte di prodotto gia fissate:

- la homepage standard e la modalita principale
- la modalita immersiva e opzionale e secondaria
- il ristorante e la terrazza sono distinti nella narrazione:
  - `Ristorante` = esperienza dining principale
  - `Terrazza` = momento premium e climax del percorso
- l'ordine commerciale standard e:
  - ristorante
  - bar / cocktail
  - beach club
  - terrazza
  - eventi

### Immersive Mode

Una CTA esplicita, ad esempio `Modalita immersiva`, apre una variante piu cinematografica della stessa esperienza.

Caratteristiche:

- timeline piu continua
- meno utility persistente
- transizioni piu spettacolari
- piu enfasi su atmosfera, reveal e ritmo
- uscita sempre disponibile verso la navigazione standard

La modalita immersiva non sostituisce il sito principale. E un layer opzionale.

## Page Architecture

La struttura consigliata della homepage e:

1. Intro hero
2. Capitolo facciata / arrivo
3. Capitolo cucina / chef / fiamma
4. Capitolo bar / cocktail
5. Capitolo spiaggia
6. Capitolo terrazza
7. Chiusura con CTA e accessi rapidi

La navigazione classica continua a offrire accesso diretto a:

- ristorante
- bar e cocktail
- carta vini
- beach club
- terrazza / fine dining
- eventi
- prenotazioni
- contatti

## Chapter Design

### 1. Intro Hero

Funzione:

- posizionare Hawaii come experience destination
- introdurre il linguaggio visivo della pagina
- offrire accesso immediato a esplorazione e prenotazione

Contenuti:

- headline corta e premium
- subheadline essenziale
- CTA primaria
- CTA secondaria verso modalita immersiva

### 2. Facciata / Arrivo

Funzione:

- far entrare l'utente nella struttura
- stabilire il tono premium e resort-like

Effetto media:

- micro-sequenza o sequenza di frame della facciata
- avanzamento controllato dallo scroll

Overlay:

- titolo del capitolo
- breve messaggio di posizionamento
- link verso `Scopri il ristorante` e `Prenota`

### 3. Cucina / Chef / Fiamma

Funzione:

- sostituire il gesto hero Apple del prodotto con un momento scenico umano e gastronomico
- alzare il valore percepito del ristorante

Effetto media:

- chef al pass
- padella che ruota
- fiammata controllata come beat principale

Overlay:

- testo progressivo su cucina, menu, signature dishes
- link a `Menu ristorante`
- link a `Carta vini`

### 4. Bar / Cocktail

Funzione:

- introdurre la componente aperitivo-nightlife
- portare energia e vita sociale nella sequenza

Effetto media:

- shaker o versata
- drink che si completa con lo scroll
- luce serale o glow del bancone

Overlay:

- focus su cocktail menu
- focus su aperitivo
- eventuale accesso a eventi / serate

### 5. Spiaggia

Funzione:

- allargare l'idea di Hawaii oltre la ristorazione
- mostrare la dimensione day-use e relax

Effetto media:

- passaggio verso gli ombrelloni
- camminamento o POV verso il mare

Overlay:

- servizi spiaggia
- disponibilita / prenotazione
- comfort e atmosfera

### 6. Terrazza

Funzione:

- chiudere il percorso nel punto piu esclusivo
- creare il climax visivo e commerciale

Effetto media:

- salita
- reveal della terrazza
- finale su tavolo, vista o tramonto

Overlay:

- messaggio premium
- CTA forte di prenotazione
- accesso a esperienza speciale / fine dining

## Scroll Behavior

Il comportamento deve essere il vero filo conduttore.

Per ogni capitolo:

- il contenitore resta sticky per una certa distanza di scroll
- la progressione e normalizzata su un range da 0 a 1
- il media si aggiorna in base al progresso
- i layer testuali compaiono per soglie o finestre di progresso
- tornando indietro con lo scroll, il media regredisce in modo coerente

### Default Chapter Mechanics

Ogni capitolo desktop usa questa grammatica base:

- altezza sezione: tra `220vh` e `320vh`
- area sticky: `100vh`
- fase `0.00 - 0.18`: ingresso e assestamento visivo
- fase `0.18 - 0.62`: scrub principale del media
- fase `0.62 - 0.82`: comparsa callout, testo e link
- fase `0.82 - 1.00`: uscita morbida verso il capitolo successivo

Ogni capitolo mobile usa una variante semplificata:

- altezza sezione: tra `170vh` e `220vh`
- meno overlay simultanei
- una CTA primaria per capitolo
- nessun hotspot minuscolo o dipendente da hover
- testo sempre leggibile senza obbligo di precisione sul touch

### Overlay Rules

Per evitare caos visivo:

- massimo 1 headline attiva per volta
- massimo 2 callout secondari per capitolo
- massimo 2 link contestuali visibili contemporaneamente
- i link principali compaiono solo dopo che il media ha gia espresso il momento forte

### Fallback Rules

Se il dispositivo, la connessione o le preferenze utente non supportano bene lo scrub:

- il media diventa una sequenza di poster frame
- gli overlay compaiono con dissolve semplice
- la logica narrativa resta identica
- la pagina non perde accesso a CTA e scorciatoie

Possibili implementazioni del media:

- video con seek su `currentTime`
- sequenza di frame / immagini
- combinazione di start frame, media attivo, end frame

Scelta consigliata:

- usare un sistema ibrido
- frame o immagini per i momenti piu critici e scenografici
- micro-video brevi quando l'azione reale aiuta la percezione

### Chapter Media Recommendation

- `Facciata / Arrivo`: frame sequence o micro-video molto controllato
- `Cucina / Chef / Fiamma`: frame sequence prioritaria, per avere controllo preciso sul gesto della fiamma
- `Bar / Cocktail`: micro-video o breve sequenza di frame
- `Spiaggia`: micro-video leggero o parallax di immagini
- `Terrazza`: frame sequence o reveal video molto breve

## Utility Layer

Il tocco `C` si traduce in un layer concierge sempre presente ma discreto.

Elementi consigliati:

- quick nav compatta verso capitoli e aree chiave
- CTA prenotazione sempre accessibile
- accesso rapido a menu e contatti
- indicatori di progresso della pagina

Questi elementi non devono interrompere l'effetto premium.

Componenti consigliati:

- mini indice capitoli
- CTA `Prenota`
- accesso `Menu`
- accesso `Contatti`
- toggle `Modalita immersiva`

## Visual Language

Tono approvato:

- premium / luxury
- aperitivo / nightlife

Linee guida:

- superfici scure e calde
- accenti sabbia, rame, oro e blu profondo
- tipografia elegante con un serif editoriale e un sans leggibile
- pochi elementi UI, molta gerarchia
- transizioni morbide, non giocattolose

## Performance Strategy

Vincoli:

- media leggeri
- caricamento rapido
- fallback robusti

Strategia:

- poster image subito visibile
- preload solo del capitolo attuale e del successivo
- lazy load dei media non immediatamente necessari
- supporto `prefers-reduced-motion`
- supporto connessioni lente con fallback statico
- mobile ottimizzato come scenario primario

### Acceptance Criteria

La soluzione deve rispettare questi criteri minimi:

- first render del hero senza attendere il caricamento completo dei media
- nessun capitolo deve bloccare lo scroll per buffering
- in `prefers-reduced-motion`, nessun media scrub continuo
- su connessione lenta, la pagina deve restare interamente navigabile in versione statica
- le CTA principali devono restare raggiungibili senza completare i capitoli
- su mobile, i controlli utili devono restare accessibili entro il primo viewport del capitolo

### Low-End Device Rule

Se il dispositivo mostra segni di scarsa capacita o ridotto data budget:

- usare solo poster frame
- disattivare la modalita immersiva automatica
- semplificare gli overlay
- disabilitare effetti secondari non essenziali

## Accessibility Strategy

La pagina deve prevedere da subito:

- supporto tastiera per i link e per il toggle della modalita immersiva
- struttura heading corretta per tutti i capitoli
- etichette testuali sempre disponibili anche se il media non parte
- contrasto forte per il testo sopra i media
- rispetto di `prefers-reduced-motion`
- nessuna informazione affidata solo al movimento

## Content Needs

Per arrivare a una versione credibile servono:

- nuove foto della struttura
- micro-video per ogni capitolo
- materiali specifici per cucina, chef, bar, spiaggia e terrazza
- menu aggiornati
- carta vini aggiornata
- servizi spiaggia confermati
- tono commerciale definitivo per prenotazioni ed eventi

### Minimum Asset List Per Chapter

Per non bloccare la produzione, ogni capitolo richiede almeno:

- `1` hero still
- `1` media principale per scrub
- `1` end frame leggibile
- `1` headline
- `1` body copy breve
- `1` CTA primaria

Asset minimi per capitolo:

- `Facciata`: struttura, ingresso, hero still, clip o frame arrivo
- `Cucina`: chef, padella / fiamma, dettaglio impiattamento
- `Bar`: bancone, gesture cocktail, drink finito
- `Spiaggia`: camminamento, ombrelloni, mare, servizio
- `Terrazza`: salita, reveal, tavolo premium, vista

### Ownership Assumptions

Per poter pianificare:

- cliente / struttura: fornisce materiali, menu, servizi, priorita commerciali
- team creativo: regia capitoli, copy, struttura narrativa
- team design / frontend: UI, motion system, implementazione scroll, fallback

Le date non sono ancora fissate in questo documento, ma la dipendenza principale e la raccolta asset.

## Open Points

Restano aperti solo punti di contenuto, non di architettura:

- offerta 2026 precisa
- testi definitivi di menu, servizi ed eventi
- materiali reali disponibili per ciascun capitolo
- tono commerciale finale di prenotazioni ed eventi

Questi punti non cambiano la struttura approvata della homepage.

## Recommendation

La raccomandazione progettuale e:

- costruire la homepage standard come sequenza di capitoli sticky Apple-style
- mantenere sempre un layer concierge leggero
- progettare `Modalita immersiva` come esperienza separata ma coerente

Questo approccio offre:

- forte identita visiva
- alto valore percepito
- coerenza narrativa
- migliore equilibrio tra spettacolarita e usabilita
