'use strict';
const $ = (selector) => document.querySelector(selector);
const connectionStatus = $('#connectionStatus');
const connectionDot = $('#connectionDot');
const toast = $('#toast');
let toastTimer;
function updateConnectionStatus(){
  const online = navigator.onLine;
  connectionStatus.textContent = online ? 'Connesso a Internet' : 'Offline · interfaccia disponibile';
  connectionDot.classList.toggle('online', online);
  connectionDot.classList.toggle('offline', !online);
}
function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();
document.querySelectorAll('[data-category]').forEach(button => {
  button.addEventListener('click', () => showToast(`Categoria “${button.querySelector('.category-name').textContent}”: il collegamento al database arriva nel prossimo passaggio.`));
});
let installPrompt = null;
const installButton = $('#installButton');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.classList.remove('hidden');
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    showToast('Su iPhone: apri Condividi in Safari e scegli “Aggiungi alla schermata Home”.');
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.classList.add('hidden');
});
window.addEventListener('appinstalled', () => showToast('OUR DATABASE è stata installata.'));
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.error('Service Worker non registrato:', error));
  });
}
