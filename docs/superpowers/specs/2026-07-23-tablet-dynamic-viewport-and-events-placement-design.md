# Tablet dynamic viewport and events placement

## Obiettivo

Correggere il viaggio video su tablet senza alterarne il ritmo su desktop e mobile:

- eliminare la fascia nera che compare quando il browser nasconde la barra degli indirizzi;
- mantenere lo stage video ancorato durante la discesa e quando si ritorna dal footer;
- rimuovere ogni riferimento a "Giovedì Posh" dalla scena aperitivo;
- presentare "Giovedì Posh" soltanto nella successiva scena eventi.

La modifica deve essere piccola, reversibile e priva di nuove dipendenze.

## Diagnosi

Lo stage sticky, il margine che sovrappone la timeline e la coda finale usano
`100svh`. Sui browser tablet la barra degli indirizzi può scomparire durante lo
scroll: la viewport visibile aumenta, mentre `svh` resta legato alla sua misura
minima. Lo stage diventa quindi più basso dello schermo e lascia visibile il fondo
nero della pagina.

La stessa differenza modifica la geometria complessiva del wrapper rispetto a
`window.innerHeight`. Quando si supera la sequenza e si torna indietro dal footer,
il progresso può essere ricostruito su una misura diversa da quella usata
all'andata, producendo la perdita apparente dell'ancoraggio.

## Soluzione

### Geometria della viewport

Usare `100dvh` esclusivamente per gli elementi che devono coincidere in ogni
momento con la viewport visibile:

- altezza dello stage sticky;
- margine negativo che sovrappone la timeline allo stage;
- coda finale che accompagna l'uscita dallo sticky.

Mantenere invece in `svh` l'altezza delle singole scene della timeline. In questo
modo la durata narrativa non cambia quando la barra del browser appare o scompare,
mentre il video continua a coprire tutta l'area visibile.

Le regole CSS useranno `100svh` come base e un blocco separato
`@supports (height: 100dvh)` per l'override dinamico. La separazione impedisce al
minificatore di eliminare il fallback. La baseline supportata per il comportamento
dinamico completo è Safari/iPadOS 16.1 o successivo; sui browser precedenti resta
il comportamento compatibile basato su `svh`.

Non verranno aggiunti listener `visualViewport`, correzioni periodiche o
trasformazioni JavaScript dell'altezza.

### Posizionamento di Giovedì Posh

La scena aperitivo deve raccontare esclusivamente terrazza, tramonto, cocktail e
vista mare. Il suo testo non conterrà "Giovedì Posh" e il relativo hotspot sarà
sostituito da "Cocktail & bollicine", collegato a `/menu#cocktail`.

La successiva scena eventi, dopo la scena MUULab, sostituirà l'hotspot generico
"Le serate" con "Giovedì Posh", collegato a `/eventi`. La pagina eventi manterrà
il contenuto editoriale completo già presente. Le citazioni editoriali presenti
nelle pagine satellite non fanno parte di questa rimozione.

## Comportamento atteso

- Quando la barra del browser tablet si ritrae, il video continua a riempire la
  viewport senza fascia nera.
- Il rapporto tra scroll e progresso non subisce salti dovuti alla variazione
  dell'altezza visibile.
- Superato il video, il footer resta raggiungibile normalmente.
- Tornando verso l'alto, lo stage rientra in sticky e il video segue lo scroll in
  reverse senza perdere il punto della timeline.
- La scena aperitivo non mostra né cita "Giovedì Posh".
- "Giovedì Posh" appare nella scena eventi e nella relativa pagina.

## Verifica

Prima della modifica verranno aggiunti test statici che falliscono sul codice
corrente:

- controllo statico della collocazione di "Giovedì Posh";
- controllo statico dell'uso di `dvh` per stage, sovrapposizione e coda;
- controllo che la durata delle scene resti espressa in `svh`;

Verrà inoltre aggiunta una regressione browser tablet che scorre oltre lo stage,
raggiunge il footer e torna a un punto intermedio, verificando che:
  - il footer sia stato realmente visibile;
  - l'altezza dello stage coincida con `window.innerHeight` entro 2 pixel;
  - il bordo superiore dello stage sia ancorato a 0 entro 2 pixel;
  - il progresso ricostruito coincida con il target entro 0,002;
  - il target temporale diminuisca e la direzione diventi `reverse`.

Con la viewport fissa di Playwright questa regressione può passare anche prima
della modifica; caratterizza il round trip, mentre il RED affidabile è fornito
dai contratti statici.

Playwright usa viewport fisse e non riproduce l'animazione reale della barra
browser di iPadOS. Il test automatico copre quindi geometria, uscita e rientro
dallo sticky, ma l'assenza della fascia nera richiede anche una verifica manuale
su iPad reale, sia Safari sia Chrome, con la barra degli indirizzi visibile e poi
ritratta.

Dopo l'implementazione verranno eseguiti test, typecheck, lint e build. La
pubblicazione avverrà soltanto dopo la verifica locale e il controllo indipendente
della modifica.

## Reversibilità

La correzione modifica soltanto classi CSS già presenti e dati testuali della
timeline. Non introduce migrazioni, dipendenze, formati di contenuto o API nuove.
Può essere annullata con un singolo revert del commit dedicato.
