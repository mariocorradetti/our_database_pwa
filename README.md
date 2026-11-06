# OUR DATABASE

App Android per Mario e Luisa. L'app usa il Google Sheet esistente come database e il deployment Google Apps Script già configurato come API. Non richiede Firebase, Cloud Functions, Cloudflare o nuovi account.

## Architettura attiva

```
OUR DATABASE Android (Capacitor)
             |
             | HTTPS / JSONP
             v
Google Apps Script API già esistente
             |
             v
Google Sheets esistente
```

- Frontend: `index.html` (HTML, CSS e JavaScript).
- Android: Capacitor 8.
- Backend: deployment Google Apps Script già presente nell'HTML.
- Database: Google Sheets già in uso.
- Build APK: GitHub Actions, usando il repository GitHub già esistente.

## Nessuna migrazione dei dati

Il foglio Google non viene copiato né ricreato. Il progetto mantiene il riferimento al deployment Apps Script già usato dall'app e la schermata iniziale per inserire la chiave API `OUR_DATABASE_API_KEY`. La chiave viene salvata nel solo archivio locale del dispositivo; non va mai committata nel repository.

## Creazione APK

La workflow GitHub Actions prepara automaticamente `www/index.html`, genera la piattaforma Android con Capacitor e compila l'APK debug.

1. Aprire la scheda **Actions** del repository.
2. Selezionare **Build OUR DATABASE Android APK**.
3. Premere **Run workflow** se non è partita automaticamente dopo un commit.
4. Aprire il run completato e scaricare l'artifact **OUR-DATABASE-APK**.
5. Estrarre lo ZIP: contiene `app-debug.apk`.

L'APK generato dal branch di lavoro usa un identificativo separato (`it.ourdatabase.app.preview`) e il nome **OUR DATABASE Preview**: può essere installato accanto all'app attuale senza sovrascriverla. La build da `main`, invece, usa l'identificativo definitivo `it.ourdatabase.app`. Per pubblicazione sul Play Store servirebbe una build firmata separatamente.

## Sviluppo locale

Requisiti: Node.js 22 e Android Studio / Android SDK.

```bash
npm install
npm run prepare:web
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

Il progetto Android generato è escluso da Git tramite `.gitignore`; non serve committarlo perché GitHub Actions lo ricrea ad ogni build.

## Note operative e sicurezza

- Non disattivare o eliminare il deployment Apps Script esistente.
- Non modificare le proprietà dello script o il foglio Google durante la build.
- Non inserire la chiave API, password, token o file di credenziali nel repository.
- La chiave API dell'endpoint è un segreto condiviso tra i due dispositivi: il backend Apps Script deve validarla su ogni richiesta e limitare le operazioni consentite.
- La selezione Mario/Luisa nell'interfaccia identifica il profilo applicativo; non equivale a un'autenticazione forte del dispositivo.
- Le quote gratuite di Apps Script e Google Sheets si applicano comunque; l'uso resta soggetto ai limiti Google.
- Firebase e il piano Blaze non sono usati da questa architettura. I vecchi file di configurazione Firebase sono stati rimossi da questo ramo, non dal progetto Firebase nella console.
