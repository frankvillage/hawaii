# Editor Sanity Italiano E Separazione Locali

## Obiettivo

Rendere lo Studio comprensibile a proprieta e agenzia senza conoscenze tecniche, eliminando ogni ambiguita tra Hawaii Ristorante e MUULab Riviera.

## Navigazione

La schermata iniziale si intitola **Gestione menu** e contiene esattamente due accessi, senza divisori o modelli tecnici aggiuntivi:

- **Hawaii Ristorante - Piano terra**, con descrizione `Pesce, pizza serale, bevande e carta vini`;
- **MUULab Riviera - Terrazza**, con descrizione `Braceria, cocktail, bevande e carta vini`.

Ogni accesso apre direttamente il documento singleton corretto: Hawaii mappa esclusivamente `menu-hawaii`, MUULab esclusivamente `menu-muulab`. Creazione libera, duplicazione, eliminazione e rimozione dalla pubblicazione dei singleton sono escluse dalle azioni Studio.

## Lingua E Microcopy

Il plugin ufficiale `@sanity/locale-it-it` traduce l'interfaccia nativa dello Studio. Tutti i testi controllati dal progetto vengono riscritti in italiano: nomi dei campi, descrizioni, messaggi di validazione, stati di disponibilita e riepiloghi delle liste.

Le etichette principali sono orientate al compito:

- `Menu: piatti e categorie`;
- `Carta vini e bevande`;
- `Nome del piatto o della voce`;
- `Ingredienti o descrizione`;
- `Visibile sul sito`;
- `Allergeni`.

Le descrizioni chiariscono cosa appare online, come formattare i prezzi e quando nascondere una voce invece di eliminarla.

## Campo Locale

Il campo tecnico `venue` resta nel documento per garantire il collegamento con il sito, ma diventa `readOnly` e `hidden`. La validazione ID/locale resta attiva. In questo modo gli editor non lo vedono e non possono modificarlo attraverso lo Studio, mentre query e build continuano a funzionare senza migrazioni. Questi vincoli non sostituiscono i permessi API del dataset.

## Sicurezza E Reversibilita

La modifica riguarda esclusivamente presentazione e configurazione dello Studio. Non modifica documenti Sanity, prezzi, menu, revisioni, API, workflow o sito pubblico. Il codice viene inviato su un branch dedicato non incluso nei trigger Pages. Il rollback ripubblica lo Studio dal commit precedente `440db4c`; il dataset non richiede rollback perche viene verificato come invariato.

## Verifica

I test statici devono verificare plugin italiano, struttura con esattamente due locali, mapping degli ID, campo `venue` nascosto/read-only, azioni singleton protette, assenza delle vecchie etichette inglesi e permanenza delle validazioni. Devono inoltre passare typecheck, build e smoke visivo dello Studio prima del deploy.

Prima e dopo il deploy uno script CLI read-only usa `getCliClient({apiVersion: "2026-07-31"}).withConfig({perspective: "raw"})` con token utente. Interroga gli ID pubblicati e `drafts.*`, ordina `_id` e proietta `_id`, `_rev`, `venue`. I due JSON vengono conservati in `/tmp` e confrontati byte per byte con `cmp`; qualunque differenza blocca la chiusura del task.
