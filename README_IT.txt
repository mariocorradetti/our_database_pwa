OUR DATABASE — PWA installabile (prima versione wrapper)
=======================================================

PACCHETTO
- index.html: shell PWA che apre la Web App Apps Script in un iframe.
- manifest.webmanifest: nome, icone, colori e modalità standalone.
- sw.js: service worker per la shell statica. Non mette in cache i dati del database.
- icons/: icone PNG per Android e iOS.
- apps-script/Code.gs e apps-script/Index.html: copia dei file Apps Script della versione mobile preparata in precedenza.

ARCHITETTURA
La shell PWA viene pubblicata su un hosting HTTPS statico. L'app esistente rimane una Web App Apps Script e viene mostrata dentro la shell. Questo approccio conserva google.script.run senza ripristinare l'API HTTP personalizzata.

PRIMA DI PUBBLICARE
1. Distribuisci la Web App Apps Script. L'URL deve terminare in /exec.
2. Apri index.html con un editor di testo.
3. Sostituisci INSERISCI_QUI_URL_WEB_APP_APPS_SCRIPT nel valore di DATABASE_URL con l'URL completo. Non modificare le virgolette.
4. Salva il file.
5. Se non hai già aggiornato Apps Script, importa apps-script/Code.gs nel file Code.gs e apps-script/Index.html nel file HTML chiamato Index. Salva e crea una nuova versione della Web App.

PUBBLICAZIONE CON GITHUB PAGES
1. Crea un repository GitHub, ad esempio our-database-pwa.
2. Carica nella radice del repository index.html, manifest.webmanifest, sw.js e la cartella icons/. La cartella apps-script è solo una copia di riferimento e non è necessaria su GitHub Pages.
3. In GitHub: Settings > Pages > Build and deployment, scegli Deploy from a branch, seleziona main e /(root), poi Save.
4. Attendi che GitHub Pages mostri l'URL HTTPS pubblicato. Non usare file://: il service worker richiede HTTPS (oppure localhost per test).
5. Apri l'URL pubblicato su entrambi i telefoni.

INSTALLAZIONE IPHONE
1. Apri l'URL pubblicato con Safari.
2. Tocca Condividi.
3. Seleziona Aggiungi alla schermata Home e conferma.

INSTALLAZIONE ANDROID
1. Apri l'URL pubblicato in Chrome.
2. Apri il menu ⋮ e scegli Installa app oppure Aggiungi a schermata Home (il testo varia secondo il dispositivo).

LIMITAZIONI IMPORTANTI
- Questo è un wrapper PWA: l'interfaccia applicativa viene ancora caricata dal dominio Apps Script dentro un iframe. La PWA shell è installabile, ma il database richiede internet.
- Safari/iOS o alcuni browser possono bloccare l'autenticazione Google o i cookie in un iframe cross-site. Se l'app resta vuota o mostra una pagina di login nel riquadro, premi “Apri direttamente”. Se anche così non funziona bene, serve una seconda fase: spostare l'intera UI fuori dall'iframe e realizzare un endpoint backend con autenticazione adeguata. Non rendere pubblici i dati per aggirare il problema.
- Non è stata effettuata una prova end-to-end sui dispositivi reali o sul tuo deployment Apps Script. L'evento load dell'iframe non garantisce che l'applicazione interna abbia completato l'accesso.
- L'accesso ai dati continua a dipendere dalle impostazioni della Web App Apps Script. La selezione del profilo non è autenticazione.
- Il service worker mette in cache soltanto i file statici della shell; non salva né espone in cache i dati privati del database.

TEST OBBLIGATORI
Da entrambi i telefoni provare apertura/login, categorie, schede, creazione/modifica, preferiti, foto e cancellazione. Verificare che ogni modifica sia visibile anche sull'altro dispositivo.
