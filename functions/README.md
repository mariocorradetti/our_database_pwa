# OUR DATABASE — backend Google Sheets

Questo backend sostituisce Google Apps Script. Google Sheets resta il database principale.

## Requisiti iniziali

- Un progetto Firebase collegato a un progetto Google Cloud.
- Firebase Authentication con provider Google abilitato.
- Google Sheets API abilitata nello stesso progetto Google Cloud.
- Il foglio Google condiviso in modifica con l'identità di servizio usata dalle Cloud Functions.
- La tabella USERS deve contenere le colonne `User_ID`, `Nome`, `Email`, `Attivo` (la quarta colonna deve essere TRUE per gli utenti autorizzati).
- Node.js 22 e Firebase CLI.

## Configurazione locale

1. Copiare `.firebaserc.example` in `.firebaserc` e inserire l'ID progetto Firebase.
2. Copiare `functions/.env.example` in `functions/.env`.
3. Impostare `ODB_SPREADSHEET_ID` con l'ID del Google Sheet (la parte tra `/d/` e `/edit` nell'indirizzo del foglio).
4. Impostare `ODB_ALLOWED_ORIGINS` con gli origin effettivi dell'app. Per Capacitor Android l'origin tipico è `https://localhost`; va verificato sul dispositivo.
5. Installare dipendenze: `cd functions && npm install`.
6. Deploy: `firebase deploy --only functions:sheetsApi`.

Le Cloud Functions usano Application Default Credentials dell'identità runtime Google Cloud. Non inserire chiavi JSON di service account nel repository. Concedere a tale identità accesso di modifica al foglio Google e abilitare Google Sheets API.

## API

Endpoint: `https://europe-west1-<PROJECT_ID>.cloudfunctions.net/sheetsApi`

Richiesta POST JSON con header `Authorization: Bearer <Firebase ID token>`:

```json
{ "action": "getItems", "payload": {} }
```

Azioni compatibili con il vecchio backend: `getUsers`, `getCategories`, `getItems`, `getItemsByCategory`, `getItemDetails`, `createItem`, `updateItem`, `toggleFavorite`, `saveItemDetails`, `deleteItem`.

L'utente viene identificato dal token Firebase e confrontato con l'email presente nel foglio USERS. Il nome passato dal client non viene usato come identità.

## Note

- Nessun dato viene migrato: le schede esistenti restano dove sono.
- Non eliminare o disattivare Apps Script finché la nuova app non è stata configurata e collaudata.
- Le notifiche push sono uno step successivo: prima si completa e verifica l'accesso autenticato a Sheets.
