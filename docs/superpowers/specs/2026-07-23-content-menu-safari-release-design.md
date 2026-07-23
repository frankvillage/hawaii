# Hawaii: correzioni contenuti, menu e compatibilita Safari

## Obiettivo

Applicare le correzioni annotate dal cliente prima della pubblicazione su GitHub Pages, senza alterare l'impianto visuale approvato e mantenendo ogni intervento reversibile.

## Homepage immersiva

- I tag `video` non devono ricevere scale o traslazioni CSS: Safari desktop deve mantenere lo stesso crop prima, durante e dopo l'avvio.
- Entrambi i layer forward/reverse devono avere `transform: none`; bounding box, `object-fit` e `object-position` devono restare invariati negli stati fermo, moving e cambio direzione.
- L'effetto prospettico resta disponibile per poster e immagini statiche.
- CTA, menu di scena e Soul Rail restano sopra i layer video e cliccabili su tablet prima, durante e dopo lo scroll.
- Gli eventi pointer/touch del player non devono cancellare o bloccare il click dei controlli interattivi.
- La verifica bloccante copre viewport tablet 768x1024 e 1024x768, CTA primaria/menu/Soul Rail e stato `moving`.
- Dopo il deploy e richiesta la conferma su Safari desktop fisico per crop e zoom; l'automazione non viene presentata come sostituto.

## Pagina Villaggio

- Le anime diventano cinque: Beach, Restaurant, Sport, MUULab Riviera, Nightlife.
- L'ordine esatto e Beach, Restaurant, Sport, MUULab Riviera, Nightlife.
- MUULab Riviera usa la braceria in terrazza e collega a `/terrazza`.
- Soltanto la card finale Eventi/Nightlife occupa entrambe le colonne da `sm` in su.
- Titoli introduttivi e contatore passano da quattro a cinque.
- Il ristorante di mare viene descritto esplicitamente come disponibile a pranzo e a cena.
- Ogni riferimento a panini e fritti al cono viene rimosso da categorie, scene, menu rapidi, caption, summary e Villaggio, inclusi sandwich, hot dog e bao.

## Pagina Menu

- Le quattro card iniziali diventano link interni accessibili:
  - Ristorante Mare -> `#ristorante-mare`
  - MUULab Riviera -> `#muulab`
  - Cocktail -> `#cocktail`
  - Carta vini -> `#carta-vini`
- `#cocktail` viene applicato alla categoria MUULab `Cocktail e aperitivo`; `#carta-vini` alla card Hawaii `Bevande, birre e cantina`.
- La navigazione usa anchor native univoche, focus visibile e `scroll-margin`; con riduzione movimento resta immediata.
- Le categorie `Fritti al cono` e `Special panini` vengono eliminate.
- La card `Bevande, birre e cantina` contiene un pulsante `Carta dei vini` collegato al PDF ufficiale MUULab, che include la carta completa.
- Accanto a `Prenota MUULab` viene aggiunto `Menu MUULab completo`, con apertura sicura del PDF ufficiale:
  `https://www.muulab.it/wp-content/uploads/easy-pdf-restaurant-menu/menu-files/muulab.-menu-general.pdf`
- I link esterni usano `target="_blank"` e `rel="noopener noreferrer"`.

## Eventi

- Ogni riferimento al vecchio `Giovedi in terrazza` viene eliminato da homepage, pagina terrazza, pagina eventi, sommari e FAQ.
- Il format ricorrente diventa `Giovedi Posh`.
- Copy approvato: `La serata del giovedi negli spazi esterni di Hawaii, con dj set e tavoli sotto le stelle. In caso di pioggia, Posh si sposta in veranda.`
- Non viene pubblicato un orario non confermato.
- La CTA porta alle informazioni eventi via WhatsApp, non alla prenotazione della terrazza.
- Vengono rimossi ovunque orario, CTA terrazza, posizione in terrazza, champagne, crudi e musica dal vivo associati al format precedente, inclusi source, pagine renderizzate, FAQ/schema e sommari.

## Back office

Non viene introdotto in questo rilascio. La valutazione e soltanto documentale: nessuna modifica a `studio/`, route admin, dipendenze, variabili ambiente, autenticazione, workflow o configurazione deploy. La soluzione raccomandata e un CMS Git-backed leggero dopo il deploy Aruba:

- contenuti menu/eventi estratti in file dati validati;
- interfaccia Decap CMS protetta da autenticazione GitHub;
- anteprima Pages automatica su commit;
- deploy Aruba separato e approvato;
- nessun database o backend custom.

Questa soluzione riduce costi, rischi e manutenzione rispetto a WordPress headless o a un pannello proprietario.

## Verifica e rilascio

- Test statici aggiornati per impedire il ritorno dei contenuti rimossi.
- Test negativi su source e artifact per categorie, scene, caption, summary, Villaggio, sandwich, hot dog, bao e vecchio format del giovedi.
- Test per ordine/destinazione/span delle cinque card, unicita degli anchor, focus, click, riduzione movimento e CTA tablet.
- Lint, TypeScript, unit test journey, build Next e pacchetto Aruba.
- Commit dedicato alle correzioni contenuto/UX.
- `git fetch origin`, verifica che la branch remota sia antenata di `HEAD`, quindi push fast-forward `HEAD:claude/codex-handoff-assets-se8fjq`.
- Controllo workflow e artifact GitHub Pages prima della chiusura.
- Il push avvia automaticamente Pages; l'utente ha autorizzato esplicitamente la pubblicazione dopo queste correzioni.
