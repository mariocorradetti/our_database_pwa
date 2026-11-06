"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
setGlobalOptions({ region: "europe-west1", maxInstances: 5 });

const SHEETS = {
  USERS: "USERS",
  CATEGORIES: "CATEGORIES",
  ITEMS: "ITEMS",
  ITEM_DETAILS: "ITEM_DETAILS",
  PHOTOS: "PHOTOS",
  SETTINGS: "SETTINGS"
};

const spreadsheetId = () => {
  const value = process.env.ODB_SPREADSHEET_ID;
  if (!value) throw new Error("Configurazione mancante: ODB_SPREADSHEET_ID.");
  return value;
};

let sheetsClientPromise;
function getSheetsClient() {
  if (!sheetsClientPromise) {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    sheetsClientPromise = auth.getClient().then(client =>
      google.sheets({ version: "v4", auth: client })
    );
  }
  return sheetsClientPromise;
}

function quoteSheet(name) {
  return "'" + String(name).replace(/'/g, "''") + "'";
}

function isTrue(value) {
  return value === true || String(value).toUpperCase() === "TRUE";
}

async function readTable(name) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: quoteSheet(name) + "!A:Z",
    valueRenderOption: "FORMATTED_VALUE"
  });
  const values = response.data.values || [];
  if (!values.length) return { headers: [], rows: [] };
  return { headers: values[0], rows: values.slice(1) };
}

function objectFromRow(headers, row) {
  const result = {};
  headers.forEach((header, index) => { result[header] = row[index] ?? ""; });
  return result;
}

function rowFromObject(headers, object, fallback = []) {
  return headers.map((header, index) =>
    object[header] !== undefined ? object[header] : (fallback[index] ?? "")
  );
}

async function getSheetId(name) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
    fields: "sheets.properties"
  });
  const found = (response.data.sheets || []).find(
    sheet => sheet.properties && sheet.properties.title === name
  );
  if (!found) throw new Error('Foglio "' + name + '" non trovato.');
  return found.properties.sheetId;
}

async function appendRows(name, rows) {
  if (!rows.length) return;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: quoteSheet(name) + "!A:Z",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows }
  });
}

async function updateRow(name, rowNumber, values) {
  const sheets = await getSheetsClient();
  const endColumn = columnLetter(values.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: quoteSheet(name) + "!A" + rowNumber + ":" + endColumn + rowNumber,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] }
  });
}

function columnLetter(n) {
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result || "A";
}

async function deleteRowNumbers(name, rowNumbers) {
  if (!rowNumbers.length) return;
  const sheetId = await getSheetId(name);
  const sheets = await getSheetsClient();
  const requests = [...new Set(rowNumbers)]
    .sort((a, b) => b - a)
    .map(rowNumber => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowNumber - 1,
          endIndex: rowNumber
        }
      }
    }));
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { requests }
  });
}

function activeUserRow(table, email) {
  const normalized = String(email || "").trim().toLowerCase();
  const index = table.headers.indexOf("Email");
  if (index < 0) throw new Error('Nel foglio USERS manca la colonna "Email".');
  return table.rows.find(row =>
    String(row[index] || "").trim().toLowerCase() === normalized &&
    isTrue(row[3])
  );
}

async function requireAppUser(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Autenticazione richiesta. Accedi con Google.");
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(match[1]);
  } catch (_) {
    throw new Error("Sessione non valida o scaduta. Accedi nuovamente.");
  }
  if (!decoded.email || decoded.email_verified !== true) {
    throw new Error("L'account Google deve avere un indirizzo email verificato.");
  }
  const users = await readTable(SHEETS.USERS);
  const row = activeUserRow(users, decoded.email);
  if (!row) throw new Error("Questo account non è autorizzato a usare OUR DATABASE.");
  return { uid: decoded.uid, email: decoded.email, name: row[1], row };
}

function newItemId() {
  return "ITEM-" + require("crypto").randomBytes(4).toString("hex").toUpperCase();
}

async function getItems() {
  const table = await readTable(SHEETS.ITEMS);
  return table.rows.filter(row => row[0] !== undefined && row[0] !== "")
    .map(row => objectFromRow(table.headers, row));
}

async function findItemRow(itemId) {
  const table = await readTable(SHEETS.ITEMS);
  const idIndex = table.headers.indexOf("ID");
  if (idIndex < 0) throw new Error('Nel foglio ITEMS manca la colonna "ID".');
  const rowIndex = table.rows.findIndex(row => String(row[idIndex]).trim() === String(itemId).trim());
  if (rowIndex < 0) throw new Error("Elemento non trovato: " + itemId);
  return { table, row: table.rows[rowIndex], rowNumber: rowIndex + 2 };
}

async function routeAction(action, payload, user) {
  switch (action) {
    case "getUsers": {
      const table = await readTable(SHEETS.USERS);
      return table.rows.filter(row =>
        String(row[0] || "").trim() !== "USR-000" && isTrue(row[3])
      ).map(row => ({ User_ID: row[0], Nome: row[1] }));
    }
    case "getCategories": {
      const table = await readTable(SHEETS.CATEGORIES);
      return table.rows.filter(row => isTrue(row[3]))
        .map(row => objectFromRow(table.headers, row));
    }
    case "getItems":
      return await getItems();
    case "getItemsByCategory": {
      const category = String(payload.categoryId || "").trim().toUpperCase();
      if (!category) return [];
      return (await getItems()).filter(item =>
        String(item.Categoria || "").trim().toUpperCase() === category
      );
    }
    case "getItemDetails": {
      if (!payload.itemId) return {};
      const table = await readTable(SHEETS.ITEM_DETAILS);
      const details = {};
      table.rows.forEach(row => {
        if (String(row[0]).trim() === String(payload.itemId).trim()) details[row[1]] = row[2] ?? "";
      });
      return details;
    }
    case "createItem": {
      const item = payload.item || {};
      if (!item.Categoria) throw new Error("Categoria obbligatoria.");
      if (!item.Titolo) throw new Error("Titolo obbligatorio.");
      const table = await readTable(SHEETS.ITEMS);
      const now = new Date().toISOString();
      const record = {
        ID: newItemId(),
        Categoria: item.Categoria,
        Titolo: item.Titolo,
        Stato: item.Stato || "",
        Preferito: item.Preferito === true,
        Descrizione: item.Descrizione || "",
        Valutazione_Tu: item.Valutazione_Tu || "",
        Valutazione_Luisa: item.Valutazione_Luisa || "",
        Creato_Da: user.name,
        Creato_Il: now,
        Modificato_Da: user.name,
        Modificato_Il: now
      };
      await appendRows(SHEETS.ITEMS, [rowFromObject(table.headers, record)]);
      return { success: true, item: record };
    }
    case "updateItem": {
      const item = payload.item || {};
      if (!item.ID) throw new Error("ID elemento mancante.");
      const found = await findItemRow(item.ID);
      const updated = { ...objectFromRow(found.table.headers, found.row) };
      ["Categoria", "Titolo", "Stato", "Preferito", "Descrizione",
       "Valutazione_Tu", "Valutazione_Luisa"].forEach(key => {
        if (item[key] !== undefined) updated[key] = item[key];
      });
      updated.Modificato_Da = user.name;
      updated.Modificato_Il = new Date().toISOString();
      await updateRow(SHEETS.ITEMS, found.rowNumber,
        rowFromObject(found.table.headers, updated, found.row));
      return { success: true, itemId: item.ID };
    }
    case "toggleFavorite": {
      const itemId = payload.itemId;
      if (!itemId) throw new Error("ID elemento mancante.");
      const found = await findItemRow(itemId);
      const headers = found.table.headers;
      const favoriteIndex = headers.indexOf("Preferito");
      if (favoriteIndex < 0) throw new Error('Colonna "Preferito" non trovata.');
      const updated = found.row.slice();
      const favorite = !isTrue(updated[favoriteIndex]);
      updated[favoriteIndex] = favorite;
      const byIndex = headers.indexOf("Modificato_Da");
      const atIndex = headers.indexOf("Modificato_Il");
      if (byIndex >= 0) updated[byIndex] = user.name;
      if (atIndex >= 0) updated[atIndex] = new Date().toISOString();
      await updateRow(SHEETS.ITEMS, found.rowNumber, updated);
      return { success: true, favorite, itemId };
    }
    case "saveItemDetails": {
      const itemId = payload.itemId;
      if (!itemId) throw new Error("ID elemento mancante.");
      const table = await readTable(SHEETS.ITEM_DETAILS);
      const rowsToDelete = [];
      table.rows.forEach((row, index) => {
        if (String(row[0]).trim() === String(itemId).trim()) rowsToDelete.push(index + 2);
      });
      await deleteRowNumbers(SHEETS.ITEM_DETAILS, rowsToDelete);
      const details = payload.details || {};
      const rows = Object.keys(details).filter(key =>
        details[key] !== undefined && details[key] !== null && String(details[key]).trim() !== ""
      ).map(key => [itemId, key, String(details[key])]);
      await appendRows(SHEETS.ITEM_DETAILS, rows);
      return { success: true, itemId, fieldsSaved: rows.length };
    }
    case "deleteItem": {
      const itemId = String(payload.itemId || "").trim();
      if (!itemId) throw new Error("ID elemento mancante.");
      const found = await findItemRow(itemId);
      const photos = await readTable(SHEETS.PHOTOS);
      const photoRows = [];
      photos.rows.forEach((row, index) => {
        if (String(row[1]).trim() === itemId) photoRows.push(index + 2);
      });
      const details = await readTable(SHEETS.ITEM_DETAILS);
      const detailRows = [];
      details.rows.forEach((row, index) => {
        if (String(row[0]).trim() === itemId) detailRows.push(index + 2);
      });
      // Rimuove prima le righe collegate, poi la voce principale.
      await deleteRowNumbers(SHEETS.PHOTOS, photoRows);
      await deleteRowNumbers(SHEETS.ITEM_DETAILS, detailRows);
      await deleteRowNumbers(SHEETS.ITEMS, [found.rowNumber]);
      return { success: true, itemId };
    }
    default:
      throw new Error("Azione API non riconosciuta: " + action);
  }
}

const allowedOrigins = () => (process.env.ODB_ALLOWED_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

exports.sheetsApi = onRequest({ cors: false, timeoutSeconds: 60, memory: "256MiB" }, async (req, res) => {
  const origin = req.get("origin") || "";
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Max-Age", "3600");
  } else if (origin) {
    res.status(403).json({ ok: false, error: "Origine non autorizzata." });
    return;
  }

  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Usa POST." }); return; }

  try {
    const user = await requireAppUser(req);
    const body = req.body || {};
    const data = await routeAction(String(body.action || ""), body.payload || {}, user);
    res.status(200).json({ ok: true, data, user: { name: user.name } });
  } catch (error) {
    logger.warn("OUR DATABASE API request rejected/failed", {
      message: error.message,
      action: req.body && req.body.action
    });
    const status = /autenticazione|sessione|account|autorizzato|origine/i.test(error.message) ? 401 : 400;
    res.status(status).json({ ok: false, error: error.message || "Errore backend." });
  }
});
