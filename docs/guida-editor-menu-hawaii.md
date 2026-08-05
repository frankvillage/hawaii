# Guida all'editor dei menu

## Hawaii Urban Village e MUULab Riviera

Versione operativa - 31 luglio 2026

Questa guida spiega come aggiornare in sicurezza nomi, prezzi, note, disponibilità e allergeni dei menu Hawaii e MUULab Riviera.

> **Stato di attivazione.** L'editor è disponibile su `https://hawaii-urban-village.sanity.studio` e contiene menu, bevande e carte vini di entrambi i locali. GitHub Pages controlla automaticamente i contenuti pubblicati una volta ogni ora e ricostruisce il sito soltanto quando rileva nuove revisioni.

## 1. Accesso

1. Aprire `https://hawaii-urban-village.sanity.studio`.
2. Selezionare **Accedi con Google**.
3. Utilizzare esclusivamente il proprio account nominativo.
4. Completare la verifica a due fattori, se richiesta.
5. Non condividere password, codici temporanei o sessioni del browser.

Nella schermata principale saranno sempre disponibili due documenti distinti:

- **Menu Hawaii**: ristorante di mare al piano terra, pizza serale e cocktail.
- **Menu MUULab**: ristorante e braceria della terrazza.

Non creare copie dei documenti e non modificare il campo **Venue**. L'associazione tra documento e ristorante è fissa.

## 2. Dizionario dell'interfaccia

L'editor utilizza attualmente alcune etichette in inglese:

- **Categories**: sezioni del menu, per esempio Antipasti o I primi.
- **Dishes**: singole voci o piatti.
- **Name**: nome del piatto.
- **Price**: prezzo visualizzato sul sito.
- **Note**: breve descrizione facoltativa.
- **Available**: disponibilità del piatto.
- **Allergens**: codici numerici degli allergeni.
- **Carta vini e bevande**: sezioni dedicate alle etichette del locale.
- **Vini e bevande**: singole etichette, bottiglie o proposte al calice.
- **Publish**: pubblica la revisione.
- **Discard changes**: annulla le modifiche non pubblicate.

## 3. Modificare una voce esistente

1. Aprire **Menu Hawaii** oppure **Menu MUULab**.
2. Aprire la categoria corretta.
3. Selezionare il piatto da modificare.
4. Aggiornare solo i campi necessari.
5. Controllare il riepilogo prima di premere **Publish**.

### Nome

Usare il nome approvato dalla proprietà. Evitare abbreviazioni poco chiare, testi interamente in maiuscolo e informazioni promozionali nel nome del piatto.

### Prezzo

Sono accettati esclusivamente questi formati:

- `€ 8`
- `€ 8,50`
- `da € 8`
- `€ 12 l'etto`

Usare la virgola per i centesimi e inserire sempre uno spazio dopo il simbolo `€`. Non usare formati come `8 euro`, `€8`, `8.50` o prezzi senza valuta.

### Nota

La nota è facoltativa. Deve essere breve e utile: cottura, ingrediente caratterizzante, servizio o condizione particolare. Non ripetere il nome del piatto e non inserire allergeni in forma testuale.

## 4. Aggiungere, ordinare o rimuovere piatti

### Aggiungere un piatto

1. Aprire la categoria corretta.
2. Selezionare **Add item** in fondo all'elenco dei piatti.
3. Compilare **Name**.
4. Inserire **Price**, se previsto.
5. Lasciare **Available** attivo.
6. Aggiungere gli allergeni soltanto se dichiarati nella scheda o nel menu ufficiale.

### Cambiare l'ordine

Usare la maniglia di trascinamento accanto alla voce. Verificare che antipasti, primi, secondi, contorni e dessert mantengano un ordine coerente.

### Nascondere temporaneamente

Disattivare **Available**. Il piatto resta nell'editor ma non viene mostrato nel sito alla pubblicazione successiva. Questa è la scelta consigliata per indisponibilità stagionali o temporanee.

### Eliminare definitivamente

Usare **Delete** solo quando la voce non dovrà più essere recuperata. Per una sospensione temporanea usare sempre **Available**.

> Non aggiungere, eliminare o rinominare intere categorie senza un controllo tecnico: ordine, ancore e sezioni collegate dipendono dalla struttura approvata del menu.

### Modificare vini e bevande

1. Aprire **Menu Hawaii** oppure **Menu MUULab**.
2. Scorrere fino a **Carta vini e bevande**.
3. Aprire la sezione corretta, per esempio **Bollicine** o **Coravin al calice**.
4. Selezionare l'etichetta e modificare **Nome**, **Prezzo** o **Disponibile**.
5. Premere **Publish** soltanto dopo avere controllato locale e sezione.

Per aggiungere una nuova etichetta selezionare **Add item** dentro la sezione corretta. Per cambiare ordine usare la maniglia di trascinamento. Per una disponibilità temporanea disattivare **Disponibile** invece di eliminare la voce.

Le sezioni della carta possono essere riordinate, ma non devono essere unite in un unico blocco di testo. Mantenere separate tipologie come vini, bollicine, rosati, bianchi e proposte Coravin rende la carta leggibile sul sito.

## 5. Allergeni

Gli allergeni vengono mostrati sul sito come piccole sigle numeriche accanto al piatto. La legenda completa è consultabile in fondo alla pagina menu.

Selezionare soltanto i codici dichiarati nel menu originale o confermati dalla cucina. Non dedurre un allergene dagli ingredienti e non copiarlo da un piatto simile.

1. Cereali contenenti glutine
2. Crostacei
3. Uova
4. Pesce
5. Arachidi
6. Soia
7. Latte, incluso lattosio
8. Frutta a guscio
9. Sedano
10. Senape
11. Semi di sesamo
12. Anidride solforosa e solfiti
13. Lupini
14. Molluschi

Se l'informazione non è presente nella fonte ufficiale, lasciare il campo vuoto e chiedere conferma alla cucina prima della pubblicazione.

## 6. Pubblicare

Prima di premere **Publish** controllare:

- menu e categoria corretti;
- nome senza refusi;
- prezzo nel formato ammesso;
- disponibilità corretta;
- allergeni verificati;
- ordine delle voci;
- nessuna modifica involontaria ad altri piatti.

Dopo **Publish**, Sanity salva la revisione pubblicata:

1. il controllo GitHub successivo, eseguito una volta ogni ora, confronterà le revisioni;
2. il sito di verifica su GitHub Pages verrà ricostruito solo se il menu è cambiato;
3. una build non valida verrà bloccata senza sostituire il menu precedente;
4. il dominio definitivo Aruba verrà aggiornato tramite il rilascio tecnico approvato.

La pubblicazione su GitHub Pages può richiedere fino a circa un'ora più il tempo della build. Le bozze non pubblicate non vengono mostrate online.

## 7. Controllo dopo la pubblicazione

Aprire la pagina menu e verificare sia da telefono sia da desktop:

- [Menu su GitHub Pages](https://frankvillage.github.io/hawaii/menu/)
- [Menu sul dominio definitivo](https://www.hawaiipescara.it/menu/)

Controllare la sezione modificata, la carta vini successiva, la legenda allergeni in fondo e l'assenza di voci disattivate.

Se GitHub Pages è corretto ma il dominio definitivo non è ancora aggiornato, il rilascio Aruba è in attesa: non ripetere la modifica nell'editor.

## 8. Errori comuni

### Il pulsante Publish è disabilitato

Controllare i messaggi rossi sotto i campi. Le cause più frequenti sono nome vuoto, formato prezzo non valido, allergene duplicato o documento associato al locale sbagliato.

### Il piatto non appare sul sito

Verificare che **Available** sia attivo e che la build più recente sia terminata. Se il sito continua a mostrare il menu precedente, contattare il responsabile tecnico senza creare un duplicato del piatto.

### Ho pubblicato un prezzo errato

Correggere immediatamente lo stesso piatto e pubblicare una nuova revisione. Segnalare l'errore al responsabile del rilascio affinché controlli Pages e Aruba.

### Ho eliminato una voce per errore

Non ricrearla con dati approssimativi. Richiedere il ripristino della revisione precedente o recuperare la voce dalla fonte approvata.

## 9. Regole editoriali essenziali

- Un account per persona, mai account condivisi.
- Nessun dato di accesso Aruba o GitHub nell'editor.
- Nessun codice HTML, link arbitrario o testo promozionale nei piatti.
- Nessun allergene aggiunto senza fonte ufficiale.
- Usare **Available** per le sospensioni temporanee.
- Pubblicare una modifica circoscritta alla volta quando possibile.
- Verificare sempre Pages e dominio definitivo.

## 10. Prima attivazione - amministratore tecnico

Questa sezione non riguarda l'uso quotidiano della proprietà.

1. Verificare il progetto Sanity Free e il dataset pubblico `production`.
2. Importare i documenti iniziali `menu-hawaii` e `menu-muulab` generati dal progetto.
3. Pubblicare lo Studio su `https://hawaii-urban-village.sanity.studio` con HTTPS.
4. Invitare utenti nominativi e applicare Google SSO con autenticazione a due fattori.
5. Configurare in GitHub le variabili pubbliche di progetto, dataset e versione API; non è richiesto un token di lettura.
6. Verificare il controllo GitHub orario e il marcatore pubblico delle revisioni.
7. Eseguire una modifica di prova e verificare snapshot, build, Pages e rollback.
8. Definire il passaggio approvato da Pages ad Aruba; al momento non è automatico.
9. Consegnare agli utenti URL, ruoli e contatto tecnico soltanto dopo il collaudo.

## Checklist rapida

1. Apri il menu corretto.
2. Modifica soltanto la voce necessaria.
3. Controlla prezzo e disponibilità.
4. Inserisci solo allergeni verificati.
5. Se modifichi la carta vini, controlla locale, sezione, nome e prezzo.
6. Premi **Publish**.
7. Verifica GitHub Pages e attendi la conferma Aruba.
