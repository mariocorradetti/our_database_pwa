# OUR DATABASE PWA

Prima base installabile della PWA OUR DATABASE.

## File
- `index.html`: struttura dell'interfaccia.
- `styles.css`: interfaccia mobile-first, con testo grande.
- `app.js`: stato connessione, messaggi UI, installazione e registrazione Service Worker.
- `manifest.json`: nome, icone e impostazioni di installazione.
- `service-worker.js`: cache della shell per apertura offline.
- `icons/`: icone app.

## Stato attuale
Questa versione è un prototipo frontend: **non è ancora collegata a Google Sheets/Drive**. Le categorie mostrano un messaggio informativo. Il collegamento al backend Apps Script sarà il passo successivo.

## Pubblicazione
Pubblicare dalla branch `main`, cartella `/ (root)` in GitHub Pages. Gli asset usano percorsi relativi per funzionare anche sotto il percorso del repository.
