# Hawaii Mobile Segment Playback Design

## Obiettivo

La homepage deve mostrare il video reale anche su iPhone e Android. Dopo un secondo sul frame iniziale, ogni swipe o selezione del Soul Rail porta alla tappa richiesta con una transizione fluida e si ferma sul relativo checkpoint. Il canvas JPEG rimane esclusivamente un fallback tecnico.

## Comportamento approvato

- Arrivo: poster per un secondo, poi riproduzione del segmento introduttivo fino al primo checkpoint.
- Swipe avanti di una tappa: il video riproduce il segmento compreso tra il checkpoint corrente e quello successivo, quindi si mette in pausa.
- Scroll continuo: l’estremo del segmento in riproduzione resta immutabile. Nuovi input aggiornano un `pendingTarget`, ma il player si ferma e renderizza almeno un frame in pausa a ogni checkpoint intermedio. Solo il Soul Rail può richiedere un salto diretto.
- Swipe indietro: seek rapido al checkpoint precedente con una breve dissolvenza, perché Safari non supporta playback video inverso affidabile.
- Click su una tappa distante: seek diretto al checkpoint richiesto con la stessa dissolvenza; il video non ripercorre tutte le scene.
- Il Soul Rail, testi, hotspot e CTA cambiano quando la transizione raggiunge la tappa, evitando sovrapposizioni incoerenti.
- Con `prefers-reduced-motion` l’introduzione non parte automaticamente: appena disponibili i metadata, il controller esegue un seek verificato al primo checkpoint e sostituisce il poster senza playback. Le tappe successive usano seek diretti e mostrano il frame video decodificato. Il controllo `Attiva movimento` abilita esplicitamente la riproduzione segmentata e conserva la scelta per la sessione.

## Architettura

### Journey controller

Un controller unico mantiene:

- checkpoint corrente;
- checkpoint target;
- direzione della navigazione;
- stato `idle`, `unlocking`, `buffering`, `playing`, `seeking`, `suspended`, `fallback`;
- identificativo della richiesta più recente per annullare transizioni obsolete.
- endpoint immutabile del segmento attivo e `pendingTarget` separato.

Il controller riceve richieste da scroll, swipe e Soul Rail. Decide se eseguire playback in avanti, seek o fallback, senza duplicare la logica nei listener UI. Ogni operazione possiede un token e un `AbortController`: la cancellazione mette in pausa il video, rimuove listener e callback, invalida i timeout e impedisce a Promise o eventi obsoleti di aggiornare lo stato.

### Transizioni di stato

- `idle` + swipe avanti: avvia `playing` verso il solo checkpoint adiacente.
- `playing` + nuovi swipe: conserva l’endpoint corrente e aggiorna `pendingTarget`; dopo la pausa al checkpoint avvia il segmento successivo.
- Qualsiasi stato + Soul Rail distante: cancella l’operazione corrente e avvia `seeking` diretto.
- `seeking` + nuova destinazione: annulla il seek precedente e ne avvia uno nuovo.
- Qualsiasi stato + movimento disattivato: mette in pausa, completa un seek verificato al checkpoint richiesto e passa a `suspended`.
- `waiting` o `stalled`: passa a `buffering`; un solo retry riprende l’operazione, poi attiva `fallback` mantenendo destinazione e UI.
- `visibilitychange` nascosto: mette in pausa e conserva l’operazione. Su `pageshow` o ritorno visibile riconcilia il frame con il checkpoint attivo prima di riprendere.

### Video renderer primario

Il renderer usa un solo elemento `<video>` con `muted`, `playsInline`, `preload="auto"` e sorgente mobile dedicata. Al primo `pointerdown` o `touchstart` esegue un ciclo `play()`/`pause()` silenzioso per sbloccare WebKit. L’introduzione tenta comunque l’autoplay muted dopo un secondo.

Durante un passaggio in avanti:

1. verifica metadata e frame disponibile;
2. imposta il checkpoint target;
3. chiama `play()` con playback rate controllato;
4. usa `requestVideoFrameCallback` quando disponibile, altrimenti `timeupdate` più `requestAnimationFrame`;
5. mette in pausa entro una tolleranza massima di 80 ms dal target;
6. conferma un frame decodificato sul checkpoint prima di aggiornare Soul Rail e contenuti.

Il video non viene trasformato in blob e non viene precaricato integralmente in JavaScript. GitHub Pages e il futuro CDN devono continuare a supportare byte ranges.

### Seek e transizioni non lineari

Per ritorni e salti lontani il controller mostra la still della destinazione per 180-240 ms. Il tentativo primario usa `fastSeek()` quando disponibile, altrimenti assegna `currentTime = checkpointTime`, quindi attende `seeked`. In ogni caso il watchdog verifica sia `abs(currentTime - checkpointTime) <= 0.15` sia la disponibilità di un frame decodificato. Se timestamp o frame non vengono verificati, il controller esegue obbligatoriamente un retry esatto assegnando `currentTime = checkpointTime`, anche quando il tentativo primario era già un’assegnazione diretta. Il video viene rivelato solo quando `requestVideoFrameCallback` conferma il frame; senza questa API, richiede `readyState >= HAVE_CURRENT_DATA`, tempo entro tolleranza e almeno un ciclo di rendering successivo a `seeked`. Il fallimento del retry esatto attiva sempre il canvas, indipendentemente dal metodo primario; fino ad allora la still resta visibile.

### Manifest dei checkpoint

Un modulo versionato contiene per ogni scena `id`, ordine, timestamp, still e indice frame fallback. I timestamp derivano inizialmente dal punto medio di `start`/`end` già presenti in `homeJourney`, ma vengono materializzati e validati all’avvio: devono essere strettamente crescenti, compresi nella durata effettiva del video e condivisi da renderer desktop, mobile e canvas. Una variazione del video richiede una nuova versione del manifest.

### Canvas fallback

Il canvas entra in funzione soltanto quando:

- `play()` viene rifiutato anche dopo lo sblocco utente;
- metadata o dati video non arrivano entro il timeout;
- il codec viene rifiutato;
- si verificano errori media espliciti.
- il tentativo primario e il successivo retry esatto non producono un frame verificato entro i rispettivi watchdog, indipendentemente dalla disponibilità di `fastSeek()`.

Il fallback riproduce i JPEG intermedi, non soltanto i checkpoint statici. Usa una LRU dimensionata in byte, con budget massimo di 64 MiB decodificati e non più di 12 frame contemporanei; i frame sono dimensionati al viewport. `ImageBitmap.close()` rilascia le risorse quando disponibile. Prima di attivare il canvas il video viene messo in pausa e scaricato per la sessione, evitando download e decoder simultanei.

## Accessibilità

- Il player resta muted e non introduce audio inatteso.
- È disponibile un controllo `Pausa movimento`/`Attiva movimento`, discreto e raggiungibile da tastiera.
- `prefers-reduced-motion` disabilita autoplay, playback segmentato, parallax, pulsazioni e animazioni decorative finché l’utente non sceglie `Attiva movimento`.
- Se il movimento viene sospeso durante `playing` o `seeking`, l’operazione viene cancellata, il video viene messo in pausa e il controller completa un seek verificato al checkpoint richiesto. UI, `currentTime` e stato `paused` vengono testati insieme.

## Gestione errori

- Ogni chiamata a `play()` gestisce la Promise rejection.
- Watchdog separati supervisionano unlock/metadata e la singola transizione corrente.
- Gli errori impostano uno stato diagnostico tramite attributi `data-*`, senza mostrare copy tecnico nell’interfaccia.
- La pagina non resta mai sul poster iniziale mentre il contenuto avanza.
- `waiting`, `stalled`, pause imposte dal sistema e ritorno dal background conservano il target; dopo un retry fallito attivano il fallback.

## Performance

- Video mobile H.264 con `moov` iniziale, GOP breve e dimensione obiettivo inferiore a 10 MB.
- Preload della sorgente mobile soltanto sulla homepage e dopo il first paint.
- Nessun doppio download simultaneo di video e sequenza completa di frame.
- Il fallback carica il primo frame, i checkpoint e il segmento corrente in ordine di priorità rispettando il budget di 64 MiB.

## Verifica

- Unit test del controller: avanti, indietro, salto, annullamento richiesta e timeout.
- Chromium mobile: il video entra in `playing`, raggiunge il checkpoint e torna `paused`.
- WebKit emulato: stesso test con autoplay consentito e con primo play rifiutato fino al touch.
- Test con `prefers-reduced-motion`: nessun poster congelato e controllo movimento funzionante.
- Test del fallback: errore video forzato, canvas con almeno due frame intermedi differenti.
- Verifica pubblica GitHub Pages con cache-busting e controllo delle byte ranges.
- Verifica manuale su iPhone 12, viewport CSS 390×844 e iOS 16.4 come minimo supportato, più un iPhone con l’ultima versione stabile disponibile al momento della QA: cache fredda/calda, Low Power Mode, rete rallentata, background/ripresa e input ripetuti.

Profilo rete riproducibile: 10 Mbps down, 1,5 Mbps up, RTT 80 ms e packet loss 0,5%. Cache fredda significa HTTP cache svuotata; cache calda significa seconda navigazione con la stessa versione del manifest e degli asset. Il primo frame si misura da `navigationStart` al primo callback di frame decodificato; il seek dalla creazione della richiesta al callback verificato; i frame persi con `getVideoPlaybackQuality()`; la memoria con il contatore LRU più Safari Web Inspector su dispositivo reale.

Budget di accettazione: primo frame entro 3 s a cache fredda e 1,5 s a cache calda; seek verificato entro 800 ms; pausa entro 150 ms da ogni checkpoint; dropped-frame ratio inferiore al 10% durante i segmenti; fallback sotto 80 MiB complessivi; media serviti con risposta `206` alle richieste Range. Sul percorso video sano i test devono affermare `state !== fallback` e verificare l’assenza di richieste ai JPEG intermedi.

## Criteri di accettazione

- Su Safari mobile, con movimento abilitato, un singolo swipe produce movimento video visibile, non un cambio immagine statico.
- Il player si ferma su ogni tappa entro 150 ms dal checkpoint configurato.
- Un salto da Eventi a BAR non riproduce il video all’indietro per intero.
- Un errore media attiva automaticamente il canvas senza bloccare testi o navigazione.
- Desktop e mobile mantengono la stessa sequenza narrativa e gli stessi checkpoint.
