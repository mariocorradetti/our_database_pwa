OUR DATABASE — APP ANDROID/PWA CON INTERFACCIA LOCALE
=======================================================

ARCHITETTURA ATTUALE
- index.html contiene tutta l'interfaccia di OUR DATABASE e viene eseguito localmente dentro l'app.
- L'app NON apre più una Web App Apps Script dentro un iframe.
- Google Apps Script viene usato soltanto come API di collegamento a Google Sheets: non mostra schermate e non ospita l'interfaccia.
- I fogli restano quelli esistenti: ITEMS, ITEM_DETAILS, PHOTOS, CATEGORIES, USERS e SETTINGS.
- L'app richiede una connessione internet per leggere e salvare i dati condivisi.

COLLEGAMENTO API
L'URL API è configurato in index.html. La prima volta che l'app viene avviata chiede la chiave API:
- La chiave deve corrispondere alla proprietà script OUR_DATABASE_API_KEY in Apps Script > Impostazioni progetto > Proprietà script.
- Viene salvata solo nella memoria locale del dispositivo (localStorage), non nel repository GitHub e non nel sorgente dell'APK.
- Per cambiare la chiave, cancellare i dati locali dell'app oppure rimuovere la voce localStorage "our_database_api_key_v1" dagli strumenti di sviluppo del browser.

IMPORTANTE SULLA SICUREZZA
Questa prima integrazione usa la chiave API condivisa già prevista dal backend Apps Script. È adatta a una prova privata sui due telefoni, ma non equivale ancora ad autenticazione Google individuale: chi possiede la chiave può invocare le operazioni API. Non pubblicare la chiave e non distribuirla a persone non autorizzate. La selezione del profilo Mario/Luisa nell'interfaccia non costituisce da sola autenticazione.

REQUISITI BACKEND
La Web App Apps Script deve avere il codice API che gestisce doGet(e), ourDatabaseApi_ e le azioni:
getUsers, getCategories, getItems, getItemsByCategory, getItemDetails,
createItem, updateItem, toggleFavorite, saveItemDetails, deleteItem.
Nelle proprietà script deve essere presente OUR_DATABASE_API_KEY.
La Web App deve essere ridistribuita dopo ogni modifica del codice Apps Script, mantenendo l'URL /exec configurato in index.html.

BUILD ANDROID
Il workflow .github/workflows/build-android.yml:
1. prepara la cartella www con l'interfaccia locale;
2. genera il progetto Android Capacitor;
3. genera le icone launcher Android partendo da icons/icon-512.png (girasole);
4. compila l'APK debug e lo pubblica come artifact GitHub Actions.

Il branch free-google-sheets-app genera l'app Preview; il branch main genera l'app OUR DATABASE definitiva. Le build debug non hanno ancora una chiave di firma stabile: per aggiornare l'app senza disinstallarla in futuro dovremo configurare una chiave Android release dedicata.

ICONA E FUNZIONI NON ANCORA IMPLEMENTATE
- L'icona ufficiale è il girasole presente in icons/icon-512.png; viene usata anche per generare le risorse launcher Android.
- Il caricamento e la gestione delle foto non sono implementati in questa versione.

TEST DA ESEGUIRE
Su entrambi i telefoni verificare:
- apertura dell'interfaccia e risposta touch;
- caricamento utenti, categorie ed elementi;
- creazione, modifica ed eliminazione;
- preferiti e valutazioni;
- dettagli e sincronizzazione delle modifiche tra i due dispositivi.
