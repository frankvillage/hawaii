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
- Il contenuto testuale cambia solo quando il video entra nell'intervallo temporale della scena successiva.
- Nessun pannello o overlay tecnico deve apparire nell'esperienza ordinaria.
- L'attivazione di una CTA segue subito la destinazione prevista. Su touch, gli hotspot ambientali mantengono il foglio informativo intermedio gia esistente.

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
- Test che l'override riattivi soltanto il video e mantenga disabilitate le animazioni decorative.
- Test accessibilita del comando: attivazione da tastiera, focus visibile e non coperto, area minima 44x44, contrasto, `aria-hidden` sul video e posizione nelle safe area in entrambe le orientazioni iPhone.
- Regressione completa: rete lenta, fallback per errore MP4 reale, desktop continuo, prenotazioni e build statica.
- Accettazione finale su Safari fisico: Riduci movimento on/off, Risparmio energetico on/off, cache fredda/calda e ritorno da background. La verifica automatica WebKit non viene presentata come sostituto del dispositivo reale.

## Reversibilita

L'intervento comprende controller della homepage, eventuale stile dedicato, stato di sessione e test. Tutte le modifiche applicative confluiscono in un commit dedicato, senza sostituire asset o introdurre migrazioni; il comportamento precedente puo essere ripristinato con un singolo revert.
