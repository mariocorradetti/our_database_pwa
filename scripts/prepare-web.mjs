import { mkdir, copyFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "index.html");
const targetDir = resolve(root, "www");
const target = resolve(targetDir, "index.html");

const html = await readFile(source, "utf8");
if (!html.includes("https://script.google.com/macros/s/")) {
  throw new Error("Endpoint Google Apps Script non trovato in index.html. Build interrotta per evitare un APK non collegato al database.");
}
if (!html.includes("OUR_DATABASE_API_KEY")) {
  throw new Error("Configurazione chiave API non trovata. Build interrotta.");
}

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);
console.log("Web app pronta: www/index.html");
