# Aruba Static Readiness

## Stato

Il frontend puo essere esportato come sito statico alla radice del dominio, senza il prefisso `/hawaii` usato da GitHub Pages. Il pacchetto viene generato in `output/aruba-static` e include una configurazione Apache prudente per cache, range request video e header di sicurezza.

## Generazione

```bash
npm run build:web:aruba
```

Lo script lavora in una directory temporanea, esclude le route Next.js sotto `src/app/api`, non modifica il sorgente e verifica automaticamente pagine, video e base path. Il contenuto di `output/aruba-static` e la directory da caricare nella document root Aruba.

## Requisiti hosting da confermare

- Hosting Linux con Apache e supporto `.htaccess`.
- HTTPS attivo sul dominio definitivo.
- Range request HTTP abilitate per i file MP4.
- Moduli Apache `headers`, `mime` e `deflate`, con fallback sicuro se non disponibili.
- Accesso FTP/SFTP e possibilita di sostituire atomicamente la document root.

## Blocco form

I form attuali non inviano e non consegnano email: le route Next.js validano il payload e rispondono con esito positivo, ma non integrano ancora SMTP o un servizio di recapito. Nell'export statico tali route non esistono.

Prima del go-live bisogna scegliere una soluzione:

1. Endpoint PHP su Aruba con validazione server-side, honeypot, rate limiting e invio SMTP autenticato.
2. Endpoint esterno HTTPS con CORS limitato al dominio Hawaii.
3. Sostituzione temporanea dei form con flussi WhatsApp e telefono gia verificati.

Credenziali SMTP, password e token devono restare fuori dal repository. Anche il logging del consenso remoto richiede un endpoint; la preferenza locale nel browser continua invece a funzionare.

## Verifica pre-deploy

```bash
node tests/aruba-static-readiness.js output/aruba-static
```

Verificare inoltre sul server reale:

- risposta `206 Partial Content` a una richiesta Range sul video;
- MIME `video/mp4`;
- caricamento di `/prenotazioni/`, `/menu/` e `/terrazza/` con refresh diretto;
- TheFork dopo consenso;
- cache HTML disabilitata e cache asset attiva;
- form collegati al backend scelto;
- redirect HTTPS e dominio canonico.

## Rollback

Conservare una copia della document root precedente e caricare ogni release in una directory versionata. Il passaggio definitivo deve avvenire solo dopo smoke test sul dominio o su un sottodominio di staging Aruba.
