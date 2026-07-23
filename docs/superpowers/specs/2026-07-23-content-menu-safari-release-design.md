# Hawaii: correzioni contenuti, menu e compatibilita Safari

## Obiettivo

Applicare le correzioni annotate dal cliente prima della pubblicazione su GitHub Pages, senza alterare l'impianto visuale approvato e mantenendo ogni intervento reversibile.

## Homepage immersiva

- I tag `video` non devono ricevere scale o traslazioni CSS: Safari desktop deve mantenere lo stesso crop prima, durante e dopo l'avvio.
- L'effetto prospettico resta disponibile per poster e immagini statiche.
- CTA, menu di scena e Soul Rail restano sopra i layer video e cliccabili su tablet prima, durante e dopo lo scroll.
- Gli eventi pointer/touch del player non devono cancellare o bloccare il click dei controlli interattivi.
- La verifica copre Safari desktop, viewport tablet portrait/landscape e stato `moving`.

## Pagina Villaggio

- Le anime diventano cinque: Beach, Restaurant, Sport, MUULab Riviera, Nightlife.
- MUULab Riviera usa la braceria in terrazza e collega a `/terrazza`.
- La card Eventi/Nightlife viene renderizzata per ultima e occupa entrambe le colonne da `sm` in su.
- Titoli introduttivi e contatore passano da quattro a cinque.
- Il ristorante di mare viene descritto esplicitamente come disponibile a pranzo e a cena.
- Ogni riferimento a panini e fritti al cono viene rimosso.

## Pagina Menu

- Le quattro card iniziali diventano link interni accessibili:
  - Ristorante Mare -> `#ristorante-mare`
  - MUULab Riviera -> `#muulab`
  - Cocktail -> `#cocktail`
  - Carta vini -> `#carta-vini`
- La navigazione usa anchor native e `scroll-margin`; con riduzione movimento resta immediata.
- Le categorie `Fritti al cono` e `Special panini` vengono eliminate.
- La card `Bevande, birre e cantina` contiene un pulsante `Carta dei vini` collegato alla relativa risorsa.
- Accanto a `Prenota MUULab` viene aggiunto `Menu MUULab completo`, con apertura sicura del PDF ufficiale:
  `https://www.muulab.it/wp-content/uploads/easy-pdf-restaurant-menu/menu-files/muulab.-menu-general.pdf`
- I link esterni usano `target="_blank"` e `rel="noopener noreferrer"`.

## Eventi

- Ogni riferimento al vecchio `Giovedi in terrazza` viene eliminato da homepage, pagina terrazza, pagina eventi, sommari e FAQ.
- Il format ricorrente diventa `Giovedi Posh`.
- Il copy indica che la serata si svolge negli spazi esterni al piano terra e, in caso di pioggia, in veranda.
- Non viene pubblicato un orario non confermato.
- La CTA porta alle informazioni eventi via WhatsApp, non alla prenotazione della terrazza.

## Back office

Non viene introdotto in questo rilascio. La soluzione raccomandata e un CMS Git-backed leggero dopo il deploy Aruba:

- contenuti menu/eventi estratti in file dati validati;
- interfaccia Decap CMS protetta da autenticazione GitHub;
- anteprima Pages automatica su commit;
- deploy Aruba separato e approvato;
- nessun database o backend custom.

Questa soluzione riduce costi, rischi e manutenzione rispetto a WordPress headless o a un pannello proprietario.

## Verifica e rilascio

- Test statici aggiornati per impedire il ritorno dei contenuti rimossi.
- Test anchor e CTA tablet.
- Lint, TypeScript, unit test journey, build Next e pacchetto Aruba.
- Commit dedicato alle correzioni contenuto/UX.
- Push fast-forward sulla branch `claude/codex-handoff-assets-se8fjq`.
- Controllo workflow e artifact GitHub Pages prima della chiusura.
