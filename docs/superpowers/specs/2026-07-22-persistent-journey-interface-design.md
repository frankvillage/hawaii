# Hawaii journey: interfaccia persistente e override video

## Obiettivo

La homepage deve mantenere il video come elemento narrativo controllato dallo scroll senza rendere instabile o inutilizzabile l'interfaccia sovrapposta. Testi, CTA e hotspot devono restare visibili e utilizzabili durante l'avanzamento del video. L'utente può fermarsi per leggere o scegliere un'azione, ma non deve attendere uno stato di arresto per poter interagire.

## Problemi confermati

1. Con `prefers-reduced-motion: reduce` il componente sostituisce intenzionalmente il video con immagini statiche. Su iPhone questo comportamento è stato percepito come un video bloccato.
2. Durante la riproduzione, `isScrubbing` riduce istantaneamente l'opacita dell'overlay dal 100% al 30%, lo sposta verticalmente e disabilita CTA e hotspot. Le rapide alternanze tra riproduzione e pausa producono lampeggi e salti visivi.
3. Dopo due rifiuti di `video.play()`, il player entra in fallback permanente. Su Safari reale il test sintetico non rappresenta in modo affidabile la user activation.

## Comportamento approvato

### Interfaccia persistente

- Testi, CTA, indicatore di scena e hotspot visibili non cambiano opacita o posizione durante caricamento, riproduzione, arresto o cambio scena.
- CTA e hotspot visibili restano interattivi mentre il video avanza.
- Su mobile restano visibili e interattivi testi, CTA, menu, prenotazioni e Soul Rail. Gli hotspot ambientali continuano a essere nascosti sotto `768px`, come gia approvato, per non coprire visual e contenuti.
- Su mobile titolo ed eyebrow usano un'opacita visuale del 92%, la descrizione dell'82% e le CTA del 100%. Il contrasto resta conforme grazie agli scrim esistenti, senza introdurre pannelli opachi.
- Il contenuto testuale cambia solo quando il video entra nell'intervallo temporale della scena successiva.
- Nessun pannello o overlay tecnico deve apparire nell'esperienza ordinaria.
- L'attivazione di una CTA segue subito la destinazione prevista. Su touch, gli hotspot ambientali mantengono il foglio informativo intermedio gia esistente.

### Indicatore di continuazione

- Su mobile un indicatore sottile sul bordo destro combina la label `Scorri`, una linea verticale e un punto luminoso discendente.
- L'indicatore e `aria-hidden`, non intercetta input e non compete con CTA, WhatsApp o Soul Rail.
- Scompare mentre lo scroll e attivo e ricompare con opacita ridotta dopo una breve pausa, finche la homepage immersiva e nel viewport.
- Con `prefers-reduced-motion: reduce` l'indicatore resta statico; l'override del solo video non riattiva la sua animazione.

### Hotspot desktop senza collisioni

- Da `768px` in su il punto dell'hotspot resta ancorato alla coordinata editoriale dell'immagine, mentre label e scheda possono essere riposizionate.
- Un collision resolver misura header, testo di scena, indicatore scena, Soul Rail, WhatsApp, margini sicuri, hotspot gia collocati e viewport.
- Per ogni hotspot valuta in ordine candidati a destra, sinistra, sopra e sotto l'ancora. Sceglie la prima posizione interamente contenuta e priva di intersezioni.
- Se nessun candidato e valido, colloca la label in una corsia laterale libera e mantiene il collegamento visivo con il punto originale.
- Il resolver si esegue solo al montaggio, al cambio scena, dopo il caricamento font e su `ResizeObserver`; non gira durante ogni frame o evento scroll.
- Il parallax viene rimosso da label e schede hotspot per non invalidare il layout risolto. Il punto ancorato puo mantenere un effetto luminoso senza traslazione.
- La scheda espansa usa lo stesso sistema di aree vietate e viene posizionata solo dopo hover o focus; una sola scheda puo essere aperta alla volta.
- Il layout non nasconde hotspot desktop e garantisce che label e schede non si sovrappongano tra loro, ai testi o ai controlli e non escano dal viewport.

### Riproduzione reverse dedicata

- La timeline canonica resta espressa nel tempo del video forward, indipendentemente dalla direzione di scroll.
- Lo scroll verso il basso usa `journey-mobile.mp4` o `journey-desktop.mp4`. Lo scroll verso l'alto usa `journey-mobile-reverse.mp4` o `journey-desktop-reverse.mp4`.
- Gli asset reverse non hanno sorgente assegnata e non vengono richiesti finche l'utente non inverte realmente lo scroll dopo essere avanzato nella timeline.
- Al primo reverse, il frame forward resta visibile mentre il secondo video viene caricato e sincronizzato con `reverseTime = duration - forwardTime`.
- Il layer reverse diventa visibile solo dopo il primo frame presentato, rilevato con `requestVideoFrameCallback` quando disponibile e con `playing` piu `timeupdate` come fallback.
- Quando la direzione torna forward, il layer forward viene sincronizzato con `forwardTime = duration - reverseTime` e riappare solo dopo un frame presentato.
- Un solo layer riproduce in ogni momento; l'altro resta in pausa. La transizione non mostra poster, frame neri o immagini statiche intermedie.
- Se un asset reverse non e disponibile, il player conserva l'ultimo frame e riallinea il forward al target senza attivare un fallback permanente dell'intera esperienza.

#### Specifiche degli asset reverse

- Durata, frame rate, dimensioni, color space e crop devono corrispondere esattamente alla rispettiva versione forward.
- Encoding H.264 `avc1`, `yuv420p`, faststart, senza audio e senza traccia timecode; keyframe interval massimo un secondo.
- Il profilo mobile resta compatibile con Safari iPhone. Bitrate e peso devono essere uguali o inferiori all'asset forward equivalente.
- Gli asset reverse sono prodotti dalla stessa master timeline e validati frame-to-frame sui punti di inizio, meta e fine.

### Riduci movimento

- Se `prefers-reduced-motion: reduce` e attivo, la prima visualizzazione conserva le immagini statiche per rispettare la preferenza di sistema.
- Sopra la scena viene offerto un comando discreto `Attiva esperienza video`.
- L'elemento video resta montato ma invisibile e senza sorgenti durante lo stato reduced motion. `preload="none"` completa la protezione, ma l'assenza di `src` e `<source>` impedisce richieste automatiche.
- Nello stesso handler reale il comando assegna la sorgente mobile o desktop, chiama `load()` e quindi `video.play()` in modo sincrono, prima di qualsiasi `await`, timer, effect o aggiornamento React dipendente.
- Il comando costituisce un consenso esplicito e passa alla modalita video soltanto attraverso quel gesto reale.
- La scelta viene memorizzata in `sessionStorage`, quindi vale soltanto per la scheda/sessione corrente ed e reversibile chiudendo la scheda.
- Dopo l'override, le altre animazioni decorative continuano a rispettare `prefers-reduced-motion`; viene riattivato soltanto il video narrativo.
- La regola di precedenza e `videoEnabled = !prefersReducedMotion || sessionOverride`. Prima che la preferenza sia risolta, la pagina mostra il poster, mantiene il video senza sorgenti e non avvia richieste video automatiche.
- Cambi della preferenza durante la sessione ricalcolano la modalita; l'override resta valido nella scheda. Errori o indisponibilita di `sessionStorage` non bloccano l'azione corrente.

### Safari e rifiuto della riproduzione

- Rifiuti `NotAllowedError` e `AbortError` non devono sostituire il video con immagini statiche e non incrementano alcun contatore di fallback.
- Il player resta in modalita video e presenta un comando esplicito `Avvia il video`.
- Il comando chiama `video.play()` direttamente da un click/tap reale.
- Anche un nuovo rifiuto del comando mantiene disponibile il retry. Solo errori sorgente, decode o formato non supportato confermati continuano a usare le immagini statiche come fallback.

## Struttura tecnica

- La preferenza di sistema e l'override di sessione sono gestiti separatamente.
- `mediaMode` descrive il supporto visuale attivo (`video`, `stills`, `fallback`).
- Lo stato di riproduzione non controlla piu opacita, trasformazioni o `pointer-events` dell'interfaccia.
- Il prompt video e renderizzato solo in `stills` causato da reduced motion o nello stato `waiting-for-gesture`.
- Il motivo della modalita statica rimane disponibile nei data attribute per test e diagnostica.
- Il collision resolver e una funzione pura separata dal componente React; riceve rettangoli, ostacoli e candidati e restituisce posizioni risolte testabili senza browser.
- Il controller reverse mantiene separati `canonicalTime`, direzione attiva, stato di caricamento e frame presentato dei due layer.

## Accessibilita

- Il comando di override e un vero `button`, raggiungibile da tastiera e con focus visibile.
- Il comando ha un'area interattiva minima di 44x44 CSS pixel, contrasto verificato e posizione compatibile con le safe area in orientamento verticale e orizzontale.
- Il testo spiega l'azione senza chiedere di modificare le impostazioni del dispositivo.
- `prefers-reduced-motion` continua a disattivare transizioni, parallax e animazioni decorative.
- Il video rimane muto, `playsInline` e decorativo (`aria-hidden="true"`), poiche le informazioni equivalenti sono presenti nei testi di scena.

## Verifica

- Test WebKit iPhone con `reducedMotion: reduce`: immagini statiche iniziali, video montato ma invisibile e senza sorgenti, pulsante presente, tap, sorgente assegnata e `play()` invocato sincronicamente, video visibile. Prima di verificare l'avanzamento temporale il test porta lo scroll a un target maggiore di zero.
- Test con piu `play()` consecutivi rifiutati e retry rifiutato: il video non entra in fallback e il comando di avvio resta disponibile.
- Test dell'override dopo reload nella stessa sessione, con `sessionStorage` disponibile e indisponibile.
- Test dell'overlay durante caricamento, riproduzione, arresto e cambio scena: opacita, trasformazione e interattivita rimangono costanti.
- Test di CTA durante `data-media-state="moving"`, hotspot desktop interattivi e hotspot mobile ancora nascosti.
- Test del collision resolver con viewport 768, 1024, 1366, 1440 e 1920 pixel, entrambe le aree testo e tutti i bordi: zero intersezioni e zero overflow.
- Test browser dopo resize, cambio font e cambio scena; label e schede devono restare nei limiti e non coprire gli ostacoli.
- Test reverse con inversioni multiple: tempo canonico monotono nella direzione corretta, frame forward/reverse equivalenti, un solo layer in play e nessun flash durante il passaggio.
- Test rete lenta del primo reverse: il frame corrente resta visibile fino alla presentazione del nuovo layer e il file reverse non viene richiesto prima dell'inversione.
- Test che l'override riattivi soltanto il video e mantenga disabilitate le animazioni decorative.
- Test accessibilita del comando: attivazione da tastiera, focus visibile e non coperto, area minima 44x44, contrasto, `aria-hidden` sul video e posizione nelle safe area in entrambe le orientazioni iPhone.
- Regressione completa: rete lenta, fallback per errore MP4 reale, desktop continuo, prenotazioni e build statica.
- Accettazione finale su Safari fisico: Riduci movimento on/off, Risparmio energetico on/off, cache fredda/calda e ritorno da background. La verifica automatica WebKit non viene presentata come sostituto del dispositivo reale.

## Reversibilita

L'intervento comprende controller della homepage, collision resolver, stile dedicato, stato di sessione, asset reverse e test. Le modifiche applicative e gli asset nuovi confluiscono in commit dedicati senza sostituire i video forward o introdurre migrazioni; ogni parte puo essere ripristinata con revert separati.
