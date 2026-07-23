# Valutazione di un back office leggero per i menu

**Stato:** raccomandazione architetturale, non implementata  
**Data:** 23 luglio 2026  
**Ambito:** modifica editoriale delle voci menu Hawaii e MUULab

## Decisione

Si raccomanda **Decap CMS con backend GitHub** come back office leggero, da
implementare in una fase successiva al rilascio Aruba.

Decap è un'applicazione web open source che traduce le modifiche editoriali in
commit e pull request: i contenuti restano nel repository, senza database o API
contenuti proprietaria. Questo modello è coerente con il sito Next.js esportato
staticamente, rende ogni modifica tracciabile e consente di riutilizzare test,
build e preview già presenti nel progetto. Decap è gratuito e MIT-licensed; i
costi eventuali riguardano GitHub, il servizio OAuth, le preview e la
manutenzione operativa, non una licenza CMS.

La raccomandazione è preferibile alle alternative per questo caso d'uso:

| Opzione | Valutazione operativa |
| --- | --- |
| **Decap CMS Git-backed** | Scelta consigliata: superficie ridotta, contenuti versionati, nessun database, rollback Git e integrazione naturale con build statiche. |
| Sanity Studio esistente | Più adatto a contenuti complessi, media e ruoli avanzati, ma richiede attivazione, dataset, credenziali, query e una nuova dipendenza runtime/editoriale. È sovradimensionato per sole voci menu. |
| WordPress headless | Offre un'interfaccia familiare, ma mantiene patching, API, plugin e sincronizzazione tra due sorgenti di verità. |
| Pannello proprietario | Sconsigliato: autenticazione, autorizzazione, audit, validazione e manutenzione diventerebbero responsabilità del progetto. |

Fonti di riferimento: [Decap CMS overview](https://decapcms.org/docs/intro/),
[GitHub backend](https://decapcms.org/docs/github-backend/) e
[editorial workflow](https://decapcms.org/docs/editorial-workflows/).

## Confine di questo rilascio

Questa valutazione è **esclusivamente documentale**. Il rilascio corrente:

- non modifica `studio/`;
- non crea o modifica route admin;
- non modifica manifest o lockfile;
- non modifica file `.env*`;
- non introduce o cambia autenticazione;
- non modifica workflow GitHub Actions;
- non modifica configurazioni di deploy, GitHub Pages o Aruba;
- non aggiunge dipendenze, servizi, segreti o database.

Tutte le attività descritte di seguito appartengono a una futura fase
autorizzata separatamente.

## Stato attuale e target

Oggi tipi e dati menu risiedono insieme in
`web/src/lib/site-content.ts`. La pagina `web/src/app/menu/page.tsx` importa
direttamente `menuHighlights` e `venueMenus`. Questo è sicuro per lo sviluppo,
ma non è un formato adatto a un editor non tecnico: una modifica accidentale
può rompere TypeScript o alterare contenuti estranei al menu.

Il target futuro è separare dati e codice:

```text
web/src/content/menus/
  hawaii.json
  muulab.json
web/src/lib/
  menu-content.ts
  menu-content-schema.ts
web/public/admin/
  index.html
  config.yml
```

- Un file per locale limita i conflitti e mantiene pull request leggibili.
- I prezzi restano stringhe, per conservare simbolo euro, virgole e diciture
  come "al pezzo".
- Gli identificatori usati dagli anchor restano campi tecnici non modificabili
  dall'editor.
- Titolo categoria, nota, nome piatto, prezzo e ordine sono campi espliciti.
- `menu-content-schema.ts` valida i file con Zod, già presente nel progetto.
- `menu-content.ts` espone al sito gli stessi tipi usati oggi, riducendo la
  modifica applicativa e mantenendo HTML statico e indicizzabile.

Prima della migrazione va eseguito un test di round-trip Decap su file JSON
reali. Se il formato risultasse fragile per liste annidate e riordinamento, il
fallback è YAML con parser aggiunto come dipendenza diretta e bloccata nel
lockfile. Non va introdotto un generatore che produca file TypeScript
modificabili sia a mano sia dal CMS, per evitare due sorgenti di verità.

## Prerequisiti e dipendenze

### Organizzazione e contenuti

- Nominare almeno un editor e un reviewer responsabile della pubblicazione.
- Confermare repository, branch editoriale e branch protetto di destinazione.
- Definire chi può cambiare prezzi, disponibilità e ordine delle categorie.
- Stabilire una finestra di pubblicazione e un controllo visuale su mobile e
  desktop.
- Trattare le immagini come riferimenti a media già approvati; video e asset
  pesanti restano fuori dal flusso CMS.

### GitHub e autenticazione

- Creare una GitHub OAuth App per l'host CMS.
- Ospitare un proxy OAuth HTTPS mantenuto, con endpoint `/auth` e `/callback`.
  Il backend GitHub richiede infatti un componente server-side per completare
  l'autenticazione; Decap documenta anche l'opzione di un edge worker leggero.
- Conservare client secret e chiavi esclusivamente nel secret store del
  provider OAuth. Nessun segreto deve comparire in `config.yml`, nel client,
  nel repository o in variabili `NEXT_PUBLIC_*`.
- Usare account nominativi, vietare account condivisi e richiedere 2FA
  nell'organizzazione GitHub.
- Proteggere il branch di pubblicazione con pull request, almeno una review,
  status check obbligatori, conversazioni risolte e force-push disabilitato.
  GitHub consente di applicare questi controlli con branch protection o
  ruleset.

Con il backend GitHub standard, gli utenti devono avere accesso push al
repository. Questo è un limite di privilegio importante: per un repository
privato l'eventuale `auth_scope: repo` amplia ulteriormente l'accesso. Prima
dell'attivazione va quindi verificato se tutti gli editor possono legittimamente
vedere il codice. `open_authoring` può ridurre i permessi di scrittura usando
fork e pull request, ma va valutato separatamente e non sostituisce il controllo
degli accessi al repository privato.

Riferimenti:
[backend GitHub e OAuth](https://decapcms.org/docs/github-backend/),
[proxy OAuth](https://decapcms.org/docs/backends-overview/),
[open authoring](https://decapcms.org/docs/open-authoring/) e
[branch protection GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

### Componenti futuri

- Bundle Decap CMS con versione esatta e aggiornamenti pianificati. Va
  preferita una dipendenza bloccata nel lockfile rispetto a uno script CDN con
  versione mobile.
- `config.yml` con backend `github`, branch esplicito, collezioni file e
  `publish_mode: editorial_workflow`.
- Proxy OAuth gestito o edge worker minimo basato su un'implementazione
  mantenuta; non va sviluppato un backend custom. Il proxy non è un backend
  contenuti e non conserva menu.
- Validazione Zod dei file e test statici per anchor, duplicati, campi vuoti,
  prezzi e contenuti vietati.
- Preview visuale Decap e preview completa generata dalla build.
- Monitoraggio di dipendenze, OAuth e workflow, con un owner tecnico.

Il proxy locale `decap-server` è utile per sviluppo senza toccare GitHub, ma
Decap specifica che in tale modalità l'editorial workflow non è supportato:
serve quindi solo per verificare schema e interfaccia, non per collaudare il
processo di approvazione.

## Flusso editoriale raccomandato

1. L'editor accede al CMS con il proprio account GitHub.
2. Seleziona Hawaii o MUULab e modifica soltanto i campi esposti.
3. Il CMS esegue i controlli di campo e mostra una preview editoriale rapida.
4. `Salva bozza` crea o aggiorna un branch `cms/...` e la relativa pull request;
   nessuna modifica raggiunge Aruba.
5. La CI valida schema, TypeScript, test statici, lint e build dell'export
   statico.
6. La CI pubblica una preview isolata per commit e collega URL e stato alla
   pull request.
7. Il reviewer confronta diff, preview e menu approvato, poi approva. Le regole
   GitHub, non la sola interfaccia CMS, devono impedire l'auto-approvazione.
8. La pull request viene unita solo con tutti i controlli verdi.
9. Il commit unito aggiorna la preview GitHub Pages di integrazione.
10. La pubblicazione Aruba resta una fase separata e approvata, eseguita sullo
    SHA verificato.

Decap traduce l'editorial workflow in branch, commit e pull request; ogni
salvataggio successivo aggiorna la stessa bozza. Per una cronologia pulita si
può usare lo squash merge dopo aver verificato che sia compatibile con le
regole del repository.

## Preview

Servono due livelli distinti:

### Preview editoriale

Una custom preview Decap deve riprodurre almeno:

- locale, titolo e descrizione;
- categorie nell'ordine effettivo;
- nome piatto, nota e prezzo;
- warning per prezzi mancanti o liste vuote.

Questa preview è immediata ma non è autorevole: non esegue l'intera
applicazione Next.js e non sostituisce build, test o verifica responsive. Decap
supporta template e stili preview personalizzati tramite
`registerPreviewTemplate` e `registerPreviewStyle`.

### Preview completa

Ogni commit della pull request deve produrre l'export statico reale. Il workflow
Pages attuale parte solo da push su branch specifici e pubblica un unico sito:
non è quindi una preview isolata per bozza.

La fase futura dovra:

- aggiungere una pipeline PR dedicata;
- pubblicare ogni preview in un percorso o progetto Pages separato, identificato
  da PR e SHA, senza sovrascrivere la preview condivisa;
- impostare un commit status stabile, ad esempio
  `hawaii/menu-preview`, e configurarlo come `preview_context` Decap;
- applicare `noindex`, accesso coerente con la visibilità del repository e una
  retention breve;
- rimuovere la preview quando la pull request viene chiusa.

Se GitHub Pages non consente isolamento e accesso adeguati, va usato un provider
di deploy preview con autenticazione. Non si deve pubblicare una bozza menu su
un URL pubblico indicizzabile solo per mantenere Pages come tecnologia.

Riferimenti:
[custom preview Decap](https://decapcms.org/docs/customization/) e
[deploy preview del backend GitHub](https://decapcms.org/docs/github-backend/).

## Sicurezza

- **Minimo privilegio:** gli editor possono proporre modifiche, ma il merge e il
  deploy Aruba richiedono un reviewer autorizzato.
- **Segreti:** client secret OAuth solo server-side, rotazione documentata e
  revoca immediata quando cambia un fornitore o un responsabile.
- **Sessioni:** HTTPS obbligatorio, callback OAuth con allowlist esatta,
  validazione di `state` e origine dei messaggi, cookie sicuri se usati dal
  proxy.
- **Hardening CMS:** host separato o route protetta, `noindex`, CSP restrittiva,
  `frame-ancestors 'none'`, dipendenze bloccate e aggiornamenti monitorati.
- **Integrita:** branch protection, status check obbligatori, niente push
  diretto, niente force-push e deploy soltanto da SHA verificati.
- **Validazione:** lunghezze massime, campi obbligatori, allowlist degli anchor,
  URL sicuri, prezzo come testo controllato e rifiuto di HTML arbitrario.
- **Media:** dimensione e tipi limitati; nessun upload di eseguibili, SVG non
  fidati, video o asset voluminosi dal CMS.
- **Audit:** commit, pull request, review e workflow costituiscono il registro
  minimo. Per audit avanzato, ruoli granulari o approvazioni multilivello serve
  un prodotto più strutturato.

## Rollback e incidenti

Prima del merge, il rollback consiste nel chiudere la pull request o ripristinare
la bozza: il sito pubblico non cambia.

Dopo il merge:

1. creare una pull request di `git revert` del commit CMS interessato;
2. eseguire gli stessi test e approvazioni della modifica originale;
3. aggiornare la preview Pages con il commit di revert;
4. rigenerare l'artifact Aruba dallo SHA verificato;
5. pubblicare Aruba solo dopo approvazione;
6. documentare causa, impatto e correzione, senza riscrivere la cronologia.

Per un ripristino urgente va mantenuto l'ultimo artifact Aruba noto come buono,
associato al relativo SHA e con retention definita. Non si deve usare
force-push, modificare a mano i file sul server o riaprire un vecchio artifact
senza verificarne provenienza e integrità.

## Costi e limiti

### Costi

- Decap CMS: nessun costo licenza.
- GitHub: dipende da visibilità del repository, piano, minuti Actions, artifact
  e policy dell'organizzazione. I runner standard sono gratuiti per repository
  pubblici; i repository privati usano quote incluse e poi fatturazione.
- OAuth: possibile costo minimo per worker/serverless, dominio, log e gestione
  segreti.
- Preview: possibile costo di hosting, banda e retention.
- Progetto: costo iniziale di estrazione dati, schema, UI, test, accessi,
  formazione e runbook; costo ricorrente per aggiornamenti e incident response.

### Limiti

- Il backend GitHub standard richiede permessi push agli editor.
- Git non gestisce bene molte modifiche simultanee allo stesso file; per questo
  si propone un file per locale.
- Non ci sono collaborazione real-time, scheduling editoriale robusto, RBAC
  granulare o localizzazione avanzata.
- Il backend GitHub Decap non supporta Git LFS: media grandi devono restare fuori
  dal flusso.
- Le API GitHub applicano rate limit; per utenti autenticati il limite primario
  ordinario è 5.000 richieste/ora, condiviso con altre operazioni effettuate con
  le credenziali dell'utente.
- Una build per ogni salvataggio può consumare minuti CI e creare code; va
  applicato debounce/cancel-in-progress dove possibile.
- La disponibilità del CMS dipende da GitHub e dal proxy OAuth, ma il sito
  pubblico continua a servire l'ultimo export valido.

Riferimenti:
[costi GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[rate limit GitHub](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
e [limite Git LFS del backend Decap](https://decapcms.org/docs/github-backend/).

## Fase futura di implementazione

L'attivazione va suddivisa in passi piccoli e reversibili:

1. **Decisioni preliminari:** confermare visibilità repository, branch target,
   editor/reviewer, provider OAuth, host CMS, target preview e processo Aruba.
2. **Dati strutturati:** estrarre Hawaii e MUULab in file separati, aggiungere
   schema Zod e mantenere invariato il rendering della pagina.
3. **Regressioni:** testare ordine, anchor, duplicati, campi obbligatori, prezzi,
   contenuti vietati, typecheck, lint e build Aruba.
4. **Proof of concept locale:** configurare le sole collezioni menu e verificare
   modifica, riordino e round-trip senza attivare autenticazione o deploy.
5. **CMS protetto:** aggiungere bundle Decap, configurazione, OAuth server-side,
   CSP, `noindex` e accessi nominativi.
6. **Governance GitHub:** attivare editorial workflow, branch protection,
   reviewer obbligatorio e squash policy.
7. **Preview PR:** creare preview isolate per SHA, status check e collegamento
   Decap; mantenere Aruba separato e manualmente approvato.
8. **Pilot:** formare due utenti, eseguire modifica, review, pubblicazione e
   rollback in ambiente non produttivo.
9. **Go-live controllato:** pubblicare una modifica menu reale, verificare Pages
   e Aruba, poi chiudere il runbook con owner e tempi di ripristino.

## Criteri di accettazione futuri

La soluzione potra essere considerata pronta quando:

- un editor modifica nome, prezzo e ordine senza toccare codice;
- ogni salvataggio crea una bozza versionata e non pubblica direttamente;
- dati non validi bloccano la CI con un errore comprensibile;
- la preview completa corrisponde all'export statico e non è indicizzata;
- nessun segreto è presente nel client o nel repository;
- un reviewer diverso dall'autore approva prima del merge;
- il deploy Aruba richiede approvazione esplicita e uno SHA verificato;
- il rollback tramite revert e artifact noto viene provato e documentato;
- il sito pubblico resta disponibile se CMS, OAuth o GitHub non sono
  raggiungibili.
