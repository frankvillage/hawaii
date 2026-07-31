# Rilascio Aruba reversibile

Il rilascio definitivo usa esclusivamente l'artefatto verificato in
`output/aruba-static`. WordPress non viene cancellato e il database non viene
modificato. Il preflight del 31 luglio 2026 ha verificato il server FTPS
canonico `ftplnx02.aruba.it`, la document root `/www.hawaiipescara.it` e la
cartella di backup esistente `old`.

## Credenziali

Le credenziali non devono essere salvate nel repository. Il deployer accetta:

- `ARUBA_FTP_NETRC`, percorso assoluto a un file netrc locale con permessi 600;
- oppure `ARUBA_FTP_USER` e `ARUBA_FTP_PASSWORD`;
- su macOS, se la password non è nell'ambiente, una voce Keychain per host e
  utente indicati.

La connessione FTPS è obbligatoria. `ARUBA_FTP_TLS=allow-plain` esiste solo per
diagnostica e non deve essere usato in produzione.

## Verifica e rilascio

```bash
node scripts/aruba-release.mjs inspect
ARUBA_REQUIRE_CLEAN=1 npm run build:web:aruba
npm run test:web:aruba
node scripts/aruba-release.mjs deploy
```

Il deployer:

1. inventaria la document root e verifica la presenza di `old`;
2. protegge `old` con un deny HTTP autonomo e carica la nuova release in uno
   staging datato;
3. scrive hash SHA-256 e inventario in un manifest locale;
4. sposta ogni elemento della root, esclusa `old`, in un backup datato;
5. promuove in root gli elementi statici già caricati;
6. scarica nuovamente tutti gli entrypoint HTML e ne confronta byte e hash
   SHA-256 con l'artefatto locale prima di confermare il rilascio;
7. conserva una copia del manifest nel backup WordPress.

Se backup o promozione falliscono, gli spostamenti completati vengono invertiti.
Il deploy non esegue comandi SQL e non rimuove file remoti.

## Aggiornamenti successivi

Dopo il primo rilascio, una nuova versione statica si pubblica con:

```bash
ARUBA_REQUIRE_CLEAN=1 npm run build:web:aruba
npm run test:web:aruba
npm run deploy:aruba:update
```

L'aggiornamento riutilizza la directory `media` già online, carica e verifica
singolarmente HTML e asset applicativi in uno staging protetto dentro `old`,
quindi archivia la release attiva in `old/static-pre-*` prima della promozione.
In questo modo i video non vengono duplicati e la versione precedente resta
ripristinabile tramite il manifest locale generato dal comando.

Se Aruba interrompe lo staging restituendo un file vuoto, la produzione non
viene modificata. La release può riprendere dal primo percorso non completato:

```bash
npm run deploy:aruba:resume -- output/aruba-releases/<release-id>.json <percorso>
```

La ripresa conserva i file già verificati e usa un nome temporaneo diverso per
ogni nuovo tentativo, evitando di riutilizzare un oggetto FTP vuoto.

## Riparazione atomica degli entrypoint

Se una verifica successiva rileva pagine incomplete, gli entrypoint possono
essere ricaricati senza sovrascrivere direttamente la produzione:

```bash
node scripts/aruba-release.mjs repair-entrypoints output/aruba-releases/<release-id>.json
```

Il comando verifica prima l'hash di ogni file temporaneo, archivia la versione
attiva in `old/replaced-*`, promuove un entrypoint alla volta e ripristina
automaticamente la relativa versione precedente se il controllo finale fallisce.

## Ripristino

Ogni manifest resta in `output/aruba-releases` sulla macchina di rilascio e nel
backup remoto. Per ripristinare:

```bash
node scripts/aruba-release.mjs rollback output/aruba-releases/<release-id>.json
```

La release statica corrente viene spostata in una cartella `failed-*` dentro
`old`; i file WordPress vengono rimessi nella loro posizione originale. Il
rollback si interrompe se trova elementi inattesi nella root.
