# Hourly Sanity Menu Sync Design

## Obiettivo

Rendere autonomo il passaggio dai menu pubblicati in Sanity alla versione statica su GitHub Pages. La sincronizzazione deve avvenire una volta ogni ora, non richiedere token personali e non avviare build quando i contenuti non sono cambiati.

## Architettura

Il workflow Pages aggiunge il trigger `schedule` al minuto 17 di ogni ora e, solo per quel trigger, interroga i documenti pubblicati `menu-hawaii` e `menu-muulab`, confrontandone le revisioni con un marcatore JSON della release online. `push` e `workflow_dispatch` continuano sempre verso la build, indipendentemente dal confronto CMS.

Il marcatore espone esattamente `{"schemaVersion":1,"syncSuspended":false,"documentRevisions":{"menu-hawaii":"<rev>","menu-muulab":"<rev>"}}`, senza proprietà aggiuntive. Viene generato dalla stessa snapshot immutabile già validata direttamente in `web/out/menu-release.json`, dopo la build e prima dei test dell'artefatto, così non può essere cancellato da Next o divergere dal contenuto esportato.

## Flusso

1. Ogni ora GitHub Actions legge le revisioni pubblicate in Sanity.
3. Legge `https://<owner>.github.io/<repository>/menu-release.json` con cache-busting, timeout di 10 secondi e limite di 32 KiB.
4. Se le revisioni coincidono, il workflow termina prima di installazioni, test e build.
5. Se differiscono, il workflow prosegue con una revisione Sanity corrente. La cattura diventa così fail-closed e non può usare il fallback locale.
6. Se il marcatore non esiste, non è valido o non è raggiungibile, il controllo termina senza deploy. La prima installazione del marcatore avviene tramite la push iniziale già autorizzata; l'incertezza non può quindi sovrascrivere un rollback.
7. La nuova release include il marcatore aggiornato.

Un rollback sostituisce il marcatore ripristinato con la stessa struttura e `syncSuspended: true`. I controlli orari non lo sovrascrivono; una successiva build manuale o una push produce un marcatore normale e riattiva la sincronizzazione. I run schedulati e interattivi usano gruppi di concorrenza distinti, quindi non si cancellano. Subito prima del deploy, un job di arbitraggio blocca una release schedulata se rileva un run push/manuale/rollback attivo oppure più recente; se il run interattivo nasce dopo l'arbitraggio, sarà comunque quello a pubblicare per ultimo.

## Sicurezza E Affidabilita

- Nessun PAT GitHub viene memorizzato in Sanity.
- Il dataset pubblico viene interrogato in prospettiva `published`; le bozze non attivano aggiornamenti.
- Una risposta Sanity o Pages non valida, parziale, troppo grande o fuori timeout blocca il controllo invece di pubblicare il fallback locale.
- Il confronto richiede esattamente i due documenti previsti.
- ID e revisioni rispettano un formato ristretto prima di essere scritti negli output GitHub.
- Il marcatore non contiene menu, email, token o altre informazioni riservate.
- Un errore nella lettura del marcatore online blocca il controllo; la sincronizzazione riprova all'ora successiva.

## Verifica

I test statici devono provare trigger orario, gruppi di concorrenza distinti, arbitraggio finale, modalità fail-closed, sospensione rollback e generazione post-build del marcatore. Test funzionali eseguiti da `npm run test:menu-sync` devono coprire revisioni uguali e diverse, marker assente, irraggiungibile, malformato, fuori timeout, oltre 32 KiB o sospeso, risposta Sanity parziale o non valida, proprietà aggiuntive e rifiuto di snapshot incomplete. Dopo l'implementazione devono passare test statici, test menu-sync, lint, typecheck e build.
