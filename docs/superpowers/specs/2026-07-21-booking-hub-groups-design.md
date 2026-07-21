# Booking Hub Groups Design

## Obiettivo

Rendere immediata la distinzione tra ristorazione e attività nella pagina `/prenotazioni`, mantenendo invariati URL e flussi esterni.

## Gerarchia

La colonna principale presenta tre gruppi nell'ordine seguente:

1. `Food`: Hawaii Ristorante e MUULab Riviera.
2. `Beach & Sport`: prenotazione palma/spiaggia e accesso alle prenotazioni di padel, outdoor gym e altre attività sportive.
3. `Eventi privati`: serate/eventi e feste private.

Ogni gruppo usa un titolo editoriale discreto e una griglia interna. Le destinazioni Food restano visivamente prioritarie e precedono sempre beach e sport.

## Copy

Tutte le CTA promozionali visibili diventano `Prenota Hawaii` e `Prenota MUULab`. Il nome TheFork resta presente solo nelle pagine e nei componenti in cui serve a descrivere consenso, privacy o fornitore del modulo.

## Vincoli

- Nessuna modifica a URL, configurazioni di prenotazione o widget.
- Layout mobile a colonna singola; due colonne solo quando lo spazio lo consente.
- Test statici e browser devono verificare titoli, ordine e link.
