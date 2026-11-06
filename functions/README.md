# OUR DATABASE — backend Google Sheets

Questo backend sostituisce Google Apps Script. Google Sheets resta il database principale.

## Requisiti iniziali

- Progetto Firebase già creato: `our-database-2026`.
- Piano Firebase Blaze attivo per distribuire Cloud Functions.
- Firebase Authentication con provider **Anonymous** abilitato.
- Firestore creato in modalità produzione; le regole del repository negano l'accesso diretto dai client.
- Google Sheets API abilitata nello stesso progetto Google Cloud.
- Google Sheets API abilitata nel progetto Google Cloud.
- Il foglio Google condiviso in modifica con l'identità runtime delle Cloud Functions: `1025401069308-compute@developer.gserviceaccount.com`.
- La tabella USERS deve contenere `User_ID`, `Nome`, `Email`, `Attivo`; per l'accesso anonimo l'email non viene usata. I profili ammessi sono `USR-001` e `USR-002`.
- Node.js 22 e Firebase CLI.

## Configurazione locale

1. Copiare `.firebaserc.example` in `.firebaserc` e inserire l'ID progetto Firebase.
2. Copiare `functions/.env.example` in `functions/.env`.
3. Impostare `ODB_SPREADSHEET_ID` con l'ID del Google Sheet (la parte tra `/d/` e `/edit` nell'indirizzo del foglio).
4. Impostare `ODB_ALLOWED_ORIGINS` con gli origin effettivi dell'app. Per Capacitor Android l'origin tipico è `https://localhost`; va verificato sul dispositivo.
5. Creare un codice di attivazione lungo e casuale, conservarlo fuori dal repository e impostarlo come secret: `firebase functions:secrets:set ODB_PAIRING_CODE`.
6. Abilitare Authentication → Sign-in method → Anonymous nella console Firebase.
7. Creare il database Firestore e pubblicare le regole: `firebase deploy --only firestore:rules`.
8. Installare dipendenze: `cd functions && npm install`.
9. Deploy: `firebase deploy --only functions:sheetsApi`.

Le Cloud Functions usano Application Default Credentials dell'identità runtime Google Cloud. Per il progetto attuale, condividere il foglio Google con `1025401069308-compute@developer.gserviceaccount.com` come Editor. Non inserire chiavi JSON di service account nel repository.

## API

Endpoint: `https://europe-west1-<PROJECT_ID>.cloudfunctions.net/sheetsApi`

Richiesta POST JSON con header `Authorization: Bearer <Firebase ID token>`:

```json
{ "action": "getItems", "payload": {} }
```

Azioni compatibili con il vecchio backend: `getUsers`, `getCategories`, `getItems`, `getItemsByCategory`, `getItemDetails`, `createItem`, `updateItem`, `toggleFavorite`, `saveItemDetails`, `deleteItem`.

Il client crea una sessione Firebase anonima. Il primo abbinamento richiede un codice segreto e uno dei due profili (`USR-001` Mario, `USR-002` Luisa). Il backend registra l'UID Firebase in `authorizedDevices` e accetta al massimo due dispositivi attivi. Il profilo è associato lato server al dispositivo.

## Note

- Nessun dato viene migrato: le schede esistenti restano dove sono.
- Non eliminare o disattivare Apps Script finché la nuova app non è stata configurata e collaudata.
- Il codice di attivazione non va inserito nell'app, nel repository o in `functions/.env`: va conservato e comunicato solo ai due dispositivi. La ri-autorizzazione di un dispositivo dopo reinstallazione richiede una gestione manuale della voce `authorizedDevices`.

Le notifiche push sono uno step successivo.
