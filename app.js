'use strict';
const $ = (selector) => document.querySelector(selector);
const connectionStatus = $('#connectionStatus');
const connectionDot = $('#connectionDot');
let installPrompt = null;
const installButton = $('#installButton');
function updateConnectionStatus(){
  const online = navigator.onLine;
  connectionStatus.textContent = online ? 'Connessione Internet disponibile' : 'Sei offline: per aprire il database serve Internet';
  connectionDot.classList.toggle('online', online);
  connectionDot.classList.toggle('offline', !online);
}
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.classList.remove('hidden');
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    alert('Su iPhone: apri Condividi in Safari e scegli “Aggiungi alla schermata Home”.');
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.classList.add('hidden');
});
window.addEventListener('appinstalled', () => {
  installButton.classList.add('hidden');
});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.error('Service Worker non registrato:', error));
  });
}
