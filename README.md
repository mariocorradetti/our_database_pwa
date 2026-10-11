# OUR DATABASE PWA — collegata alla Web App Apps Script

Questa versione mantiene una PWA installabile su GitHub Pages che apre la Web App Google Apps Script esistente. Non duplica né sposta il database.

## Come funziona
- `index.html`: schermata di accesso con il pulsante **Apri il database**.
- `app.js`: stato della connessione, installazione PWA e registrazione Service Worker.
- `styles.css`: interfaccia mobile-first con testo grande.
- `manifest.json` e `service-worker.js`: installazione e cache della schermata di accesso.
- `icons/`: icone PWA.

## Pubblicazione su GitHub Pages
1. Estrai lo ZIP.
2. Nel repository `out_database_pwa`, carica e sostituisci i file contenuti nella cartella `our_database_pwa/` nella root del repository.
3. Mantieni la cartella `icons/` e tutti i file indicati.
4. Attendi la pubblicazione di GitHub Pages e ricarica la pagina. Se vedi la vecchia versione, chiudi e riapri la PWA oppure svuota la cache del sito.

## Nota importante sull'autenticazione
Il pulsante apre la Web App Apps Script già esistente, dove rimangono le funzioni attuali. Il deployment `Esegui come me` usa i permessi del proprietario; selezionare un nome nell'interfaccia non autentica davvero l'account Google. Non inserire token o segreti in questo repository pubblico.

Questa soluzione è un collegamento/launcher, non un'API integrata nel frontend GitHub. Per mantenere l'interfaccia interamente su GitHub Pages e usare autenticazione individuale occorre progettare un'API con verifica dell'identità lato server.
