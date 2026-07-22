# Hawaii journey: interfaccia persistente e override video

## Obiettivo

La homepage deve mantenere il video come elemento narrativo controllato dallo scroll senza rendere instabile o inutilizzabile l'interfaccia sovrapposta. Testi, CTA e hotspot devono restare visibili e utilizzabili durante l'avanzamento del video. L'utente può fermarsi per leggere o scegliere un'azione, ma non deve attendere uno stato di arresto per poter interagire.

## Problemi confermati

1. Con `prefers-reduced-motion: reduce` il componente sostituisce intenzionalmente il video con immagini statiche. Su iPhone questo comportamento è stato percepito come un video bloccato.
2. Durante la riproduzione, `isScrubbing` riduce istantaneamente l'opacita dell'overlay dal 100% al 30%, lo sposta verticalmente e disabilita CTA e hotspot. Le rapide alternanze tra riproduzione e pausa producono lampeggi e salti visivi.
3. Dopo due rifiuti di `video.play()`, il player entra in fallback permanente. Su Safari reale il test sintetico non rappresenta in modo affidabile la user activation.

## Comportamento approvato

### Interfaccia persistente

- Testi, CTA, indicatore di scena e hotspot non cambiano opacita o posizione in base allo stato di riproduzione.
- CTA e hotspot restano interattivi mentre il video avanza.
- Il contenuto testuale cambia solo quando il video entra nell'intervallo temporale della scena successiva.
- Nessun pannello o overlay tecnico deve apparire nell'esperienza ordinaria.
- L'attivazione di una CTA o di un hotspot interrompe normalmente la navigazione corrente e apre la destinazione prevista.

### Riduci movimento

- Se `prefers-reduced-motion: reduce` e attivo, la prima visualizzazione conserva le immagini statiche per rispettare la preferenza di sistema.
- Sopra la scena viene offerto un comando discreto `Attiva esperienza video`.
- Il comando costituisce un consenso esplicito, passa alla modalita video e tenta la riproduzione nello stesso evento utente.
- La scelta viene memorizzata in `sessionStorage`, quindi vale soltanto per la scheda/sessione corrente ed e reversibile chiudendo la scheda.
- Dopo l'override, le altre animazioni decorative continuano a rispettare `prefers-reduced-motion`; viene riattivato soltanto il video narrativo.

### Safari e rifiuto della riproduzione

- Un rifiuto di `play()` con politica di autoplay non deve sostituire il video con immagini statiche.
- Il player resta in modalita video e presenta un comando esplicito `Avvia il video`.
- Il comando chiama `video.play()` direttamente da un click/tap reale.
- Errori media non recuperabili continuano a usare le immagini statiche come fallback.

## Struttura tecnica

- La preferenza di sistema e l'override di sessione sono gestiti separatamente.
- `mediaMode` descrive il supporto visuale attivo (`video`, `stills`, `fallback`).
- Lo stato di riproduzione non controlla piu opacita, trasformazioni o `pointer-events` dell'interfaccia.
- Il prompt video e renderizzato solo in `stills` causato da reduced motion o nello stato `waiting-for-gesture`.
- Il motivo della modalita statica rimane disponibile nei data attribute per test e diagnostica.

## Accessibilita

- Il comando di override e un vero `button`, raggiungibile da tastiera e con focus visibile.
- Il testo spiega l'azione senza chiedere di modificare le impostazioni del dispositivo.
- `prefers-reduced-motion` continua a disattivare transizioni, parallax e animazioni decorative.
- Il video rimane muto e `playsInline`.

## Verifica

- Test WebKit iPhone con `reducedMotion: reduce`: immagini statiche iniziali, pulsante presente, tap, video montato e tempo in avanzamento.
- Test con primo `play()` rifiutato: il video non entra in fallback e il comando di avvio resta disponibile.
- Test dell'overlay durante la riproduzione: opacita, trasformazione e interattivita rimangono costanti.
- Test di CTA e hotspot durante `data-media-state="moving"`.
- Regressione completa: rete lenta, fallback per errore MP4 reale, desktop continuo, prenotazioni e build statica.

## Reversibilita

L'intervento resta confinato al controller della homepage e ai relativi test. Nessun asset viene sostituito o cancellato; il comportamento precedente puo essere ripristinato revertendo il commit dedicato.
