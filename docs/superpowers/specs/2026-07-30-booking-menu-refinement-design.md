# Booking and Menu Refinement Design

## Goal

Rendere coerenti i percorsi di prenotazione e correggere la gerarchia dei menu senza introdurre nuove pagine superflue o collegamenti esterni ridondanti.

## Prenotazioni ristorante

- Hawaii e MUULab Riviera utilizzano lo stesso componente di prenotazione incorporato.
- Il calendario si carica automaticamente dopo il consenso generale ai servizi esterni.
- Le pagine non mostrano pulsanti o copy che invitano ad aprire direttamente TheFork.
- Telefono e WhatsApp restano disponibili come assistenza diretta.
- Le informative privacy e cookie continuano a identificare il fornitore esterno.

## WhatsApp contestuale

Gli URL WhatsApp vengono costruiti da una funzione centrale con messaggi specifici:

- Hawaii: richiesta tavolo al ristorante Hawaii.
- MUULab Riviera: richiesta tavolo sulla terrazza MUULab Riviera.
- Padel: richiesta prenotazione campo.
- Eventi e feste private: richiesta informazioni coerente con il servizio.

I numeri restano separati per servizio. Per il Padel viene usato `+39 351 320 0049`.

## Prenotazione Padel

- Non viene creata una nuova pagina.
- Nella pagina `/prenotazioni`, la voce diventa `Prenota padel`.
- La voce porta alla pagina interna `/sport`.
- `/sport` mantiene i due accessi già previsti: assistenza WhatsApp e registrazione/accesso su Wansport.

## Menu

L'ordine editoriale della pagina `/menu` è:

1. Menu Hawaii.
2. Carta vini Hawaii.
3. Menu MUULab Riviera.
4. Carta vini MUULab Riviera.

La categoria Hawaii `Gli sfizi, prima della pizza`, la nota `La pizza si accende la sera` e i relativi piatti vengono rimossi integralmente.

La carta vini MUULab viene ricavata dal PDF ufficiale già collegato al progetto e suddivisa in:

- Coravin al calice.
- Bollicine.
- Vini rossi italiani.
- Francia.
- Vini rosati.
- Vini bianchi.

Ogni carta vini mantiene un'ancora distinta, evitando che il collegamento Hawaii conduca alla cantina MUULab.

## Accessibilità e comportamento

- I moduli incorporati conservano titolo accessibile, policy referrer e autorizzazione pagamenti.
- Le CTA esterne indicano chiaramente WhatsApp o Wansport.
- Le ancore dei menu mantengono lo spazio per la testata sticky e rispettano `prefers-reduced-motion`.
- I messaggi WhatsApp vengono codificati correttamente nell'URL.

## Verifica

- Test unitari sui numeri e sui messaggi WhatsApp.
- Test browser sui moduli automatici e sull'assenza di link diretti a TheFork.
- Test browser sul percorso `/prenotazioni` -> `/sport`.
- Test statici e browser sull'ordine menu/carte vini e sull'assenza degli sfizi ritirati.
- Lint, TypeScript, build statica e suite responsive esistente.
